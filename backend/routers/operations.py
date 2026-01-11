from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database.database import mongo_db
from database.models_mongo import WaitlistEntry, InventoryItem
from bson import ObjectId

router = APIRouter(
    prefix="/operations",
    tags=["Operations & Resources"]
)

# --- Waitlist Management ---

@router.post("/waitlist", response_model=dict)
async def add_to_waitlist(entry: WaitlistEntry):
    try:
        entry_dict = entry.dict()
        result = await mongo_db.waitlist.insert_one(entry_dict)
        return {"id": str(result.inserted_id), "message": "Added to waitlist"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/waitlist", response_model=List[dict])
async def get_waitlist():
    try:
        waitlist = await mongo_db.waitlist.find().to_list(100)
        # Convert ObjectId to str
        for w in waitlist:
            w["id"] = str(w["_id"])
            del w["_id"]
        return waitlist
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/waitlist/{id}/status")
async def update_waitlist_status(id: str, status: str):
    try:
        result = await mongo_db.waitlist.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": status}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"message": "Status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Inventory Management ---

@router.post("/inventory", response_model=dict)
async def add_inventory_item(item: InventoryItem):
    try:
        item_dict = item.dict()
        result = await mongo_db.inventory.insert_one(item_dict)
        return {"id": str(result.inserted_id), "message": "Item added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory", response_model=List[dict])
async def get_inventory():
    try:
        inventory = await mongo_db.inventory.find().to_list(100)
        for i in inventory:
            i["id"] = str(i["_id"])
            del i["_id"]
        return inventory
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/inventory/{id}")
async def update_inventory_quantity(id: str, quantity: int):
    try:
        result = await mongo_db.inventory.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"quantity": quantity}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Quantity updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
