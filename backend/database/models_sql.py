from sqlalchemy import Column, Integer, String, Boolean, Enum
from database.database import Base
import enum

class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"
    frontdesk = "frontdesk"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.patient)
    specialization = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
