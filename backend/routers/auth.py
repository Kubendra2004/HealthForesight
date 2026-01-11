from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from database.database import get_db
from database.models_sql import User, UserRole
from auth.auth import Hash, create_access_token, create_refresh_token, get_current_user, SECRET_KEY, ALGORITHM
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import JWTError, jwt

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole
    specialization: Optional[str] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only admin can create admin or frontdesk users
    if user.role in [UserRole.admin, UserRole.frontdesk]:
        if not current_user or current_user.role != UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can create admin or frontdesk users"
            )
    
    # Check if user exists
    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=Hash.bcrypt(user.password),
        role=user.role,
        specialization=user.specialization
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    refresh_token = create_refresh_token(data={"sub": new_user.username, "role": new_user.role})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.role in [UserRole.admin, UserRole.frontdesk]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot register as admin or frontdesk publicly"
        )
        
    existing_user = db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=Hash.bcrypt(user.password),
        role=user.role,
        specialization=user.specialization
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    refresh_token = create_refresh_token(data={"sub": new_user.username, "role": new_user.role})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(request: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == request.username) | (User.email == request.username)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid credentials"
        )
    if not Hash.verify(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        print(f"DEBUG: Decoded Refresh Token. User: {username}, Role: {role}")
        if username is None:
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG: JWT Decode Error: {e}")
        raise credentials_exception
        
    # Verify user exists
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        print(f"DEBUG: User {username} not found in DB")
        raise credentials_exception
        
    access_token = create_access_token(data={"sub": username, "role": role})
    # Optionally rotate refresh token
    new_refresh_token = create_refresh_token(data={"sub": username, "role": role})
    
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    specialization: Optional[str] = None

@router.get("/profile/{username}")
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "specialization": user.specialization
    }

@router.put("/profile/{username}")
def update_user_profile(username: str, update_data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.username != username and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if update_data.email:
        user.email = update_data.email
    if update_data.specialization:
        user.specialization = update_data.specialization
    if update_data.password:
        user.hashed_password = Hash.bcrypt(update_data.password)
        
    db.commit()
    db.refresh(user)
    
    return {"message": "Profile updated successfully", "user": {
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "specialization": user.specialization
    }}

@router.get("/users")
def get_users(role: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all users, optionally filtered by role"""
    query = db.query(User)
    
    if role:
        try:
            role_enum = UserRole[role]
            query = query.filter(User.role == role_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    
    users = query.all()
    return [
  {
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "specialization": user.specialization
        }
        for user in users
    ]
