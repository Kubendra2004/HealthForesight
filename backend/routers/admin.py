from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from database.database import get_db
from database.models_sql import User, UserRole
from auth.auth import get_current_user
import csv
import io
import subprocess
import os

router = APIRouter(
    prefix="/admin",
    tags=["Admin Tools"]
)

from database.database import mongo_db

# Dependency to check for Admin role
def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

@router.get("/overview-stats")
async def get_overview_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    # 1. SQL Stats
    total_users = db.query(User).count()
    active_doctors = db.query(User).filter(User.role == UserRole.doctor).count()
    
    # 2. Mongo Stats
    total_appointments = await mongo_db.appointments.count_documents({})
    pending_appointments = await mongo_db.appointments.count_documents({"status": "Requested"})
    
    return {
        "total_users": total_users,
        "active_doctors": active_doctors,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments
    }



@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "specialization": u.specialization,
        "is_active": u.is_active
    } for u in users]

@router.get("/models/stats")
def get_model_stats(admin: User = Depends(get_current_admin)):
    # Hardcoded from model_performance.md for stability
    return [
        {"name": "Diabetes Risk", "target": "Class", "accuracy": "96.97%", "type": "Disease"},
        {"name": "Heart Disease", "target": "Presence", "accuracy": "91.80%", "type": "Disease"},
        {"name": "Hospital Beds", "target": "Occupancy", "accuracy": "94.92%", "type": "Resource"},
        {"name": "ICU Units", "target": "Count", "accuracy": "96.50%", "type": "Resource"},
        {"name": "Oxygen Usage", "target": "Cylinders", "accuracy": "95.80%", "type": "Resource"},
        {"name": "Clustering", "target": "Risk Groups", "accuracy": "0.40 (Silhouette)", "type": "Unsupervised"},
    ]

from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    specialization: Optional[str] = None
    is_active: Optional[bool] = None

@router.put("/users/{user_id}")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.username:
        user.username = user_update.username
    if user_update.email:
        user.email = user_update.email
    if user_update.role:
        user.role = user_update.role
    if user_update.specialization is not None:
        user.specialization = user_update.specialization
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
        
    db.commit()
    return {"message": "User updated successfully"}

@router.get("/resources")
def get_admin_resources(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    # Enhanced data for Recharts
    # Beds: Occupied vs Available
    # ICU: Occupied vs Available
    # Oxygen: Just a value for gauge/area
    return {
        "beds": [
            {"name": "Occupied", "value": 165, "fill": "#ef4444"},
            {"name": "Available", "value": 35, "fill": "#3b82f6"}
        ],
        "icu": [
             {"name": "Occupied", "value": 42, "fill": "#f59e0b"},
             {"name": "Available", "value": 8, "fill": "#10b981"}
        ],
        "oxygen": [
            {"name": "Level", "value": 88, "fill": "#3b82f6"},
            {"name": "Remaining", "value": 12, "fill": "#e2e8f0"}
        ]
    }

class Announcement(BaseModel):
    message: str
    type: str

@router.post("/announcement")
def post_announcement(announcement: Announcement, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    # In a real app, save to DB. For now, just echo.
    return {"message": "Announcement broadcasted successfully", "data": announcement}

import psutil
import time
from datetime import timedelta

# ... existing imports ...

@router.get("/system/health")
def get_system_health(admin: User = Depends(get_current_admin)):
    try:
        cpu_usage = psutil.cpu_percent(interval=0.1) # Fast check
        memory = psutil.virtual_memory()
        uptime_seconds = time.time() - psutil.boot_time()
        uptime_str = str(timedelta(seconds=int(uptime_seconds)))
        
        return {
            "cpu": cpu_usage,
            "memory": memory.percent,
            "db": "Connected",
            "uptime": uptime_str
        }
    except Exception as e:
        print(f"Health check error: {e}")
        return {
            "cpu": 0,
            "memory": 0,
            "db": "Error",
            "uptime": "N/A"
        }

@router.post("/system/backup")
def trigger_system_backup(admin: User = Depends(get_current_admin)):
    # Mock backup trigger
    return {"message": "System backup initiated successfully. Expected completion: 2 mins."}

@router.get("/export/users")
def export_users(format: str = "csv", role: Optional[str] = None, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = db.query(User)
    
    if role:
        if role.lower() == "staff":
            query = query.filter(User.role.in_([UserRole.admin, UserRole.frontdesk]))
        elif role.lower() == "patient":
             query = query.filter(User.role == UserRole.patient)
        elif role.lower() == "doctor":
             query = query.filter(User.role == UserRole.doctor)
    
    users = query.all()
    
    if format == "csv":
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["ID", "Username", "Email", "Role", "Specialization", "Is Active"])
        
        # Rows
        for user in users:
            writer.writerow([
                user.id,
                user.username,
                user.email,
                user.role.value,
                user.specialization if user.specialization else "N/A",
                user.is_active
            ])
            
        output.seek(0)
        filename = f"{role}_users.csv" if role else "users_export.csv"
        return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})
        
    elif format == "pdf":
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter)) # Landscape for more width
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563eb'), 
            spaceAfter=30,
            alignment=1 
        )
        
        # Title
        report_title = f"HealthForesight {role.capitalize()} Report" if role else "HealthForesight User Report"
        elements.append(Paragraph(report_title, title_style))
        elements.append(Spacer(1, 12))
        
        # Table Data
        data = [["ID", "Username", "Email", "Role", "Specialization", "Active"]] 
        for user in users:
            data.append([
                str(user.id),
                user.username,
                user.email,
                user.role.value.capitalize(),
                user.specialization if user.specialization else "-",
                "Yes" if user.is_active else "No"
            ])
            
        # Table Style
        # Widths: ID, Username, Email, Role, Specialization, Active
        col_widths = [40, 100, 180, 80, 120, 60]
        
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')), 
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (1, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')])
        ]))
        
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        filename = f"{role}_users.pdf" if role else "users_report.pdf"
        return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
    
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'pdf'.")

@router.post("/models/retrain")
def retrain_model(model_name: str, admin: User = Depends(get_current_admin)):
    # model_name options: 'heart', 'diabetes', 'clustering', 'resources'
    
    script_map = {
        'heart': 'train_heart_model.py',
        'diabetes': 'train_diabetes_model.py',
        'clustering': 'train_clustering_model.py',
        'resources': 'train_resource_model.py'
    }
    
    if model_name not in script_map:
        raise HTTPException(status_code=400, detail=f"Invalid model name. Options: {list(script_map.keys())}")
        
    script_file = script_map[model_name]
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
    script_path = os.path.join(base_dir, 'models', script_file)
    
    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail=f"Training script not found: {script_path}")
        
    try:
        # Run script in background or wait? 
        # For simplicity, we wait, but in prod use Celery/BackgroundTasks
        # Using subprocess to run independent script
        result = subprocess.run(['python', script_path], capture_output=True, text=True, cwd=base_dir)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Training failed: {result.stderr}")
            
        return {"message": f"Model '{model_name}' retrained successfully.", "output": result.stdout[:500] + "..."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
