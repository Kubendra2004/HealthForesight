"""
Create ALL necessary test users for the system
"""
from database.database import SessionLocal
from database.models_sql import User, UserRole
from auth.auth import Hash

def create_all_test_users():
    db = SessionLocal()
    try:
        # Check existing users
        existing_users = {user.username for user in db.query(User).all()}
        print(f"Existing users: {existing_users}\n")
        
        # Users to create
        users_to_create = [
            {
                "username": "frontdesk1",
                "email": "frontdesk@hospital.com",
                "password": "frontdesk123",
                "role": UserRole.frontdesk,
                "specialization": None
            },
            {
                "username": "frontdesk",
                "email": "frontdesk2@hospital.com", 
                "password": "frontdesk123",
                "role": UserRole.frontdesk,
                "specialization": None
            }
        ]
        
        for user_data in users_to_create:
            if user_data["username"] in existing_users:
                print(f"✓ User '{user_data['username']}' already exists")
                continue
            
            new_user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=Hash.bcrypt(user_data["password"]),
                role=user_data["role"],
                specialization=user_data["specialization"]
            )
            
            db.add(new_user)
            db.commit()
            
            print(f"✅ Created user: {user_data['username']}")
            print(f"   Email: {user_data['email']}")
            print(f"   Password: {user_data['password']}")
            print(f"   Role: {user_data['role']}")
            print()
        
        print("\n📋 Final user list:")
        all_users = db.query(User).all()
        for user in all_users:
            print(f"  - {user.username} ({user.role})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_all_test_users()
