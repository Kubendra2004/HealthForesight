from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import re
from uuid import uuid4
from datetime import datetime
from database.database import mongo_db
from database.models_mongo import NotificationData
from database.models_sql import User, UserRole
from auth.auth import get_current_user
from auth.authorization import require_patient_access
from bson import ObjectId
import PyPDF2
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

router = APIRouter(
    prefix="/files",
    tags=["File Management"]
)

UPLOAD_DIR = "uploads"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(patient_id: str = Form(...), file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        await require_patient_access(patient_id, current_user)
        # Save file
        original_filename = os.path.basename(file.filename or "upload")
        original_filename = re.sub(r"[^A-Za-z0-9._ -]", "_", original_filename).strip(" .") or "upload"
        filename = f"{uuid4().hex}_{original_filename}"
        file_path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))
        contents = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds the 10 MB upload limit")
        
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
            
        # Save metadata to MongoDB
        report_data = {
            "patient_id": patient_id,
            "filename": original_filename,
            "storage_filename": filename,
            "file_path": file_path,
            "uploaded_at": datetime.utcnow(),
            "processed": False
        }
        result = await mongo_db.reports.insert_one(report_data)
        
        return {"id": str(result.inserted_id), "message": "File uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/{report_id}")
async def process_report(report_id: str, current_user: User = Depends(get_current_user)):
    try:
        if not ObjectId.is_valid(report_id):
            raise HTTPException(status_code=400, detail="Invalid report ID")
        report = await mongo_db.reports.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        await require_patient_access(report.get("patient_id", ""), current_user)
            
        file_path = report["file_path"]
        extracted_text = ""
        
        # 1. Extract Text (Simple PDF extraction)
        if file_path.endswith(".pdf"):
            try:
                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        extracted_text += page.extract_text()
            except Exception as e:
                print(f"Error reading PDF: {e}")
                extracted_text = "Error reading file content."
        else:
            extracted_text = "Image processing not implemented yet."

        # 2. Analyze Text (Mock ML Analysis & Vitals Extraction)
        # In real app, use NLP to extract vitals. Here we use Regex/Keyword search.
        import re
        
        vitals = {}
        
        # Mock Extraction Logic
        # Look for patterns like "Age: 45", "BP: 120/80", "Glucose: 100"
        age_match = re.search(r"Age[:\s]+(\d+)", extracted_text, re.IGNORECASE)
        if age_match: vitals["age"] = int(age_match.group(1))
        
        gender_match = re.search(r"Gender[:\s]+(Male|Female)", extracted_text, re.IGNORECASE)
        if gender_match: vitals["gender"] = gender_match.group(1)
        
        bmi_match = re.search(r"BMI[:\s]+([\d\.]+)", extracted_text, re.IGNORECASE)
        if bmi_match: vitals["bmi"] = float(bmi_match.group(1))
        
        bp_match = re.search(r"BP[:\s]+(\d+/\d+)", extracted_text, re.IGNORECASE)
        if bp_match: vitals["bp"] = bp_match.group(1)
        
        glucose_match = re.search(r"Glucose[:\s]+(\d+)", extracted_text, re.IGNORECASE)
        if glucose_match: vitals["glucose"] = float(glucose_match.group(1))
        
        chol_match = re.search(r"Cholesterol[:\s]+(\d+)", extracted_text, re.IGNORECASE)
        if chol_match: vitals["cholesterol"] = float(chol_match.group(1))

        # Determine Risk based on extracted vitals
        risk_level = "Low"
        if vitals.get("glucose", 0) > 140 or vitals.get("cholesterol", 0) > 240:
            risk_level = "High"
        elif "diabetes" in extracted_text.lower() or "high" in extracted_text.lower():
            risk_level = "High"
            
        summary = f"Analyzed Report: {report['filename']}\nRisk Level: {risk_level}\n"
        summary += f"Extracted Vitals: {vitals}\n\n"
        summary += f"Content Snippet:\n{extracted_text[:200]}..."
        
        # 3. Generate PDF Summary
        summary_filename = f"summary_{report['storage_filename']}.pdf"
        summary_path = os.path.join(UPLOAD_DIR, summary_filename)
        
        c = canvas.Canvas(summary_path, pagesize=letter)
        c.drawString(100, 750, f"Health Summary for Patient ID: {report['patient_id']}")
        c.drawString(100, 730, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(100, 710, f"Risk Assessment: {risk_level}")
        
        y = 680
        c.drawString(100, y, "Extracted Vitals:")
        y -= 20
        for k, v in vitals.items():
            c.drawString(120, y, f"{k.capitalize()}: {v}")
            y -= 15
            
        text_object = c.beginText(100, y - 20)
        for line in summary.split('\n'):
            text_object.textLine(line)
        c.drawText(text_object)
        c.save()
        
        # Update DB
        await mongo_db.reports.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {
                "processed": True,
                "summary_path": summary_path,
                "risk_level": risk_level,
                "extracted_vitals": vitals
            }}
        )

        # --- TRIGGER PREDICTIONS ---
        # If we have useful vitals, let's update the risk models!
        try:
             # Heart Prediction Trigger
             if vitals.get("glucose") or vitals.get("cholesterol"):
                 # Fetch existing profile to fill in gaps
                 profile = await mongo_db.patient_profiles.find_one({"patient_id": report['patient_id']})
                 if profile:
                     # Remove _id
                     if "_id" in profile: del profile["_id"]
                     
                     # Merge new vitals into profile data
                     if vitals.get("glucose"): profile["glucose"] = vitals["glucose"]
                     if vitals.get("cholesterol"): profile["cholesterol"] = vitals["cholesterol"]
                     if vitals.get("bp"): 
                        try:
                            sys, dia = vitals["bp"].split("/")
                            profile["systolic_bp"] = int(sys)
                            profile["diastolic_bp"] = int(dia)
                        except: pass
                     if vitals.get("age"): profile["age"] = vitals["age"]

                     # Recalculate predictions via internal call (mocking API call structure)
                     # In a real microservice architecture, we'd emit an event.
                     # Here we just re-save the profile which triggers nothing, 
                     # so we explicitly call the prediction logic if we want to be fancy,
                     # OR we just rely on the user refreshing the dashboard.
                     # But current user issue is 0% risk. Let's force an update if we can.
                     
                     # Simple Approach: Just update the profile for now, 
                     # so next time they open "Onboarding/Edit" it's there.
                     await mongo_db.patient_profiles.update_one(
                         {"patient_id": report['patient_id']},
                         {"$set": profile}
                     )
        except Exception as trigger_err:
            print(f"Warning: Failed to trigger auto-updates from report: {trigger_err}")
        # ---------------------------
        
        return {
            "message": "Report processed", 
            "risk_level": risk_level, 
            "vitals": vitals,
            "summary_url": f"/files/download/{summary_filename}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_file(filename: str, report_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    safe_filename = os.path.basename(filename)
    if safe_filename != filename:
        raise HTTPException(status_code=400, detail="Invalid file name")
    if report_id:
        if not ObjectId.is_valid(report_id):
            raise HTTPException(status_code=400, detail="Invalid report ID")
        report = await mongo_db.reports.find_one({"_id": ObjectId(report_id)})
        if report and safe_filename not in {report.get("filename"), report.get("storage_filename")}:
            raise HTTPException(status_code=404, detail="File not found")
    else:
        report = await mongo_db.reports.find_one(
            {"$or": [{"filename": safe_filename}, {"storage_filename": safe_filename}, {"summary_path": os.path.join(UPLOAD_DIR, safe_filename)}]},
            sort=[("uploaded_at", -1)],
        )
    if not report:
        raise HTTPException(status_code=404, detail="File not found")
    await require_patient_access(report.get("patient_id", ""), current_user)
    if report.get("summary_path") and os.path.basename(report["summary_path"]) == safe_filename:
        file_path = report["summary_path"]
    else:
        file_path = report.get("file_path")
    upload_root = os.path.abspath(UPLOAD_DIR)
    if not file_path or os.path.commonpath([upload_root, os.path.abspath(file_path)]) != upload_root:
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=report.get("filename", safe_filename))
    raise HTTPException(status_code=404, detail="File not found")

@router.get("/patient/{patient_id}")
async def get_patient_files(patient_id: str, current_user: User = Depends(get_current_user)):
    await require_patient_access(patient_id, current_user)
    cursor = mongo_db.reports.find({"patient_id": patient_id})
    files = await cursor.to_list(length=100)
    for f in files:
        f["id"] = str(f["_id"])
        del f["_id"]
        f.pop("file_path", None)
        f.pop("storage_filename", None)
    return files
