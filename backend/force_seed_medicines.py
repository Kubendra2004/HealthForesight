from pymongo import MongoClient
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "health_app_ai")

def force_seed():
    print("Force Seeding Medicines...")
    client = MongoClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    medicines = [
        "Paracetamol 500mg", "Amoxicillin 500mg", "Ibuprofen 400mg", "Cetirizine 10mg",
        "Metformin 500mg", "Atorvastatin 20mg", "Amlodipine 5mg", "Omeprazole 20mg",
        "Losartan 50mg", "Aspirin 75mg", "Azithromycin 250mg", "Ciprofloxacin 500mg",
        "Pantoprazole 40mg", "Montelukast 10mg", "Metoprolol 50mg", "Albuterol Inhaler",
        "Dolo 650", "Augmentin 625", "Vicks Action 500"
    ]
    
    count = 0
    for name in medicines:
        db.inventory.update_one(
            {"name": name},
            {"$set": {
                "name": name, 
                "category": "Medicine", 
                "quantity": 1000, 
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        count += 1
        
    print(f"Upserted {count} medicines successfully.")

if __name__ == "__main__":
    force_seed()
