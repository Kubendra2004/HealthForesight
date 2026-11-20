from fastapi import APIRouter, HTTPException, Depends, Query
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User, UserRole
from auth.authorization import require_roles
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
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.doctor))
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
    if not ObjectId.is_valid(cohort_id):
        raise HTTPException(status_code=400, detail="Invalid cohort ID")
    cohort = await mongo_db.cohorts.find_one({"_id": ObjectId(cohort_id)})
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != UserRole.admin and cohort.get("created_by") != current_user.username:
        raise HTTPException(status_code=403, detail="You can only view cohorts you created")
    
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
    # The application has no treatment outcome/readmission records yet. Do not
    # return a success rate that looks measured when no outcomes are collected.
    return {
        "condition": condition or "all",
        "available": False,
        "reason": "Treatment outcomes and 30-day readmissions are not recorded by this application yet.",
        "success_rate": None,
        "total_treatments": 0,
        "avg_recovery_days": None,
    }

# --- Cost Optimization ---

@router.get("/resource-utilization")
async def get_resource_utilization(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze resource utilization and identify waste.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    beds_total = await mongo_db.beds.count_documents({})
    beds_occupied = await mongo_db.beds.count_documents({"status": "Occupied"})
    oxygen_item = await mongo_db.inventory.find_one({"name": {"$regex": "oxygen", "$options": "i"}})
    oxygen_quantity = oxygen_item.get("quantity") if oxygen_item else None
    return {
        "period_days": days,
        "available": beds_total > 0 or oxygen_item is not None,
        "bed_capacity": beds_total,
        "occupied_beds": beds_occupied,
        "bed_utilization": round(beds_occupied / beds_total, 4) if beds_total else None,
        "oxygen_inventory_quantity": oxygen_quantity,
        "note": "Bed utilization is a current snapshot; historical utilization and oxygen consumption are not recorded.",
    }

@router.get("/cost-per-patient")
async def get_cost_per_patient(
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Summarize recorded bill amounts; the data does not support per-patient totals."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if department:
        raise HTTPException(status_code=422, detail="Bills do not currently record a department, so department filtering is unavailable.")

    bills = await mongo_db.bills.find({}, {"amount": 1}).to_list(10000)
    amounts = [float(bill["amount"]) for bill in bills if isinstance(bill.get("amount"), (int, float))]
    amounts.sort()
    count = len(amounts)
    median = (amounts[(count - 1) // 2] + amounts[count // 2]) / 2 if count else None
    return {
        "department": "all",
        "available": count > 0,
        "bill_count": count,
        "avg_bill_amount": round(sum(amounts) / count, 2) if count else None,
        "median_bill_amount": round(median, 2) if median is not None else None,
        "cost_breakdown": None,
        "note": "Based on recorded bill amounts; department and item categories are not consistently recorded.",
    }
