from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from database.database import mongo_db, get_db
from database.models_mongo import AppointmentData, BillData, NotificationData
from database.models_sql import User, UserRole
from sqlalchemy.orm import Session
from auth.auth import get_current_user
from bson import ObjectId

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
def search_patients(q: str, db: Session = Depends(get_db)):
    """Search for patients by name/ID for generic usage"""
    if not q:
        return []

    # Relaxed search: Find users whose username matches query. 
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%")
    ).limit(10).all()
    
    # Filter only those that look like patients
    filtered_users = [u for u in users if u.role == UserRole.patient]
    
    return [
        {"id": u.username, "label": f"{u.username} (ID: {u.id})", "username": u.username, "db_id": u.id}
        for u in filtered_users
    ]

# --- Appointments ---

@router.post("/appointments", response_model=dict)
async def create_appointment(appt: AppointmentData):
    try:
        # Normalize to naive UTC to avoid comparison errors with DB (which usually stores naive UTC)
        check_date = appt.date
        if check_date.tzinfo is not None:
             check_date = check_date.replace(tzinfo=None)

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
        
        # ... rest of logic
        # For now, just logging the error if it fails later
        appt_dict = appt.dict()
        
        # Auto-generate Google Meet link for online appointments
        if appt.type and appt.type.lower() == "online":
            import hashlib
            meet_code = hashlib.md5(f"{appt.patient_id}{appt.doctor_id}{datetime.utcnow()}".encode()).hexdigest()[:10]
            meet_url = f"https://meet.google.com/{meet_code}"
            appt_dict["meet_url"] = meet_url
            
            # Store in telemedicine meetings collection
            meeting_data = {
                "meeting_code": meet_code,
                "join_url": meet_url,
                "appointment_id": str(appt_dict.get("_id", "pending")),
                "patient_id": appt.patient_id,
                "doctor_id": appt.doctor_id,
                "created_at": datetime.utcnow()
            }
            await mongo_db.telemedicine_meetings.insert_one(meeting_data)
        
        # Insert Appointment
        result = await mongo_db.appointments.insert_one(appt_dict)
        appointment_id = str(result.inserted_id)
        
        # Update meeting with actual appointment ID
        if appt.type and appt.type.lower() == "online":
            await mongo_db.telemedicine_meetings.update_one(
                {"meeting_code": meet_code},
                {"$set": {"appointment_id": appointment_id}}
            )
        
        # Send confirmation email
        try:
            from utils.email import send_email, appointment_confirmation_email, send_telemedicine_invite
            
            # TODO: Get patient email from user database
            patient_email = "kubendra2004@gmail.com"  # Recipient email
            
            if appt.type and appt.type.lower() == "online":
                # Send telemedicine invite
                subject = "🎥 Your Virtual Appointment is Scheduled - HealthForesight"
                html = send_telemedicine_invite(
                    patient_name="Patient",  # TODO: Get from user DB
                    meet_url=appt_dict["meet_url"],
                    appointment_date=appt.date
                )
            else:
                # Send regular appointment confirmation
                subject = "✅ Appointment Confirmed - HealthForesight"
                html = appointment_confirmation_email(
                    patient_name="Patient",  # TODO: Get from user DB
                    doctor_name=f"Doctor {appt.doctor_id}",  # TODO: Get from user DB
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
            
        response = {"id": appointment_id, "message": "Appointment scheduled/requested"}
        if appt.type and appt.type.lower() == "online":
            response["meet_url"] = appt_dict["meet_url"]
            response["meet_code"] = meet_code
            
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        with open("k:/Project Programs/healths/backend/error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/appointments", response_model=List[dict])
async def get_appointments(doctor_id: Optional[str] = None, patient_id: Optional[str] = None):
    query = {}
    if doctor_id:
        query["doctor_id"] = doctor_id
    if patient_id:
        query["patient_id"] = patient_id
        
    cursor = mongo_db.appointments.find(query)
    appointments = await cursor.to_list(length=100)
    
    # Ensure dates are UTC for correct frontend sync
    for appt in appointments:
        if "date" in appt and isinstance(appt["date"], datetime):
             # Assume stored dates are UTC (since we strip them on save)
             appt["date"] = appt["date"].replace(tzinfo=timezone.utc)
             
    return serialize_list(appointments)

@router.put("/appointments/{id}")
async def update_appointment(id: str, update_data: dict):
    try:
        # Extract status from the request body
        if "status" not in update_data:
            raise HTTPException(status_code=400, detail="Status is required")
            
        status = update_data["status"]
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
async def delete_appointment(id: str):
    try:
        result = await mongo_db.appointments.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"message": "Appointment cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Billing ---

@router.post("/bills", response_model=dict)
async def create_bill(bill: BillData):
    try:
        result = await mongo_db.bills.insert_one(bill.dict())
        return {"id": str(result.inserted_id), "message": "Invoice generated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bills/{patient_id}", response_model=List[dict])
async def get_bills(patient_id: str):
    cursor = mongo_db.bills.find({"patient_id": patient_id})
    bills = await cursor.to_list(length=100)
    return serialize_list(bills)

@router.post("/bills/{id}/pay")
async def pay_bill(id: str):
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
        raise HTTPException(status_code=500, detail=str(e))

# --- Notifications ---

@router.post("/notifications", response_model=dict)
async def send_notification(notif: NotificationData):
    try:
        result = await mongo_db.notifications.insert_one(notif.dict())
        return {"id": str(result.inserted_id), "message": "Notification sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications/{user_id}", response_model=List[dict])
async def get_notifications(user_id: str):
    cursor = mongo_db.notifications.find({"user_id": user_id})
    notifs = await cursor.to_list(length=100)
    return serialize_list(notifs)

@router.put("/notifications/{id}/read")
async def mark_notification_read(id: str):
    try:
        result = await mongo_db.notifications.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"read": True}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"message": "Marked as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
