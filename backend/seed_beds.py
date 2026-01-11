
import asyncio
from database.database import mongo_db
from database.models_mongo import BedData
from bson import ObjectId

async def seed_beds():
    print("🧹 Clearing existing beds...")
    await mongo_db.beds.delete_many({})

    beds_to_add = []
    
    # Floor 1: General Ward (20 Beds)
    for i in range(1, 21):
        beds_to_add.append(BedData(
            bed_number=f"G1-{i:02d}",
            ward="Floor 1 - General",
            status="Available",
            type="General",
            floor=1
        ).dict())

    # Floor 2: Private Rooms (10 Beds)
    for i in range(1, 11):
        beds_to_add.append(BedData(
            bed_number=f"P2-{i:02d}",
            ward="Floor 2 - Private",
            status="Available",
            type="Private",
            floor=2
        ).dict())

    # Floor 3: ICU (5 Beds)
    for i in range(1, 6):
        beds_to_add.append(BedData(
            bed_number=f"ICU-{i:02d}",
            ward="Floor 3 - ICU",
            status="Available",
            type="ICU",
            floor=3
        ).dict())

    # Emergency Ward (Ground Floor) (5 Beds)
    for i in range(1, 6):
        beds_to_add.append(BedData(
            bed_number=f"ER-{i:02d}",
            ward="Ground - Emergency",
            status="Available",
            type="Emergency",
            floor=0
        ).dict())
        
    print(f"🛏️ Seeding {len(beds_to_add)} beds...")
    if beds_to_add:
        await mongo_db.beds.insert_many(beds_to_add)
    
    print("✅ Bed seeding complete!")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_beds())
