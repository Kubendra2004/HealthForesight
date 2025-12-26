from fastapi import APIRouter, HTTPException
from database.database import mongo_db
from typing import Optional
from datetime import datetime

router = APIRouter(
    prefix="/fhir",
    tags=["FHIR Interoperability"]
)

@router.get("/Patient/{patient_id}")
async def get_fhir_patient(patient_id: str):
    """
    Returns patient data in FHIR R4 Patient resource format.
    Maps internal data to HL7 FHIR standard.
    """
    try:
        # In a real implementation, fetch from your patient database
        # For now, we'll return a sample FHIR Patient resource
        
        # Check if we have any data for this patient
        heart_data = await mongo_db.heart_predictions.find_one({"patient_id": patient_id})
        
        if not heart_data:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # FHIR R4 Patient Resource
        fhir_patient = {
            "resourceType": "Patient",
            "id": patient_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.utcnow().isoformat() + "Z"
            },
            "identifier": [
                {
                    "system": "http://hospital.example.org/patients",
                    "value": patient_id
                }
            ],
            "active": True,
            "name": [
                {
                    "use": "official",
                    "family": "Patient",
                    "given": [patient_id]  # Placeholder
                }
            ],
            "gender": "unknown",  # Map from your data
            "birthDate": "1980-01-01",  # Placeholder
            "address": [
                {
                    "use": "home",
                    "type": "both",
                    "city": "Unknown"
                }
            ]
        }
        
        return fhir_patient
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FHIR mapping failed: {str(e)}")

@router.get("/Patient")
async def search_fhir_patients(name: Optional[str] = None):
    """
    Search for patients. Returns FHIR Bundle.
    """
    try:
        # Simple search implementation
        # In production, implement proper FHIR search parameters
        
        bundle = {
            "resourceType": "Bundle",
            "type": "searchset",
            "total": 0,
            "entry": []
        }
        
        return bundle
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FHIR search failed: {str(e)}")
