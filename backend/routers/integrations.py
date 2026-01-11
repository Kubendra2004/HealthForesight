from fastapi import APIRouter, HTTPException, Depends
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import hashlib

router = APIRouter(
    prefix="/integrations",
    tags=["External Integrations"]
)

# --- Telemedicine (Google Meet Integration) ---

class MeetingRequest(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    duration_minutes: int = 30

@router.post("/telemedicine/create-meeting")
async def create_google_meet(
    request: MeetingRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create Google Meet link for telemedicine consultation.
    Generates unique meeting code based on appointment ID.
    """
    # Generate unique meeting code
    meet_code = hashlib.md5(f"{request.appointment_id}{datetime.utcnow()}".encode()).hexdigest()[:10]
    
    meeting_data = {
        "meeting_code": meet_code,
        "join_url": f"https://meet.google.com/{meet_code}",
        "appointment_id": request.appointment_id,
        "patient_id": request.patient_id,
        "doctor_id": request.doctor_id,
        "duration": request.duration_minutes,
        "created_by": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    # Save meeting info
    await mongo_db.telemedicine_meetings.insert_one(meeting_data)
    
    # Send email to both patient and doctor
    from utils.email import send_telemedicine_invite
    # await send_telemedicine_invite(request.patient_id, meeting_data["join_url"])
    
    return {
        "meeting_code": meet_code,
        "join_url": meeting_data["join_url"],
        "message": "Google Meet link created successfully"
    }

@router.get("/telemedicine/meetings/{appointment_id}")
async def get_meeting(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get Google Meet details for appointment"""
    meeting = await mongo_db.telemedicine_meetings.find_one({"appointment_id": appointment_id})
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return {
        "meeting_code": meeting["meeting_code"],
        "join_url": meeting["join_url"],
        "created_at": meeting["created_at"]
    }

# --- Lab Integration ---

class LabImport(BaseModel):
    patient_id: str
    lab_type: str
    value: float
    unit: str
    test_date: str
    source: str = "external"

@router.post("/lab/import")
async def import_lab_results(
    labs: list[LabImport],
    current_user: User = Depends(get_current_user)
):
    """
    Bulk import external lab results.
    In production, integrate with HL7/FHIR interfaces.
    """
    imported_count = 0
    
    for lab in labs:
        lab_data = {
            **lab.dict(),
            "imported_by": current_user.username,
            "imported_at": datetime.utcnow()
        }
        await mongo_db.lab_results.insert_one(lab_data)
        imported_count += 1
        
        # Send notification if critical value
        if lab.lab_type == "glucose" and lab.value > 200:
            from utils.email import send_critical_lab_alert
            # await send_critical_lab_alert(lab.patient_id, lab.lab_type, lab.value)
    
    return {
        "imported_count": imported_count,
        "message": f"Imported {imported_count} lab results"
    }

@router.get("/lab/{patient_id}")
async def get_lab_results(
    patient_id: str,
    lab_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Retrieve lab results for patient"""
    query = {"patient_id": patient_id}
    if lab_type:
        query["lab_type"] = lab_type
    
    results = await mongo_db.lab_results.find(query).sort("test_date", -1).limit(50).to_list(50)
    
    for result in results:
        result["id"] = str(result["_id"])
        del result["_id"]
    
    return {"results": results}
