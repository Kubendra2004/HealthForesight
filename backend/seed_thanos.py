from database.database import get_db, engine
from database.models_sql import User, UserRole
from sqlalchemy.orm import sessionmaker
from auth.auth import Hash

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

username = "Thanos"
prefix = "tha"

existing = db.query(User).filter(User.username == username).first()
if not existing:
    print(f"Creating patient {username}...")
    user = User(
        username=username,
        email="thanos@titan.com",
        hashed_password=Hash.bcrypt("password"),
        role=UserRole.patient,
        specialization=None
    )
    db.add(user)
    db.commit()
    print("Success.")
else:
    print("Thanos already exists.")
