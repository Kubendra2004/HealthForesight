from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from database.database import mongo_db, get_db
from database.models_mongo import AppointmentData, BillData, NotificationData, AssignmentData
from database.models_sql import User, UserRole
from sqlalchemy.orm import Session
from auth.auth import get_current_user
from auth.authorization import require_patient_access, require_roles
from bson import ObjectId
from routers.websocket import notify_user

router = APIRouter(
    prefix="/frontdesk",
    tags=["Frontdesk Operations"]
)

# Helper to convert ObjectId to str
def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def serialize_list(cursor):
    return [serialize_doc(doc) for doc in cursor]

# --- Search ---

@router.get("/search_patients", response_model=List[dict])
def search_patients(q: Optional[str] = None, db: Session = Depends(get_db), _user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk))):
    """Search for patients by name/ID for generic usage. Returns recent/all if q is empty."""
    query = db.query(User).filter(User.role == UserRole.patient)
    
    if q:
        query = query.filter(User.username.ilike(f"%{q}%"))
        
    users = query.limit(50).all()
    
    return [
        {"id": u.username, "label": f"{u.username} (ID: {u.id})", "username": u.username, "db_id": u.id}
        for u in users
    ]

# --- Assignments ---
@router.post("/assign_patient", response_model=dict)
async def assign_patient(
    data: AssignmentData,
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk)),
):
    try:
        patient = db.query(User).filter(User.username == data.patient_id, User.role == UserRole.patient).first()
        doctor = db.query(User).filter(User.username == data.doctor_id, User.role == UserRole.doctor).first()
        if not patient or not doctor:
            raise HTTPException(status_code=404, detail="Patient or doctor account not found")
        # Check if already assigned
        existing = await mongo_db.assignments.find_one({
            "patient_id": data.patient_id,
            "doctor_id": data.doctor_id
        })
        if existing:
            return {"message": "Patient already assigned to this doctor"}
        
        await mongo_db.assignments.insert_one(data.dict())
        return {"message": "Patient assigned successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# --- Appointments ---

@router.post("/appointments", response_model=dict)
async def create_appointment(
    appt: AppointmentData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        patient = db.query(User).filter(User.username == appt.patient_id, User.role == UserRole.patient).first()
        doctor = db.query(User).filter(User.username == appt.doctor_id, User.role == UserRole.doctor).first()
        if not patient or not doctor:
            raise HTTPException(status_code=404, detail="Patient or doctor account not found")
        role = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        if role == UserRole.patient.value:
            if appt.patient_id != current_user.username:
                raise HTTPException(status_code=403, detail="Patients can only book appointments for themselves")
            if appt.status not in {"Scheduled", "Requested"}:
                raise HTTPException(status_code=403, detail="Patients cannot set appointment status")
            appt.status = "Requested"
        elif role not in {UserRole.admin.value, UserRole.frontdesk.value}:
            raise HTTPException(status_code=403, detail="Front desk access required")

        appointment_type = (appt.type or "in-person").strip().lower()
        if appointment_type not in {"in-person", "in person"}:
            raise HTTPException(
                status_code=503,
                detail="Online meeting creation is not configured. Please schedule an in-person visit.",
            )
        appt.type = "in-person"

        # Normalize to naive UTC to avoid comparison errors with DB (which usually stores naive UTC)
        check_date = appt.date
        if check_date.tzinfo is not None:
             check_date = check_date.astimezone(timezone.utc).replace(tzinfo=None)

        # Check for overlapping appointments (15 min buffer)
        conflict = await mongo_db.appointments.find_one({
            "doctor_id": appt.doctor_id,
            "date": {
                "$gt": check_date - timedelta(minutes=15),
                "$lt": check_date + timedelta(minutes=15)
            },
            "status": {"$ne": "Cancelled"}
        })
        
        if conflict:
            raise HTTPException(
                status_code=400, 
                detail="Doctor is not available at this time (Slot taken)."
            )

        # Create appointment
        appt_dict = appt.dict()
        appt_dict["date"] = check_date # Use normalized date
        
        # Insert Appointment
        result = await mongo_db.appointments.insert_one(appt_dict)
        appointment_id = str(result.inserted_id)
        
        # Send confirmation email
        try:
            from utils.email import send_email, appointment_confirmation_email
            
            patient_email = patient.email
            
            subject = "Appointment Confirmed - HealthForesight"
            html = appointment_confirmation_email(
                patient_name=patient.username,
                doctor_name=doctor.username,
                appointment_date=appt.date
            )
            await send_email(patient_email, subject, html)
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
        
        # If status is 'Requested', notify the doctor
        if appt.status == "Requested":
            notification = NotificationData(
                user_id=appt.doctor_id,
                message=f"New appointment request from Patient ID: {appt.patient_id} for {appt.date}",
                type="Appointment",
                read=False,
                date=datetime.utcnow()
            )
            await mongo_db.notifications.insert_one(notification.dict())
            
            # Real-time Notification
            await notify_user(appt.doctor_id, "new_appointment", {
                "message": notification.message,
                "patient_id": appt.patient_id,
                "date": str(appt.date)
            })
            
        return {"id": appointment_id, "message": "Appointment scheduled/requested"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Appointment creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/appointments", response_model=List[dict])
async def get_appointments(doctor_id: Optional[str] = None, patient_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    role = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    if role == UserRole.patient.value:
        if patient_id and patient_id != current_user.username:
            raise HTTPException(status_code=403, detail="Patients can only view their own appointments")
        if doctor_id:
            raise HTTPException(status_code=403, detail="Patients cannot list appointments by doctor")
        patient_id = current_user.username
    elif role == UserRole.doctor.value:
        if doctor_id and doctor_id != current_user.username:
            raise HTTPException(status_code=403, detail="Doctors can only view their own appointments")
        doctor_id = current_user.username
        if patient_id:
            await require_patient_access(patient_id, current_user)
    elif role not in {UserRole.admin.value, UserRole.frontdesk.value}:
        raise HTTPException(status_code=403, detail="Appointment access required")

    query = {}
    if doctor_id:
        query["doctor_id"] = doctor_id
    if patient_id:
        query["patient_id"] = patient_id
        
    cursor = mongo_db.appointments.find(query).sort("date", -1)
    appointments = await cursor.to_list(length=100)
    
    # Ensure dates are UTC for correct frontend sync
    for appt in appointments:
        if "date" in appt and isinstance(appt["date"], datetime):
             # Assume stored dates are UTC (since we strip them on save)
             appt["date"] = appt["date"].replace(tzinfo=timezone.utc)
             
    return serialize_list(appointments)

@router.put("/appointments/{id}")
async def update_appointment(id: str, update_data: dict, current_user: User = Depends(get_current_user)):
    try:
        # Extract status from the request body
        if "status" not in update_data:
            raise HTTPException(status_code=400, detail="Status is required")
            
        status = update_data["status"]
        if status not in {"Requested", "Scheduled", "Confirmed", "Accepted", "Rejected", "Cancelled", "Completed"}:
            raise HTTPException(status_code=400, detail="Invalid appointment status")
        appointment = await mongo_db.appointments.find_one({"_id": ObjectId(id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        role = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        if role == UserRole.doctor.value:
            if appointment.get("doctor_id") != current_user.username:
                raise HTTPException(status_code=403, detail="Doctors can only update their own appointments")
        elif role not in {UserRole.admin.value, UserRole.frontdesk.value}:
            raise HTTPException(status_code=403, detail="Front desk access required")
        result = await mongo_db.appointments.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": status}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"message": "Appointment updated"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/appointments/{id}")
async def delete_appointment(id: str, _user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk))):
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid appointment ID")
        result = await mongo_db.appointments.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"message": "Appointment cancelled"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# --- Billing ---

@router.post("/bills", response_model=dict)
async def create_bill(bill: BillData, current_user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk))):
    try:
        result = await mongo_db.bills.insert_one(bill.dict())
        return {"id": str(result.inserted_id), "message": "Invoice generated"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bills/{patient_id}", response_model=List[dict])
async def get_bills(patient_id: str, current_user: User = Depends(get_current_user)):
    await require_patient_access(patient_id, current_user, allow_frontdesk=True)
    cursor = mongo_db.bills.find({"patient_id": patient_id})
    bills = await cursor.to_list(length=100)
    return serialize_list(bills)

@router.post("/bills/{id}/pay")
async def pay_bill(id: str, _user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk))):
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid Bill ID format")
            
        bill = await mongo_db.bills.find_one({"_id": ObjectId(id)})
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        if bill.get("status") == "Paid":
             return {"message": "Bill is already paid"}

        result = await mongo_db.bills.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": "Paid"}}
        )
        
        if result.modified_count == 0:
             # Should not happen if we checked status above, but good for safety
             raise HTTPException(status_code=500, detail="Failed to update bill status")
             
        return {"message": "Payment processed successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# --- Notifications ---

@router.post("/notifications", response_model=dict)
async def send_notification(notif: NotificationData, _user: User = Depends(require_roles(UserRole.admin, UserRole.frontdesk, UserRole.doctor))):
    try:
        if _user.role == UserRole.doctor:
            await require_patient_access(notif.user_id, _user)
        result = await mongo_db.notifications.insert_one(notif.dict())
        return {"id": str(result.inserted_id), "message": "Notification sent"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications/{user_id}", response_model=List[dict])
async def get_notifications(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.username != user_id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="You can only view your own notifications")
    cursor = mongo_db.notifications.find({"user_id": user_id})
    notifs = await cursor.to_list(length=100)
    return serialize_list(notifs)

@router.put("/notifications/{id}/read")
async def mark_notification_read(id: str, current_user: User = Depends(get_current_user)):
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid notification ID")
        notification = await mongo_db.notifications.find_one({"_id": ObjectId(id)})
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notification.get("user_id") != current_user.username and current_user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="You can only update your own notifications")
        result = await mongo_db.notifications.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"read": True}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"message": "Marked as read"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
