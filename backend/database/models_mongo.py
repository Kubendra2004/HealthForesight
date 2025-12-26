from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HeartDiseaseData(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    fbs: int
    restecg: int
    thalach: int
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int
    prediction: Optional[int] = None
    probability: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "age": 63,
                "sex": 1,
                "cp": 3,
                "trestbps": 145,
                "chol": 233,
                "fbs": 1,
                "restecg": 0,
                "thalach": 150,
                "exang": 0,
                "oldpeak": 2.3,
                "slope": 0,
                "ca": 0,
                "thal": 1,
                "prediction": 1,
                "probability": 0.85
            }
        }

class DiabetesData(BaseModel):
    age: int
    gender: str
    polyuria: int
    polydipsia: int
    sudden_weight_loss: int
    weakness: int
    polyphagia: int
    genital_thrush: int
    visual_blurring: int
    itching: int
    irritability: int
    delayed_healing: int
    partial_paresis: int
    muscle_stiffness: int
    alopecia: int
    obesity: int
    prediction: Optional[int] = None
    probability: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "age": 40,
                "gender": "Male",
                "polyuria": 1,
                "polydipsia": 1,
                "sudden_weight_loss": 0,
                "weakness": 1,
                "polyphagia": 0,
                "genital_thrush": 0,
                "visual_blurring": 0,
                "itching": 1,
                "irritability": 0,
                "delayed_healing": 1,
                "partial_paresis": 0,
                "muscle_stiffness": 1,
                "alopecia": 1,
                "obesity": 1,
                "prediction": 1,
                "probability": 0.92
            }
        }

class PatientClusterData(BaseModel):
    age: float
    gender: float
    chest_pain_type: int
    blood_pressure: float
    cholesterol: float
    max_heart_rate: float
    exercise_angina: int
    plasma_glucose: float
    skin_thickness: float
    insulin: float
    bmi: float
    diabetes_pedigree: float
    hypertension: int
    heart_disease: int
    smoking_status: float
    cluster: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReadmissionData(BaseModel):
    age: int
    gender: int
    admission_type: int
    diagnosis: int
    num_lab_procedures: int
    num_medications: int
    num_outpatient: int
    num_emergency: int
    num_inpatient: int
    length_of_stay: int
    prediction: Optional[int] = None 
    probability: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BillItem(BaseModel):
    description: str
    cost: float

class BillData(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    items: List[BillItem]
    amount: float
    status: str = "Pending"
    date: datetime = Field(default_factory=datetime.utcnow)

class DailySales(BaseModel):
    date: str # YYYY-MM-DD
    total_revenue: float = 0.0
    transaction_count: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentData(BaseModel):
    patient_id: str
    doctor_id: str
    date: datetime
    reason: str
    type: str = "in-person"
    status: str = "Scheduled"
    meet_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationData(BaseModel):
    user_id: str
    message: str
    type: str = "info" # info, warning, success, error
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Medicine(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class PrescriptionData(BaseModel):
    doctor_id: str
    patient_id: str
    appointment_id: Optional[str] = None
    medicines: List[Medicine]
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class InventoryItem(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    reorder_level: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class ResourceData(BaseModel):
    type: str # 'oxygen', 'staff', 'icu'
    count: int
    total_capacity: int
    status: str # 'Normal', 'Critical', 'Warning'
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class BedData(BaseModel):
    bed_number: str
    type: str # 'General', 'ICU', 'Private', 'Emergency'
    status: str = "Available" # Available, Occupied, Maintenance
    patient_id: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class BedAllocation(BaseModel):
    bed_id: str
    patient_id: str

class BedDeallocation(BaseModel):
    bed_id: str
    patient_id: str

class WaitlistEntry(BaseModel):
    patient_id: str
    priority: str # High, Medium, Low
    reason: str
    department: str
    status: str = "Waiting" # Waiting, Admitted, Cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
