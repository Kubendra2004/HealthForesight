from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
from datetime import datetime
from database.database import mongo_db
from database.models_mongo import NotificationData
from bson import ObjectId
import PyPDF2
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

router = APIRouter(
    prefix="/files",
    tags=["File Management"]
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(patient_id: str, file: UploadFile = File(...)):
    try:
        # Save file
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{patient_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Save metadata to MongoDB
        report_data = {
            "patient_id": patient_id,
            "filename": file.filename,
            "file_path": file_path,
            "uploaded_at": datetime.utcnow(),
            "processed": False
        }
        result = await mongo_db.reports.insert_one(report_data)
        
        return {"id": str(result.inserted_id), "message": "File uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/{report_id}")
async def process_report(report_id: str):
    try:
        report = await mongo_db.reports.find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
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
        summary_filename = f"summary_{report['filename']}.pdf"
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
        
        return {
            "message": "Report processed", 
            "risk_level": risk_level, 
            "vitals": vitals,
            "summary_url": f"/files/download/{summary_filename}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@router.get("/patient/{patient_id}")
async def get_patient_files(patient_id: str):
    cursor = mongo_db.reports.find({"patient_id": patient_id})
    files = await cursor.to_list(length=100)
    for f in files:
        f["id"] = str(f["_id"])
        del f["_id"]
    return files
