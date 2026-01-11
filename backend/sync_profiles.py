from database.database import get_db, engine, mongo_db
from database.models_sql import User, UserRole
from sqlalchemy.orm import sessionmaker
import asyncio
import random

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

async def sync_profiles():
    print("--- SYNCING PROFILES ---")
    
    # 1. Get all Patients from SQL
    users = db.query(User).filter(User.role == UserRole.patient).all()
    print(f"Found {len(users)} patients in SQL.")
    
    for u in users:
        # 2. Check MongoDB
        profile = await mongo_db.patient_profiles.find_one({"patient_id": u.username})
        
        if not profile:
            print(f"Creating profile for {u.username}...")
            # Create a nice dummy profile
            new_profile = {
                "patient_id": u.username,
                "age": random.randint(20, 80),
                "gender": random.choice(["Male", "Female", "Other"]),
                "blood_type": random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+"]),
                "allergies": random.choice(["None", "Peanuts", "Penicillin", "Dust"]),
                "medications": random.choice(["None", "Metformin", "Lisinopril", "Atorvastatin"]),
                "medical_history": ["Regular checkup 2023"],
                "emergency_contact": "555-0199"
            }
            await mongo_db.patient_profiles.insert_one(new_profile)
        else:
            print(f"Profile exists for {u.username}.")
            
    print("--- SYNC COMPLETE ---")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(sync_profiles())
