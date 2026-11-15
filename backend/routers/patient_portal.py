from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User, UserRole
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import csv
import io

router = APIRouter(
    prefix="/portal",
    tags=["Patient Portal"]
)

# --- Patient Profile ---

class PatientProfile(BaseModel):
    # Core Metrics
    age: int
    gender: str
    height: float
    weight: float
    blood_type: Optional[str] = None
    
    # Lifestyle
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    activity_level: Optional[str] = None
    
    # Vitals
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_level: Optional[int] = None
    
    # Lab Results / Clinical Data (Heart)
    glucose: Optional[float] = None
    fasting_glucose_over_120: Optional[int] = None
    cholesterol: Optional[int] = None
    chest_pain_type: Optional[int] = None  # cp: 0-3
    resting_ecg: Optional[int] = None      # restecg: 0-2
    max_heart_rate: Optional[int] = None   # thalach
    exercise_angina: Optional[int] = None  # exang: 0 or 1
    st_depression: Optional[float] = None  # oldpeak
    st_slope: Optional[int] = None         # slope: 0-2
    major_vessels: Optional[int] = None    # ca: 0-3
    thalassemia: Optional[int] = None      # thal: 0-3
    
    # Lab Results / Clinical Data (Diabetes)
    pregnancies: Optional[int] = None
    insulin: Optional[int] = None
    skin_thickness: Optional[int] = None
    diabetes_pedigree: Optional[float] = None
    
    # Keep missing symptom answers distinct from an explicit "No".
    polyuria: Optional[int] = None
    polydipsia: Optional[int] = None
    sudden_weight_loss: Optional[int] = None
    weakness: Optional[int] = None
    polyphagia: Optional[int] = None
    genital_thrush: Optional[int] = None
    visual_blurring: Optional[int] = None
    itching: Optional[int] = None
    irritability: Optional[int] = None
    delayed_healing: Optional[int] = None
    partial_paresis: Optional[int] = None
    muscle_stiffness: Optional[int] = None
    alopecia: Optional[int] = None
    obesity: Optional[int] = None

    # History
    conditions: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None

# Avoid circular imports by importing inside function or using module reference if needed
# But typically routers import from other routers is fine if structure allows. 
# Safe check: ml_models imports auth/db, not patient_portal.
from .ml_models import predict_heart, predict_diabetes, HeartDiseaseData, DiabetesData

@router.post("/profile")
async def save_patient_profile(
    profile: PatientProfile,
    current_user: User = Depends(get_current_user)
):
    """Save or update patient profile data AND update predictions"""
    profile_data = {
        **profile.dict(),
        "patient_id": current_user.username,
        "updated_at": datetime.utcnow()
    }
    
    # Upsert (update if exists, insert if not)
    await mongo_db.patient_profiles.update_one(
        {"patient_id": current_user.username},
        {"$set": profile_data},
        upsert=True
    )
    # A profile edit invalidates the previous automatic predictions until a
    # complete replacement can be computed, so dashboards cannot show stale risk.
    await mongo_db.heart_predictions.update_many(
        {"patient_id": current_user.username, "superseded": {"$ne": True}},
        {"$set": {"superseded": True}},
    )
    await mongo_db.diabetes_predictions.update_many(
        {"patient_id": current_user.username, "superseded": {"$ne": True}},
        {"$set": {"superseded": True}},
    )

    # Run predictions only when every model input is explicitly present. Missing
    # values must not be converted into normal findings or inferred symptoms.
    heart_fields = {
        "systolic_bp": profile.systolic_bp, "cholesterol": profile.cholesterol,
        "fasting_glucose_over_120": profile.fasting_glucose_over_120,
        "chest_pain_type": profile.chest_pain_type,
        "resting_ecg": profile.resting_ecg, "max_heart_rate": profile.max_heart_rate,
        "exercise_angina": profile.exercise_angina, "st_depression": profile.st_depression,
        "st_slope": profile.st_slope, "major_vessels": profile.major_vessels,
        "thalassemia": profile.thalassemia,
    }
    diabetes_fields = {
        "polyuria": profile.polyuria, "polydipsia": profile.polydipsia,
        "sudden_weight_loss": profile.sudden_weight_loss, "weakness": profile.weakness,
        "polyphagia": profile.polyphagia, "genital_thrush": profile.genital_thrush,
        "visual_blurring": profile.visual_blurring, "itching": profile.itching,
        "irritability": profile.irritability, "delayed_healing": profile.delayed_healing,
        "partial_paresis": profile.partial_paresis, "muscle_stiffness": profile.muscle_stiffness,
        "alopecia": profile.alopecia, "obesity": profile.obesity,
    }
    prediction_status = {"heart": "skipped_missing_inputs", "diabetes": "skipped_missing_inputs"}

    if all(value is not None for value in heart_fields.values()) and profile.gender in {"Male", "Female"}:
        try:
            heart_data = HeartDiseaseData(
                age=profile.age,
                sex=1 if profile.gender == "Male" else 0,
                cp=profile.chest_pain_type,
                trestbps=profile.systolic_bp,
                chol=profile.cholesterol,
                fbs=profile.fasting_glucose_over_120,
                restecg=profile.resting_ecg,
                thalach=profile.max_heart_rate,
                exang=profile.exercise_angina,
                oldpeak=profile.st_depression,
                slope=profile.st_slope,
                ca=profile.major_vessels,
                thal=profile.thalassemia,
            )
            await predict_heart(heart_data, current_user)
            prediction_status["heart"] = "updated"
        except Exception as exc:
            prediction_status["heart"] = "unavailable"
            print(f"Heart profile prediction failed: {exc}")

    elif all(value is not None for value in heart_fields.values()):
        prediction_status["heart"] = "unavailable_unsupported_gender"

    if all(value is not None for value in diabetes_fields.values()):
        try:
            diabetes_data = DiabetesData(
                age=profile.age, gender=profile.gender,
                polyuria=profile.polyuria, polydipsia=profile.polydipsia,
                sudden_weight_loss=profile.sudden_weight_loss, weakness=profile.weakness,
                polyphagia=profile.polyphagia, genital_thrush=profile.genital_thrush,
                visual_blurring=profile.visual_blurring, itching=profile.itching,
                irritability=profile.irritability, delayed_healing=profile.delayed_healing,
                partial_paresis=profile.partial_paresis, muscle_stiffness=profile.muscle_stiffness,
                alopecia=profile.alopecia, obesity=profile.obesity,
            )
            await predict_diabetes(diabetes_data, current_user)
            prediction_status["diabetes"] = "updated"
        except Exception as exc:
            prediction_status["diabetes"] = "unavailable"
            print(f"Diabetes profile prediction failed: {exc}")

    return {
        "success": True,
        "message": "Profile saved. Predictions run only when all required clinical inputs are provided.",
        "prediction_status": prediction_status,
    }

@router.get("/profile")
async def get_patient_profile(current_user: User = Depends(get_current_user)):
    """Retrieve patient profile data"""
    profile = await mongo_db.patient_profiles.find_one(
        {"patient_id": current_user.username}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Remove MongoDB _id
    if "_id" in profile:
        del profile["_id"]
    
    return profile

# --- Health Journal ---

class JournalEntry(BaseModel):
    type: str  # symptom, medication, vital
    value: str
    notes: Optional[str] = None

@router.post("/journal")
async def add_journal_entry(
    entry: JournalEntry,
    current_user: User = Depends(get_current_user)
):
    """Log health journal entry (symptom, medication, vital reading)"""
    journal_data = {
        **entry.dict(),
        "patient_id": current_user.username,
        "date": datetime.utcnow()
    }
    
    result = await mongo_db.health_journal.insert_one(journal_data)
    return {"id": str(result.inserted_id), "message": "Entry logged"}

@router.get("/journal")
async def get_journal_entries(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Retrieve health journal entries"""
    entries = await mongo_db.health_journal.find(
        {"patient_id": current_user.username}
    ).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    
    for entry in entries:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
    
    return {"entries": entries}

# --- Medication Reminders ---

class MedicationReminder(BaseModel):
    medication: str
    dosage: str
    frequency: str  # "daily", "twice_daily", etc.
    time: str  # "08:00"

@router.post("/reminders")
async def set_medication_reminder(
    reminder: MedicationReminder,
    current_user: User = Depends(get_current_user)
):
    """Set medication reminder"""
    reminder_data = {
        **reminder.dict(),
        "patient_id": current_user.username,
        "active": True,
        "created_at": datetime.utcnow()
    }
    
    result = await mongo_db.medication_reminders.insert_one(reminder_data)
    # TODO: Integrate with notification system to send actual reminders
    return {"id": str(result.inserted_id), "message": "Reminder set"}

@router.get("/reminders")
async def get_reminders(current_user: User = Depends(get_current_user)):
    """Get active medication reminders"""
    reminders = await mongo_db.medication_reminders.find(
        {"patient_id": current_user.username, "active": True}
    ).to_list(100)
    
    for reminder in reminders:
        reminder["id"] = str(reminder["_id"])
        del reminder["_id"]
    
    return {"reminders": reminders}

# --- Lab Visualization ---

@router.get("/labs/trends")
async def get_lab_trends(
    lab_type: str,  # "glucose", "bp", "cholesterol"
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """Get time-series lab data for visualization"""
    # TODO: Fetch actual lab results from database
    # For now, return sample data structure
    return {
        "lab_type": lab_type,
        "data_points": [
            {"date": "2024-01-01", "value": 120},
            {"date": "2024-01-15", "value": 115},
            {"date": "2024-02-01", "value": 110}
        ],
        "normal_range": {"min": 70, "max": 140},
        "unit": "mg/dL"
    }

# --- Self-Booking ---

class AppointmentRequest(BaseModel):
    doctor_id: str
    preferred_date: str
    reason: str

@router.post("/appointments/request")
async def request_appointment(
    request: AppointmentRequest,
    current_user: User = Depends(get_current_user)
):
    """Patient-initiated appointment request (requires doctor approval)"""
    
    # Parse preferred date
    try:
        # Handles "2024-01-01T10:00:00" or similar ISO strings
        req_date = datetime.fromisoformat(request.preferred_date.replace("Z", "+00:00"))
        if req_date.tzinfo is not None:
            req_date = req_date.replace(tzinfo=None)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Check for conflicts
    conflict = await mongo_db.appointments.find_one({
        "doctor_id": request.doctor_id,
        "date": {
            "$gt": req_date - timedelta(minutes=15),
            "$lt": req_date + timedelta(minutes=15)
        },
        "status": {"$ne": "Cancelled"}
    })
    
    if conflict:
         raise HTTPException(
            status_code=400, 
            detail="Doctor is not available at this time (Slot taken)."
        )

    appointment_data = {
        **request.dict(),
        "patient_id": current_user.username,
        "status": "pending",
        "requested_at": datetime.utcnow()
    }
    
    result = await mongo_db.appointment_requests.insert_one(appointment_data)
    # TODO: Send notification to doctor
    return {"id": str(result.inserted_id), "message": "Request sent to doctor", "status": "pending"}

@router.get("/appointments/requests")
async def get_appointment_requests(current_user: User = Depends(get_current_user)):
    """Get patient's appointment requests"""
    requests = await mongo_db.appointment_requests.find(
        {"patient_id": current_user.username}
    ).sort("requested_at", -1).to_list(50)
    
    for req in requests:
        req["id"] = str(req["_id"])
        del req["_id"]
    
# --- Prescriptions ---

class Prescription(BaseModel):
    medication: str
    dosage: str
    instructions: str
    prescribed_by: str # Doctor name
    date: datetime

@router.post("/prescriptions")
async def add_prescription(
    prescription: Prescription,
    current_user: User = Depends(get_current_user)
):
    """Add a prescription (Usually done by doctor, but allowing patient upload for MVP)"""
    prescription_data = {
        **prescription.dict(),
        "patient_id": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    result = await mongo_db.prescriptions.insert_one(prescription_data)
    return {"id": str(result.inserted_id), "message": "Prescription added"}

@router.get("/prescriptions")
async def get_prescriptions(current_user: User = Depends(get_current_user)):
    """Get patient prescriptions (Flattened for UI)"""
    cursor = mongo_db.prescriptions.find({"patient_id": current_user.username}).sort("created_at", -1)
    raw_prescriptions = await cursor.to_list(length=100)
    
    flattened_prescriptions = []
    for p in raw_prescriptions:
        doctor_name = p.get("doctor_id", "Unknown")
        date = p.get("date")
        instructions = p.get("instructions", "")
        
        # Handle new format (list of medicines)
        if "medicines" in p and isinstance(p["medicines"], list):
            for med in p["medicines"]:
                flattened_prescriptions.append({
                    "id": str(p["_id"]),
                    "medication": med.get("name", "Unknown"),
                    "dosage": med.get("dosage", ""),
                    "instructions": instructions,
                    "prescribed_by": doctor_name, # In a real app, join with User table for full name
                    "date": date
                })
        # Handle old format (single medication fields if any exist)
        elif "medication" in p:
             flattened_prescriptions.append({
                "id": str(p["_id"]),
                "medication": p.get("medication"),
                "dosage": p.get("dosage"),
                "instructions": p.get("instructions"),
                "prescribed_by": p.get("prescribed_by", doctor_name),
                "date": date
            })

    return flattened_prescriptions

# --- Medical History ---

class MedicalHistory(BaseModel):
    condition: str
    date_diagnosed: str
    status: str # Active, Cured, Managed
    notes: Optional[str] = None

@router.post("/history")
async def add_medical_history(
    history: MedicalHistory,
    current_user: User = Depends(get_current_user)
):
    """Add medical history entry"""
    history_data = {
        **history.dict(),
        "patient_id": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    result = await mongo_db.medical_history.insert_one(history_data)
    return {"id": str(result.inserted_id), "message": "History added"}

@router.get("/history")
async def get_medical_history(current_user: User = Depends(get_current_user)):
    """Get patient medical history"""
    cursor = mongo_db.medical_history.find({"patient_id": current_user.username}).sort("date_diagnosed", -1)
    history = await cursor.to_list(length=100)
    for h in history:
        h["id"] = str(h["_id"])
        del h["_id"]
    return history
