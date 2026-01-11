import sys
import os
import asyncio
from datetime import datetime

# Adjust path to import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.database import SessionLocal, engine, MONGODB_URL, MONGODB_DB
# Only import models, do not re-import Base if not needed for creation
from backend.database.models_sql import User, UserRole
from backend.auth.auth import Hash
from pymongo import MongoClient

# Sync SQL Seeding
def seed_sql():
    print("Seeding SQL Users...")
    # Base.metadata.create_all(bind=engine) # Skip creation to avoid error, assume tables exist or use alembic
    db = SessionLocal()
    
    patients = [
        ("john_doe", "john@example.com", "Patient", None),
        ("alice_smith", "alice@example.com", "Patient", None),
        ("bob_jones", "bob@example.com", "Patient", None),
        ("emma_wilson", "emma@example.com", "Patient", None),
        ("michael_brown", "michael@example.com", "Patient", None)
    ]

    for username, email, role, spec in patients:
        existing = db.query(User).filter(User.username == username).first()
        if not existing:
            user = User(
                username=username,
                email=email,
                hashed_password=Hash.bcrypt("password123"),
                role=UserRole.patient,
                specialization=spec
            )
            db.add(user)
            print(f"Added patient: {username}")
    
    db.commit()
    db.close()
    print("SQL Seeding Complete.")

# Sync Mongo Seeding (using pymongo for script simplicity)
def seed_mongo():
    print("Seeding MongoDB...")
    client = MongoClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    # Medicine Inventory
    medicines = [
        {"name": "Paracetamol 500mg", "category": "Medicine", "quantity": 1000},
        {"name": "Amoxicillin 500mg", "category": "Medicine", "quantity": 500},
        {"name": "Ibuprofen 400mg", "category": "Medicine", "quantity": 800},
        {"name": "Cetirizine 10mg", "category": "Medicine", "quantity": 600},
        {"name": "Metformin 500mg", "category": "Medicine", "quantity": 400},
        {"name": "Atorvastatin 20mg", "category": "Medicine", "quantity": 300},
        {"name": "Amlodipine 5mg", "category": "Medicine", "quantity": 300},
        {"name": "Omeprazole 20mg", "category": "Medicine", "quantity": 400},
        {"name": "Losartan 50mg", "category": "Medicine", "quantity": 350},
        {"name": "Aspirin 75mg", "category": "Medicine", "quantity": 1000},
        {"name": "Azithromycin 250mg", "category": "Medicine", "quantity": 200},
        {"name": "Ciprofloxacin 500mg", "category": "Medicine", "quantity": 250},
        {"name": "Pantoprazole 40mg", "category": "Medicine", "quantity": 450},
        {"name": "Montelukast 10mg", "category": "Medicine", "quantity": 300}
    ]
    
    # Upsert Medicines
    for med in medicines:
        db.inventory.update_one(
            {"name": med["name"]}, 
            {"$set": {**med, "updated_at": datetime.utcnow()}}, 
            upsert=True
        )
    print(f"Seeded {len(medicines)} medicines.")

    # Patient Profiles
    profiles = [
        {
            "patient_id": "john_doe", "age": 34, "gender": "Male", "blood_type": "O+", 
            "allergies": "Peanuts", "medications": "None", 
            "systolic_bp": 120, "diastolic_bp": 80, "heart_rate": 72
        },
        {
            "patient_id": "alice_smith", "age": 28, "gender": "Female", "blood_type": "A-", 
            "allergies": "Penicillin", "medications": "Vitamin D", 
            "systolic_bp": 110, "diastolic_bp": 70, "heart_rate": 68
        },
        {
            "patient_id": "bob_jones", "age": 45, "gender": "Male", "blood_type": "B+", 
            "allergies": "None", "medications": "Metformin", 
            "systolic_bp": 130, "diastolic_bp": 85, "heart_rate": 75
        }
    ]

    for prof in profiles:
        db.patient_profiles.update_one(
            {"patient_id": prof["patient_id"]},
            {"$set": {**prof, "updated_at": datetime.utcnow()}},
            upsert=True
        )
    print(f"Seeded {len(profiles)} patient profiles.")

if __name__ == "__main__":
    try:
        seed_sql()
        seed_mongo()
        print("All seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding data: {e}")
