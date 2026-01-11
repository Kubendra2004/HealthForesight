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
        appt_patients = await cursor.to_list(length=1000)
        appt_pids = [p["_id"] for p in appt_patients]

        # Find explicitly assigned patients
        assign_cursor = mongo_db.assignments.find({"doctor_id": doctor_id})
        assignments = await assign_cursor.to_list(length=1000)
        assign_pids = [a["patient_id"] for a in assignments]

        # Merge and Unique
        all_patients = list(set(appt_pids + assign_pids))
        return all_patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doctor/search_patients", response_model=List[dict])
def search_patients(q: Optional[str] = None, db: Session = Depends(get_db)):
    """Search for patients by name/ID. Returns recent/all if q is empty."""
    query = db.query(User).filter(User.role == UserRole.patient)
    
    if q:
        query = query.filter(User.username.ilike(f"%{q}%"))
        
    users = query.limit(50).all()
    
    return [
        {"id": u.username, "label": f"{u.username} (ID: {u.id})", "username": u.username, "db_id": u.id}
        for u in users
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
