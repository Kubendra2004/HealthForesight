from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from database.database import mongo_db
from database.models_mongo import BillData
from database.database import get_db
from database.models_sql import User, UserRole
from sqlalchemy.orm import Session
from bson import ObjectId
from routers.websocket import notify_bed_update
from auth.authorization import require_roles

router = APIRouter(
    tags=["Resource & Bed Management"],
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.frontdesk))],
)

# --- Helpers ---
def serialize_list(cursor_list):
    return [{**doc, "_id": str(doc["_id"])} for doc in cursor_list]


@router.get("/resources/current")
async def get_current_resources(db: Session = Depends(get_db)):
    """Return the current operational resource snapshot for the front desk dashboard."""
    beds_total = await mongo_db.beds.count_documents({})
    beds_occupied = await mongo_db.beds.count_documents({"status": "Occupied"})
    beds_available = max(0, beds_total - beds_occupied)

    icu_total = await mongo_db.beds.count_documents({"type": "ICU"})
    icu_occupied = await mongo_db.beds.count_documents({"type": "ICU", "status": "Occupied"})
    icu_available = max(0, icu_total - icu_occupied)

    oxygen_item = await mongo_db.inventory.find_one({"category": "Medicine", "name": {"$regex": "oxygen", "$options": "i"}})
    oxygen_count = int(oxygen_item.get("quantity", 0)) if oxygen_item else 0

    staff_count = db.query(User).filter(User.role.in_([UserRole.doctor, UserRole.frontdesk, UserRole.admin])).count()

    resources = [
        {
            "type": "beds",
            "count": beds_occupied,
            "total_capacity": beds_total,
            "status": "Warning" if beds_available < 10 else "Normal",
            "last_updated": datetime.utcnow(),
        },
        {
            "type": "icu",
            "count": icu_occupied,
            "total_capacity": icu_total,
            "status": "Critical" if icu_available < 3 else "Normal",
            "last_updated": datetime.utcnow(),
        },
        {
            "type": "oxygen",
            "count": oxygen_count,
            "total_capacity": max(oxygen_count, 100),
            "status": "Critical" if oxygen_count < 20 else "Normal",
            "last_updated": datetime.utcnow(),
        },
        {
            "type": "staff",
            "count": staff_count,
            "total_capacity": staff_count,
            "status": "Normal",
            "last_updated": datetime.utcnow(),
        },
    ]
    resource_snapshots = await mongo_db.resource_snapshots.find({}).to_list(100)
    resource_index = {item["type"]: item for item in resources}
    for snapshot in resource_snapshots:
        snapshot.pop("_id", None)
        if snapshot["type"] in resource_index:
            resource_index[snapshot["type"]].update(snapshot)
        else:
            resources.append(snapshot)
    return resources


class ResourceUpdate(BaseModel):
    type: str
    current: int
    capacity: int
    unit: str = "units"


@router.post("/resources/update")
async def update_resource(data: ResourceUpdate):
    """Record a manually entered resource snapshot from the front desk."""
    if data.current < 0 or data.capacity < 0 or data.current > data.capacity:
        raise HTTPException(status_code=422, detail="Resource values must be non-negative and current cannot exceed capacity")
    resource_type = data.type.strip().lower()
    if not resource_type:
        raise HTTPException(status_code=422, detail="Resource type is required")
    status = "Critical" if data.capacity and data.current / data.capacity >= 0.9 else (
        "Warning" if data.capacity and data.current / data.capacity >= 0.75 else "Normal"
    )
    updated_at = datetime.utcnow()
    snapshot = {
        "type": resource_type,
        "count": data.current,
        "total_capacity": data.capacity,
        "unit": data.unit,
        "status": status,
        "last_updated": updated_at,
    }
    await mongo_db.resource_snapshots.update_one(
        {"type": resource_type},
        {"$set": snapshot},
        upsert=True,
    )
    return {"message": "Resource snapshot updated", "resource": snapshot}

# --- Beds ---

@router.get("/beds", response_model=List[dict])
async def get_beds():
    cursor = mongo_db.beds.find({})
    beds = await cursor.to_list(length=1000)
    return serialize_list(beds)

class BedAllocation(BaseModel):
    bed_id: str
    patient_id: str

class BedDeallocation(BaseModel):
    bed_id: str

@router.post("/beds/allocate")
async def allocate_bed(data: BedAllocation, db: Session = Depends(get_db)):
    try:
        if not ObjectId.is_valid(data.bed_id):
            raise HTTPException(status_code=400, detail="Invalid bed ID")
        patient = db.query(User).filter(User.username == data.patient_id, User.role == UserRole.patient).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient account not found")
        bed = await mongo_db.beds.find_one({"_id": ObjectId(data.bed_id)})
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        result = await mongo_db.beds.update_one(
            {"_id": ObjectId(data.bed_id), "status": "Available"},
            {"$set": {"status": "Occupied", "patient_id": data.patient_id}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=409, detail="Bed is no longer available")
        
        # Notify Real-time
        await notify_bed_update(data.bed_id, "Occupied")
        
        return {"message": "Bed allocated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/beds/deallocate")
async def deallocate_bed(data: BedDeallocation):
    try:
        if not ObjectId.is_valid(data.bed_id):
            raise HTTPException(status_code=400, detail="Invalid bed ID")
        bed = await mongo_db.beds.find_one({"_id": ObjectId(data.bed_id)})
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        patient_id = bed.get("patient_id")
        bed_type = bed.get("type", "General")
        
        # 1. Update Bed Status
        result = await mongo_db.beds.update_one(
            {"_id": ObjectId(data.bed_id), "status": "Occupied"},
            {"$set": {"status": "Available", "patient_id": None}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=409, detail="Bed is no longer occupied")
        
        # Notify Real-time
        await notify_bed_update(data.bed_id, "Available")
        
        # 2. Trigger Billing (Hospital Stay)
        # Rates: General=1200, ICU=1500, Private=2000, Emergency=500
        rates = {
            "General": 1200.0,
            "ICU": 1500.0,
            "Private": 2000.0,
            "Emergency": 500.0
        }
        cost = rates.get(bed_type, 1200.0) # Default to General if unknown

        if patient_id:
            bill = BillData(
                patient_id=patient_id,
                appointment_id="hospital_stay", # Placeholder
                amount=cost, 
                status="Pending",
                items=[{"description": f"Hospital Stay - {bed_type} Bed {bed.get('bed_number')}", "cost": cost}],
                date=datetime.utcnow()
            )
            await mongo_db.bills.insert_one(bill.dict())
            
        return {"message": "Bed deallocated and bill generated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/billing/{bill_id}")
async def update_bill(bill_id: str, data: BillData):
    try:
        if not ObjectId.is_valid(bill_id):
            raise HTTPException(status_code=400, detail="Invalid bill ID")
        # Convert Pydantic model to dict, excluding _id
        bill_dict = data.dict(exclude={'id', '_id', 'date', 'status'}) 
        
        result = await mongo_db.bills.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": bill_dict}
        )
        if result.modified_count == 0:
             # Check if it exists but wasn't modified (e.g. same data)
             if await mongo_db.bills.count_documents({"_id": ObjectId(bill_id)}) == 0:
                 raise HTTPException(status_code=404, detail="Bill not found")
                 
        return {"message": "Bill updated successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/billing/{bill_id}/pay")
async def pay_bill(bill_id: str):
    try:
        if not ObjectId.is_valid(bill_id):
            raise HTTPException(status_code=400, detail="Invalid bill ID")
        bill = await mongo_db.bills.find_one({"_id": ObjectId(bill_id)})
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        if bill.get("status") == "Paid":
             return {"message": "Bill already paid"}

        # 1. Update Bill Status
        result = await mongo_db.bills.update_one(
            {"_id": ObjectId(bill_id), "status": {"$ne": "Paid"}},
            {"$set": {"status": "Paid"}}
        )
        if result.modified_count == 0:
            return {"message": "Bill already paid"}
        
        # 2. Update Daily Sales
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        amount = bill.get("amount", 0.0)
        
        await mongo_db.daily_sales.update_one(
            {"date": today_str},
            {
                "$inc": {"total_revenue": amount, "transaction_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            },
            upsert=True
        )

        return {"message": "Payment successful"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/billing", response_model=List[dict])
async def get_bills():
    try:
        cursor = mongo_db.bills.find({}).sort("date", -1)
        bills = await cursor.to_list(length=1000)
        return serialize_list(bills)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/operations/stats")
async def get_ops_stats(db: Session = Depends(get_db)):
    try:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        sales_doc = await mongo_db.daily_sales.find_one({"date": today_str})
        
        revenue = sales_doc.get("total_revenue", 0.0) if sales_doc else 0.0
        
        # Count staff - checking doctors for now or users
        staff_count = db.query(User).filter(User.role.in_([UserRole.doctor, UserRole.frontdesk])).count()
        
        return {
            "daily_revenue": revenue,
            "staff_on_duty": staff_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
