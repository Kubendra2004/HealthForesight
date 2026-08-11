from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
from google import genai
from google.genai import types
from database.database import mongo_db
from database.models_mongo import HeartDiseaseData, DiabetesData
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions

# Load .env from backend root (parent of routers/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=env_path)

router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot & Intelligence"]
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
genai_client = genai.Client(api_key=api_key) if api_key else None

# Global RAG Components Cache (initialized once at startup)
rag_components = {
    'collection': None,
    'initialized': False,
    'error': None
}

def initialize_rag():
    """
    Initialize RAG components at startup (called once).
    """
    global rag_components
    
    if rag_components['initialized']:
        return
        
    print("🔄 Initializing RAG components (ChromaDB + Embeddings)...")
    try:
        # Initialize ChromaDB (RAG)
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        DB_DIR = os.path.join(BASE_DIR, '../chroma_db')
        
        # Check if DB dir exists, create if not
        if not os.path.exists(DB_DIR):
             os.makedirs(DB_DIR, exist_ok=True)

        chroma_client = chromadb.PersistentClient(path=DB_DIR)
        
        # Embedding Model (Heavy Load - but only once!)
        EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
        embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL_NAME)
        
        collection = chroma_client.get_or_create_collection(
            name="hospital_protocols", 
            embedding_function=embedding_func
        )
        
        rag_components['client'] = chroma_client
        rag_components['embedding_func'] = embedding_func
        rag_components['collection'] = collection
        rag_components['initialized'] = True
        
        print("✅ RAG components initialized and cached.")
        
    except Exception as e:
        print(f"❌ Error initializing RAG: {e}")
        rag_components['error'] = str(e)
        rag_components['initialized'] = True  # Mark as attempted

def get_protocol_collection():
    """
    Get the pre-initialized RAG collection (fast lookup).
    """
    if not rag_components['initialized']:
        initialize_rag()
    
    return rag_components.get('collection')

class ChatRequest(BaseModel):
    patient_id: str
    query: str
    consent: bool = False # Explicit consent required for context

# ... imports ...
from datetime import datetime

# --- Tools ---
from datetime import datetime as dt

def book_appointment(patient_id: str, doctor_id: str, date_str: str, reason: str):
    """Books an appointment for a patient.
    ARGS:
    - patient_id: the username of the patient
    - doctor_id: the username of the doctor
    - date_str: ISO string of date/time (e.g. 2025-10-10T10:00:00)
    - reason: short reason for visit
    """
    try:
        # Convert date
        # Gemini often gives sloppy dates, try to standardise or accept as is
        # Ideally we parse it but for simplicity lets treat as string or simple parse
        
        appt_doc = {
           "patient_id": patient_id,
           "doctor_id": doctor_id,
           "date": date_str, 
           "reason": reason,
           "type": "in-person",
           "status": "Requested",
           "created_at": datetime.now()
        }
        
        # Real DB Write using sync pymongo for tool compatibility
        # We create a temporary sync client just for this operation
        # In production, cache this client globally similar to async "client"
        try:
            from pymongo import MongoClient
            # Re-read env var here or use hardcoded fallback as safe default matching database.py
            m_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            m_db = os.getenv("MONGODB_DB", "health_app_ai")
            
            with MongoClient(m_url) as sync_client:
                 sync_db = sync_client[m_db]
                 result = sync_db.appointments.insert_one(appt_doc)
                 
            return {
                "status": "success",
                "message": f"Appointment successfully booked with ID {result.inserted_id}",
                "details": f"Doctor: {doctor_id}, Date: {date_str}"
            }
        except Exception as db_err:
             print(f"DB Error in tool: {db_err}")
             return {"status": "error", "message": "Failed to save appointment to database."}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def add_to_waitlist(patient_id: str, priority: str = "Normal"):
    """Adds a patient to the bed waitlist."""
    return {
        "status": "success",
        "message": f"Patient {patient_id} added to waitlist with {priority} priority.",
        "waitlist_id": f"wl_{int(datetime.now().timestamp())}"
    }

tools_list = [book_appointment, add_to_waitlist]

@router.post("/ask")
async def ask_chatbot(request: ChatRequest):
    if not genai_client:
        # Instead of crashing, return a polite unavailable message
        # This prevents the 500 error on frontend
        return {
            "response": "I'm currently offline because my AI brain (API Key) isn't configured. Please ask the administrator to check the settings.",
            "context_used": False,
            "rag_used": False,
            "tool_used": False
        }
    
    # Check if key works (simple validation if needed, but existence is first step)
    if api_key.strip() == "":
         return {
            "response": "Configuration Error: API Key is empty.",
            "context_used": False,
            "rag_used": False,
            "tool_used": False
        }
        
    try:
        context = ""
        rag_context = ""
        
        # 1. RAG Retrieval (Always run if query is present)
        if request.query:
            collection = get_protocol_collection()
            if collection:
                results = collection.query(
                    query_texts=[request.query],
                    n_results=2
                )
                if results['documents']:
                    rag_context = "\n".join(results['documents'][0])
        
        # 2. Patient Context (Consent required)
        if request.consent:
            # Patient Profile
            profile = await mongo_db.profiles.find_one({"username": request.patient_id})
            if profile:
                context += f"Patient Profile: Age {profile.get('age')}, {profile.get('gender')}\n"
                context += f"Conditions: {profile.get('existing_conditions') or 'None'}\n"
                if profile.get('allergies'):
                    context += f"Allergies: {profile.get('allergies')}\n"

            # Latest Heart Prediction
            heart_pred = await mongo_db.heart_predictions.find_one(
                {"patient_id": request.patient_id}, sort=[("created_at", -1)]
            )
            if heart_pred:
                context += f"Heart Disease Risk: {'High' if heart_pred.get('prediction') == 1 else 'Low'} (Prob: {heart_pred.get('probability'):.2f})\n"
                
            # Latest Diabetes Prediction
            diabetes_pred = await mongo_db.diabetes_predictions.find_one(
                {"patient_id": request.patient_id}, sort=[("created_at", -1)]
            )
            if diabetes_pred:
                context += f"Diabetes Risk: {'High' if diabetes_pred.get('prediction') == 1 else 'Low'} (Prob: {diabetes_pred.get('probability'):.2f})\n"
                
            # Latest Report Vitals
            report = await mongo_db.reports.find_one(
                {"patient_id": request.patient_id, "processed": True}, sort=[("uploaded_at", -1)]
            )
            if report and report.get("extracted_vitals"):
                context += f"Latest Vitals: {report.get('extracted_vitals')}\n"
        
        # 3. Construct Prompt
        system_prompt = (
            "You are an advanced AI Health Assistant. Your goal is to provide helpful, accurate, and empathetic health guidance. "
            "You have access to the patient's medical profile and recent risk assessments. Use this context to tailor your advice. "
            "If the user asks about their specific health risks, refer to the heart and diabetes predictions if available. "
            "If the user wants to book an appointment or join a waitlist, USE THE PROVIDED TOOLS. "
            "1. **Hospital Protocols**: Use the provided 'Relevant Protocols' to guide your answer. "
            "2. **Patient Context**: Tailor advice to the patient's age, gender, and conditions. "
            "3. **Tone**: Be professional, encouraging, and clear. Do not be overly restrictive with disclaimers, but do suggest seeing a doctor for severe symptoms.\n\n"
            f"Relevant Protocols:\n{rag_context}\n\n"
            f"Patient Medical Context:\n{context}\n\n"
            f"User Question: {request.query}\n\n"
            f"IMPORTANT: The patient's ID is '{request.patient_id}'. If the user asks to book an appointment, use this ID automatically. DO NOT ask for their Patient ID."
        )
        
        # 4. Call Gemini with Tools
        try:
            response = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=system_prompt,
                config=types.GenerateContentConfig(
                    tools=tools_list,
                ),
            )
            
            return {
                "response": response.text or "", 
                "context_used": bool(context),
                "rag_used": bool(rag_context),
                "tool_used": bool(getattr(response, "function_calls", None))
            }
        except Exception as gemini_error:
            print(f"Gemini API Error: {gemini_error}")
            # Fallback response
            return {
                "response": "I'm currently experiencing technical difficulties. Please try again or contact support for urgent medical needs.",
                "context_used": bool(context),
                "rag_used": bool(rag_context),
                "tool_used": False,
                "error": str(gemini_error)
            }
        
    except Exception as e:
        print(f"Chatbot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
