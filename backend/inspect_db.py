import os
import pymysql
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Kubendra@2004")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_DB = os.getenv("MYSQL_DB", "health_app")

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "health_app_ai")

def inspect_sql():
    print("\n--- SQL Users ---")
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASSWORD,
            database=MYSQL_DB, port=MYSQL_PORT, cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, role FROM users LIMIT 10")
            users = cursor.fetchall()
            if not users:
                print("No users found in SQL.")
            for u in users:
                print(u)
        connection.close()
    except Exception as e:
        print(f"SQL Error: {e}")

def inspect_mongo():
    print("\n--- MongoDB Inventory ---")
    try:
        client = MongoClient(MONGODB_URL)
        db = client[MONGODB_DB]
        items = list(db.inventory.find().limit(5))
        if not items:
            print("No inventory items found.")
        for i in items:
            print(f"Item: {i.get('name')} | Category: {i.get('category')}")
            
        print("\n--- MongoDB Patient Profiles ---")
        profiles = list(db.patient_profiles.find().limit(5))
        if not profiles:
            print("No patient profiles found.")
        for p in profiles:
            print(f"Profile: {p.get('patient_id')}")
            
    except Exception as e:
        print(f"Mongo Error: {e}")

if __name__ == "__main__":
    inspect_sql()
    inspect_mongo()
