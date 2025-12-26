from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from database.database import mongo_db
from database.models_mongo import PrescriptionData, InventoryItem
from bson import ObjectId
from database.models_sql import User, UserRole
from database.database import get_db
from sqlalchemy.orm import Session
from auth.auth import get_current_user, Hash
from database.models_sql import User, UserRole

router = APIRouter(
    tags=["Doctor-Patient Interaction"]
)

# Helper
def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def serialize_list(cursor):
    return [serialize_doc(doc) for doc in cursor]

# --- Prescriptions ---

@router.post("/doctor/prescriptions", response_model=dict)
async def create_prescription(presc: PrescriptionData):
    try:
        # Verify appointment exists (Optional but recommended)
        # appt = await mongo_db.appointments.find_one({"_id": ObjectId(presc.appointment_id)})
        # if not appt: raise HTTPException(404, "Appointment not found")
        
        result = await mongo_db.prescriptions.insert_one(presc.dict())
        return {"id": str(result.inserted_id), "message": "Prescription created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/prescriptions/{patient_id}", response_model=List[dict])
async def get_patient_prescriptions(patient_id: str):
    cursor = mongo_db.prescriptions.find({"patient_id": patient_id})
    prescriptions = await cursor.to_list(length=100)
    return serialize_list(prescriptions)

@router.get("/doctor/prescriptions/{doctor_id}", response_model=List[dict])
async def get_doctor_prescriptions(doctor_id: str):
    cursor = mongo_db.prescriptions.find({"doctor_id": doctor_id})
    prescriptions = await cursor.to_list(length=100)
    return serialize_list(prescriptions)

# --- Assigned Patients ---

@router.get("/doctor/patients/{doctor_id}", response_model=List[str])
async def get_assigned_patients(doctor_id: str):
    try:
        # Find all unique patient_ids from appointments for this doctor
        pipeline = [
            {"$match": {"doctor_id": doctor_id}},
            {"$group": {"_id": "$patient_id"}},
        ]
        cursor = mongo_db.appointments.aggregate(pipeline)
        patients = []
        return patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doctor/search_patients", response_model=List[dict])
def search_patients(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Search for patients by name or ID"""
    if not q:
        return []
    
    # Relaxed search: Find users whose username matches query. 
    # We temporarily remove strict role filtering to ensure we find "Patient" vs "patient" 
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%")
    ).limit(10).all()
    
    # Filter only those that look like patients
    filtered_users = [u for u in users if u.role == UserRole.patient]
    
    return [
        {"id": u.username, "label": f"{u.username} (ID: {u.id})", "username": u.username, "db_id": u.id}
        for u in filtered_users
    ]

@router.get("/doctor/search_medicines", response_model=List[str])
async def search_medicines(q: str):
    """Search for medicines"""
    # If q is empty, return all/top medicines (for client-side cache)
    query = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
        
    cursor = mongo_db.inventory.find(query).limit(50)
    medicines = await cursor.to_list(length=50)
    return [m["name"] for m in medicines]

@router.get("/doctor/patient_profile/{patient_id}")
async def get_patient_profile_for_doctor(patient_id: str):
    """Get patient profile for doctor view"""
    profile = await mongo_db.patient_profiles.find_one({"patient_id": patient_id})
    if not profile:
        return {"patient_id": patient_id, "message": "No profile found"}
    return serialize_doc(profile)
