from database.database import engine, SessionLocal, Base
from database.models_sql import User, UserRole
from auth.auth import Hash
import os

def init_db():
    print("🔄 Initializing Database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check for specialization column (Simple Migration) - Run this FIRST
    try:
        # Use text() for raw SQL if needed, or just execute string
        from sqlalchemy import text
        db.execute(text("SELECT specialization FROM users LIMIT 1"))
    except Exception:
        print("⚠️ 'specialization' column missing. Adding it...")
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN specialization VARCHAR(100) NULL"))
            db.commit()
            print("✅ Column 'specialization' added.")
        except Exception as e:
            print(f"❌ Failed to add column: {e}")
            # Continue anyway, maybe it exists or another error
            db.rollback()

    # Check if admin exists
    try:
        admin_user = db.query(User).filter(User.role == UserRole.admin).first()
        if not admin_user:
            print("👤 Creating default admin user...")
            admin = User(
                username="admin",
                email="admin@healthapp.com",
                hashed_password=Hash.bcrypt("admin123"),
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: username='admin', password='admin123'")
        else:
            print("👤 Admin user exists. Resetting password to 'admin123'...")
            admin_user.hashed_password = Hash.bcrypt("admin123")
            db.commit()
            print("✅ Admin password reset.")
    except Exception as e:
        print(f"❌ Error checking/creating admin: {e}")
        
    db.close()
    print("✅ Database initialization complete.")

if __name__ == "__main__":
    init_db()
