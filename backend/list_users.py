"""
Check what users exist in the database
"""
from database.database import SessionLocal
from database.models_sql import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"\n📋 Found {len(users)} users in database:\n")
        
        for user in users:
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Specialization: {user.specialization}")
            print("-" * 40)
        
        if len(users) == 0:
            print("⚠️ No users found in database!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
