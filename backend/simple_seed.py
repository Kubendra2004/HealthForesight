import os
import pymysql
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv

# Load env from .env file manually if needed, or assume defaults
load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Kubendra@2004")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_DB = os.getenv("MYSQL_DB", "health_app")

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "health_app_ai")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_sql():
    print("Connecting to MySQL...")
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            port=MYSQL_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # Check if patients exist
            patients = [
                ("john_doe", "john@example.com", "patient"),
                ("alice_smith", "alice@example.com", "patient"),
                ("bob_jones", "bob@example.com", "patient"),
                ("emma_wilson", "emma@example.com", "patient"),
                ("michael_brown", "michael@example.com", "patient")
            ]
            
            for uname, email, role in patients:
                cursor.execute("SELECT * FROM users WHERE username=%s", (uname,))
                result = cursor.fetchone()
                if not result:
                    print(f"Inserting {uname}...")
                    sql = "INSERT INTO users (username, email, hashed_password, role, is_active) VALUES (%s, %s, %s, %s, %s)"
                    cursor.execute(sql, (uname, email, get_password_hash("password123"), role, 1))
                else:
                    print(f"User {uname} exists.")
            
        connection.commit()
        connection.close()
        print("SQL Seeding Done.")
    except Exception as e:
        print(f"SQL Error: {e}")

def seed_mongo():
    print("Connecting to Mongo...")
    try:
        client = MongoClient(MONGODB_URL)
        db = client[MONGODB_DB]
        
        # Medicines
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
            {"name": "Montelukast 10mg", "category": "Medicine", "quantity": 300},
            {"name": "Dolo 650", "category": "Medicine", "quantity": 1000}
        ]
        
        for med in medicines:
            db.inventory.update_one(
                {"name": med["name"]}, 
                {"$set": {**med, "updated_at": datetime.utcnow()}}, 
                upsert=True
            )
            
        # Profiles
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
            
        print("Mongo Seeding Done.")
    except Exception as e:
        print(f"Mongo Error: {e}")

if __name__ == "__main__":
    seed_sql()
    seed_mongo()
