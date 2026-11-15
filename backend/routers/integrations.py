from fastapi import APIRouter, HTTPException, Depends
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User
from database.models_sql import UserRole
from auth.authorization import require_patient_access, require_roles
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId

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
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk, UserRole.doctor))
):
    """Create a meeting once a Google Calendar integration has been configured."""
    appointment = await mongo_db.appointments.find_one({"_id": ObjectId(request.appointment_id)}) if ObjectId.is_valid(request.appointment_id) else None
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.get("patient_id") != request.patient_id or appointment.get("doctor_id") != request.doctor_id:
        raise HTTPException(status_code=400, detail="Appointment participants do not match")
    await require_patient_access(request.patient_id, current_user, allow_frontdesk=True)
    if current_user.role == UserRole.doctor and request.doctor_id != current_user.username:
        raise HTTPException(status_code=403, detail="Doctors can only create meetings for their appointments")

    raise HTTPException(
        status_code=503,
        detail="Google Meet creation is unavailable until a Google Calendar integration is configured.",
    )

@router.get("/telemedicine/meetings/{appointment_id}")
async def get_meeting(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retrieve meeting details after Google Calendar integration is configured."""
    raise HTTPException(
        status_code=503,
        detail="Google Meet is not configured for this deployment.",
    )

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
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.doctor))
):
    """
    Bulk import external lab results.
    In production, integrate with HL7/FHIR interfaces.
    """
    imported_count = 0
    
    for lab in labs:
        await require_patient_access(lab.patient_id, current_user)
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
    await require_patient_access(patient_id, current_user)
    if lab_type:
        query["lab_type"] = lab_type
    
    results = await mongo_db.lab_results.find(query).sort("test_date", -1).limit(50).to_list(50)
    
    for result in results:
        result["id"] = str(result["_id"])
        del result["_id"]
    
    return {"results": results}
