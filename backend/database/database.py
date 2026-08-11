import os
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# MySQL Configuration
# Check for full URL first (preferred for Cloud/Render)
MYSQL_URL = os.getenv("MYSQL_URL")

if not MYSQL_URL:
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB = os.getenv("MYSQL_DB", "health_app")
    missing_vars = [name for name, value in {
        "MYSQL_USER": MYSQL_USER,
        "MYSQL_PASSWORD": MYSQL_PASSWORD,
        "MYSQL_HOST": MYSQL_HOST,
        "MYSQL_PORT": MYSQL_PORT,
        "MYSQL_DB": MYSQL_DB,
    }.items() if not value]
    if missing_vars:
        raise RuntimeError(f"Missing required MySQL environment variables: {', '.join(missing_vars)}")

    SQLALCHEMY_DATABASE_URL = URL.create(
        drivername="mysql+pymysql",
        username=MYSQL_USER,
        password=MYSQL_PASSWORD,
        host=MYSQL_HOST,
        port=int(MYSQL_PORT),
        database=MYSQL_DB,
    )
else:
    SQLALCHEMY_DATABASE_URL = MYSQL_URL

# Ensure pymysql is used
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "health_app_ai")

client = AsyncIOMotorClient(MONGODB_URL)
mongo_db = client[MONGODB_DB]
