from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from database.database import mongo_db
from database.models_mongo import ResourceData, BedData, BillData
from bson import ObjectId

router = APIRouter(
    tags=["Resource & Bed Management"]
)

# Helper
def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def serialize_list(cursor):
    return [serialize_doc(doc) for doc in cursor]

# --- Resources ---

@router.get("/resources/current", response_model=List[dict])
async def get_resources():
    cursor = mongo_db.resources.find({})
    resources = await cursor.to_list(length=100)
    return serialize_list(resources)

@router.post("/resources/update")
async def update_resource(data: ResourceData):
    try:
        # Update or Insert
        await mongo_db.resources.update_one(
            {"type": data.type},
            {"$set": data.dict(exclude={"last_updated"}), "$currentDate": {"last_updated": True}},
            upsert=True
        )
        return {"message": f"Resource {data.type} updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
async def allocate_bed(data: BedAllocation):
    try:
        bed = await mongo_db.beds.find_one({"_id": ObjectId(data.bed_id)})
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        if bed.get("status") != "Available":
            raise HTTPException(status_code=400, detail="Bed is not available")
            
        await mongo_db.beds.update_one(
            {"_id": ObjectId(data.bed_id)},
            {"$set": {"status": "Occupied", "patient_id": data.patient_id}}
        )
        return {"message": "Bed allocated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/beds/deallocate")
async def deallocate_bed(data: BedDeallocation):
    try:
        bed = await mongo_db.beds.find_one({"_id": ObjectId(data.bed_id)})
        if not bed:
            raise HTTPException(status_code=404, detail="Bed not found")
        if bed.get("status") != "Occupied":
            raise HTTPException(status_code=400, detail="Bed is not occupied")
            
        patient_id = bed.get("patient_id")
        bed_type = bed.get("type", "General")
        
        # 1. Update Bed Status
        await mongo_db.beds.update_one(
            {"_id": ObjectId(data.bed_id)},
            {"$set": {"status": "Available", "patient_id": None}}
        )
        
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/billing/{bill_id}")
async def update_bill(bill_id: str, data: BillData):
    try:
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/billing/{bill_id}/pay")
async def pay_bill(bill_id: str):
    try:
        bill = await mongo_db.bills.find_one({"_id": ObjectId(bill_id)})
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        if bill.get("status") == "Paid":
             return {"message": "Bill already paid"}

        # 1. Update Bill Status
        await mongo_db.bills.update_one(
            {"_id": ObjectId(bill_id)},
            {"$set": {"status": "Paid"}}
        )
        
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
async def get_ops_stats():
    try:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        sales_doc = await mongo_db.daily_sales.find_one({"date": today_str})
        
        revenue = sales_doc.get("total_revenue", 0.0) if sales_doc else 0.0
        
        # Count staff - checking doctors for now or users
        staff_count = await mongo_db.users.count_documents({"role": {"$in": ["doctor", "frontdesk"]}})
        
        return {
            "daily_revenue": revenue,
            "staff_on_duty": staff_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
