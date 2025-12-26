from fastapi import APIRouter, HTTPException, Depends, Query
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User, UserRole
from typing import Optional, List
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & Insights"]
)

# --- Patient Cohort Analysis ---

@router.post("/cohorts/create")
async def create_cohort(
    name: str,
    filters: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Create patient cohort based on filters.
    Filters: {"age_min": 50, "conditions": ["diabetes"], "risk_level": "high"}
    """
    cohort = {
        "name": name,
        "filters": filters,
        "created_by": current_user.username,
        "created_at": datetime.utcnow(),
        "patient_count": 0  # Calculate from filters
    }
    
    result = await mongo_db.cohorts.insert_one(cohort)
    return {"id": str(result.inserted_id), "message": "Cohort created"}

@router.get("/cohorts/{cohort_id}/stats")
async def get_cohort_stats(cohort_id: str, current_user: User = Depends(get_current_user)):
    """Get statistics for a patient cohort with real data aggregation"""
    from bson import ObjectId
    
    # Get cohort definition
    cohort = await mongo_db.cohorts.find_one({"_id": ObjectId(cohort_id)})
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    
    filters = cohort.get("filters", {})
    
    # Build aggregation pipeline based on filters
    match_stage = {}
    
    # Example: age filter
    if "age_min" in filters:
        match_stage["age"] = {"$gte": filters["age_min"]}
    if "age_max" in filters:
        if "age" not in match_stage:
            match_stage["age"] = {}
        match_stage["age"]["$lte"] = filters["age_max"]
    
    # Risk level filter
    if "risk_level" in filters:
        match_stage["risk_level"] = filters["risk_level"]
    
    # Aggregate data from multiple collections
    stats = {
        "cohort_id": cohort_id,
        "cohort_name": cohort.get("name"),
        "total_patients": 0,
        "avg_age": 0,
        "risk_distribution": {},
        "common_conditions": []
    }
    
    # Count patients in clustering data
    if match_stage:
        patients = await mongo_db.clustering_predictions.find(match_stage).to_list(1000)
        stats["total_patients"] = len(patients)
        
        if patients:
            # Calculate average age
            ages = [p.get("age", 0) for p in patients if "age" in p]
            stats["avg_age"] = round(sum(ages) / len(ages), 1) if ages else 0
            
            # Risk distribution
            risks = [p.get("risk_level", "Unknown") for p in patients]
            for risk in set(risks):
                stats["risk_distribution"][risk] = risks.count(risk)
    
    return stats

# --- Length of Stay Prediction ---

@router.post("/predict/length-of-stay")
async def predict_los(
    age: int,
    diagnosis: str,
    severity: int,  # 1-5 scale
    comorbidities: int,
    current_user: User = Depends(get_current_user)
):
    """
    Predict hospital length of stay.
    Returns estimated days and confidence interval.
    """
    # Simplified prediction (in production, use trained model)
    base_days = 3
    age_factor = (age - 50) / 10 * 0.5
    severity_factor = severity * 0.8
    comorbidity_factor = comorbidities * 0.3
    
    predicted_days = max(1, base_days + age_factor + severity_factor + comorbidity_factor)
    
    return {
        "predicted_days": round(predicted_days, 1),
        "confidence_interval": [max(1, predicted_days - 2), predicted_days + 2],
        "factors": {
            "age_impact": round(age_factor, 2),
            "severity_impact": round(severity_factor, 2),
            "comorbidity_impact": round(comorbidity_factor, 2)
        }
    }

# --- Outcome Tracking ---

@router.get("/outcomes/treatment-success")
async def get_treatment_success_rates(
    condition: Optional[str] = None,
    start_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get treatment success rates by condition.
    Success defined as: readmission within 30 days = failure
    """
    # TODO: Calculate from actual patient outcomes
    return {
        "condition": condition or "all",
        "success_rate": 0.85,
        "total_treatments": 0,
        "avg_recovery_days": 0
    }

# --- Cost Optimization ---

@router.get("/resource-utilization")
async def get_resource_utilization(
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze resource utilization and identify waste.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # TODO: Implement actual utilization analysis
    return {
        "period_days": days,
        "bed_utilization": 0.78,
        "oxygen_waste_estimate": 0,
        "icu_idle_hours": 0,
        "recommendations": [
            "Consider reducing ICU capacity by 2 beds during off-peak hours",
            "Oxygen usage is optimal"
        ]
    }

@router.get("/cost-per-patient")
async def get_cost_per_patient(
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Average cost per patient by department"""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # TODO: Calculate from billing data
    return {
        "department": department or "all",
        "avg_cost": 0,
        "median_cost": 0,
        "cost_breakdown": {
            "consultations": 0,
            "procedures": 0,
            "medications": 0,
            "room": 0
        }
    }
