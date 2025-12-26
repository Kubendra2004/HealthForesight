from fastapi import APIRouter, HTTPException, Depends
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(
    prefix="/clinical",
    tags=["Clinical Decision Support & Safety"]
)

# --- Clinical Decision Support ---

class VitalsCheck(BaseModel):
    patient_id: str
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    o2_saturation: Optional[float] = None
    temperature: Optional[float] = None

@router.post("/vitals-check")
async def check_vitals(
    vitals: VitalsCheck,
    current_user: User = Depends(get_current_user)
):
    """
    Clinical decision support: Check vitals against thresholds and alert on abnormalities.
    Returns alerts for critical values.
    """
    alerts = []
    
    # Blood Pressure Check
    if vitals.bp_systolic and vitals.bp_systolic > 180:
        alerts.append({
            "severity": "critical",
            "parameter": "Blood Pressure (Systolic)",
            "value": vitals.bp_systolic,
            "threshold": 180,
            "recommendation": "Consider immediate intervention. Risk of hypertensive crisis."
        })
    
    if vitals.bp_systolic and vitals.bp_systolic < 90:
        alerts.append({
            "severity": "warning",
            "parameter": "Blood Pressure (Systolic)",
            "value": vitals.bp_systolic,
            "threshold": 90,
            "recommendation": "Monitor for hypotension. Consider fluid resuscitation."
        })
    
    # O2 Saturation Check
    if vitals.o2_saturation and vitals.o2_saturation < 90:
        alerts.append({
            "severity": "critical",
            "parameter": "O2 Saturation",
            "value": vitals.o2_saturation,
            "threshold": 90,
            "recommendation": "Immediate oxygen therapy required. Consider ICU transfer."
        })
    
    # Heart Rate Check
    if vitals.heart_rate and vitals.heart_rate > 120:
        alerts.append({
            "severity": "warning",
            "parameter": "Heart Rate",
            "value": vitals.heart_rate,
            "threshold": 120,
            "recommendation": "Tachycardia detected. Check for underlying causes."
        })
    
    # Temperature Check
    if vitals.temperature and vitals.temperature > 39:
        alerts.append({
            "severity": "warning",
            "parameter": "Temperature",
            "value": vitals.temperature,
            "threshold": 39,
            "recommendation": "High fever. Consider antipyretics and infection workup."
        })
    
    # Log vitals and alerts
    vitals_log = {
        **vitals.dict(),
        "checked_by": current_user.username,
        "checked_at": datetime.utcnow(),
        "alerts": alerts
    }
    await mongo_db.vitals_checks.insert_one(vitals_log)
    
    return {
        "status": "critical" if any(a["severity"] == "critical" for a in alerts) else "normal",
        "alerts": alerts,
        "alert_count": len(alerts)
    }

# --- Fall Risk Assessment ---

class FallRiskData(BaseModel):
    patient_id: str
    age: int
    mobility_score: int  # 1-5, 1=bedridden, 5=fully mobile
    medications_count: int
    history_of_falls: bool
    cognitive_impairment: bool

@router.post("/predict/fall-risk")
async def predict_fall_risk(
    data: FallRiskData,
    current_user: User = Depends(get_current_user)
):
    """
    Predict patient fall risk using scoring system.
    Returns risk level and preventive recommendations.
    """
    # Fall risk scoring (simplified Morse Fall Scale-like)
    score = 0
    
    # Age factor
    if data.age > 75:
        score += 15
    elif data.age > 65:
        score += 10
    
    # Mobility
    if data.mobility_score <= 2:
        score += 20
    elif data.mobility_score == 3:
        score += 10
    
    # History
    if data.history_of_falls:
        score += 25
    
    # Medications
    if data.medications_count > 4:
        score += 10
    
    # Cognitive
    if data.cognitive_impairment:
        score += 15
    
    # Classify risk
    if score >= 45:
        risk_level = "high"
        recommendations = [
            "Implement hourly rounding",
            "Consider bed alarm",
            "Non-slip socks required",
            "Assign room close to nursing station"
        ]
    elif score >= 25:
        risk_level = "moderate"
        recommendations = [
            "2-hourly rounding",
            "Ensure call bell within reach",
            "Remove obstacles from room"
        ]
    else:
        risk_level = "low"
        recommendations = [
            "Standard fall precautions",
            "Patient education on fall prevention"
        ]
    
    result = {
        "patient_id": data.patient_id,
        "risk_score": score,
        "risk_level": risk_level,
        "recommendations": recommendations,
        "assessed_by": current_user.username,
        "assessed_at": datetime.utcnow()
    }
    
    # Save assessment
    await mongo_db.fall_risk_assessments.insert_one(result)
    
    return result

# --- Medication Reconciliation ---

class MedicationCheck(BaseModel):
    medications: List[str]  # Just medication names

@router.post("/med-reconciliation")
async def medication_reconciliation(
    check: MedicationCheck,
    current_user: User = Depends(get_current_user)
):
    """
    Check for medication duplicates and drug interactions.
    Uses local drug interaction database.
    """
    from utils.drug_interactions import check_medication_list
    
    warnings = []
    
    # Check for exact duplicates
    med_names = [m.lower() for m in check.medications]
    duplicates = [name for name in set(med_names) if med_names.count(name) > 1]
    
    if duplicates:
        warnings.append({
            "type": "duplicate",
            "severity": "high",
            "medications": duplicates,
            "message": f"Duplicate medications detected: {', '.join(duplicates)}"
        })
    
    # Check interactions using drug database
    interaction_warnings = check_medication_list(check.medications)
    
    for interaction in interaction_warnings:
        warnings.append({
            "type": "interaction",
            "severity": interaction["severity"],
            "medications": [interaction["drug1"], interaction["drug2"]],
            "message": f"{interaction['description']}: {interaction['recommendation']}"
        })
    
    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "moderate": 2, "low": 3}
    warnings.sort(key=lambda x: severity_order.get(x["severity"], 4))
    
    return {
        "medications_count": len(check.medications),
        "warnings": warnings,
        "status": "warnings" if warnings else "clear",
        "critical_count": sum(1 for w in warnings if w["severity"] == "critical")
    }

# --- Adverse Event Tracking ---

class AdverseEvent(BaseModel):
    patient_id: str
    event_type: str  # "medication_error", "fall", "infection", etc.
    description: str
    severity: str  # "minor", "moderate", "severe"

@router.post("/adverse-events")
async def log_adverse_event(
    event: AdverseEvent,
    current_user: User = Depends(get_current_user)
):
    """Log adverse event for quality tracking"""
    event_data = {
        **event.dict(),
        "reported_by": current_user.username,
        "reported_at": datetime.utcnow()
    }
    
    result = await mongo_db.adverse_events.insert_one(event_data)
    return {"id": str(result.inserted_id), "message": "Event logged"}

@router.get("/adverse-events/trends")
async def get_adverse_event_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """Analyze adverse event patterns"""
    # TODO: Aggregate event data and identify trends
    return {
        "period_days": days,
        "total_events": 0,
        "by_type": {},
        "by_severity": {},
        "trending_up": []
    }
