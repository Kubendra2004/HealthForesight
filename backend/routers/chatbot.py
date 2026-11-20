from datetime import datetime, timedelta
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from pymongo import MongoClient
from sqlalchemy.orm import Session

from auth.auth import get_current_user
from database.database import get_db, mongo_db
from database.models_mongo import AppointmentData, WaitlistEntry
from database.models_sql import User, UserRole

# Load .env from backend root (parent of routers/)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BACKEND_DIR, ".env")
load_dotenv(dotenv_path=env_path)

router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot & Intelligence"],
)

api_key = os.getenv("GEMINI_API_KEY")
genai_client = genai.Client(api_key=api_key) if api_key else None

CHROMA_DIR = os.path.join(BACKEND_DIR, "chroma_db")
PROTOCOLS_FILE = os.path.join(BACKEND_DIR, "documents", "hospital_protocols.txt")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
COLLECTION_NAME = "hospital_protocols"
MAX_CHAT_HISTORY_TURNS = 6
SIMILARITY_DISTANCE_THRESHOLD = 1.15

rag_components: Dict[str, Any] = {
    "collection": None,
    "initialized": False,
    "error": None,
    "protocol_version": None,
}

tool_runtime_context: Dict[str, Optional[str]] = {
    "patient_id": None,
    "current_user": None,
}


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    consent: bool = True


def _split_protocol_blocks(raw_text: str) -> List[Tuple[str, str, Dict[str, Any]]]:
    blocks = [block.strip() for block in re.split(r"\n\s*\n", raw_text) if block.strip()]
    protocol_docs: List[Tuple[str, str, Dict[str, Any]]] = []

    for index, block in enumerate(blocks, start=1):
        first_line = block.splitlines()[0].strip()
        title = first_line.replace("HOSPITAL PROTOCOL:", "").strip() or f"Protocol {index}"
        protocol_docs.append(
            (
                f"protocol_{index}",
                block,
                {
                    "source": "hospital_protocols.txt",
                    "title": title,
                    "section": index,
                },
            )
        )

    return protocol_docs


def _load_protocol_documents() -> List[Tuple[str, str, Dict[str, Any]]]:
    if not os.path.exists(PROTOCOLS_FILE):
        raise FileNotFoundError(f"Protocols file not found: {PROTOCOLS_FILE}")

    with open(PROTOCOLS_FILE, "r", encoding="utf-8") as file:
        return _split_protocol_blocks(file.read())


def _sync_protocol_collection(collection: Any) -> None:
    protocol_docs = _load_protocol_documents()
    existing = collection.get(include=["metadatas"])
    existing_docs_by_id = {
        doc_id: metadata or {}
        for doc_id, metadata in zip(existing.get("ids", []), existing.get("metadatas", []))
    }

    current_version = str(int(os.path.getmtime(PROTOCOLS_FILE)))
    desired_ids = [doc_id for doc_id, _, _ in protocol_docs]
    stale_ids = [doc_id for doc_id in existing_docs_by_id if doc_id not in desired_ids]
    if stale_ids:
        collection.delete(ids=stale_ids)

    upsert_ids: List[str] = []
    upsert_docs: List[str] = []
    upsert_metadatas: List[Dict[str, Any]] = []
    for doc_id, content, metadata in protocol_docs:
        next_metadata = dict(metadata)
        next_metadata["version"] = current_version

        if existing_docs_by_id.get(doc_id) != next_metadata:
            upsert_ids.append(doc_id)
            upsert_docs.append(content)
            upsert_metadatas.append(next_metadata)

    if upsert_ids:
        collection.upsert(
            ids=upsert_ids,
            documents=upsert_docs,
            metadatas=upsert_metadatas,
        )

    rag_components["protocol_version"] = current_version


def initialize_rag() -> None:
    if rag_components["initialized"]:
        return

    print("Initializing RAG components (ChromaDB + Embeddings)...")
    try:
        os.makedirs(CHROMA_DIR, exist_ok=True)
        chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
        embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME
        )
        collection = chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_func,
        )
        _sync_protocol_collection(collection)

        rag_components["client"] = chroma_client
        rag_components["embedding_func"] = embedding_func
        rag_components["collection"] = collection
        rag_components["initialized"] = True
        rag_components["error"] = None

        print("RAG components initialized and cached.")
    except Exception as exc:
        print(f"Error initializing RAG: {exc}")
        rag_components["error"] = str(exc)
        rag_components["initialized"] = True


def get_protocol_collection() -> Any:
    if not rag_components["initialized"]:
        initialize_rag()

    collection = rag_components.get("collection")
    current_version = str(int(os.path.getmtime(PROTOCOLS_FILE))) if os.path.exists(PROTOCOLS_FILE) else None
    if collection and current_version and rag_components.get("protocol_version") != current_version:
        _sync_protocol_collection(collection)

    return collection


def retrieve_protocol_context(query: str) -> Tuple[str, List[Dict[str, Any]]]:
    collection = get_protocol_collection()
    if not collection:
        return "", []

    try:
        results = collection.query(
            query_texts=[query],
            n_results=3,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:
        print(f"Protocol retrieval error: {exc}")
        return "", []

    docs = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    selected: List[Dict[str, Any]] = []
    for doc, metadata, distance in zip(docs, metadatas, distances):
        if distance is None or distance > SIMILARITY_DISTANCE_THRESHOLD:
            continue
        selected.append(
            {
                "title": (metadata or {}).get("title", "Hospital Protocol"),
                "source": (metadata or {}).get("source", "hospital_protocols.txt"),
                "distance": round(float(distance), 4),
                "content": doc,
            }
        )

    if not selected:
        return "", []

    context_blocks = [
        f"[{index}] {item['title']} ({item['source']})\n{item['content']}"
        for index, item in enumerate(selected, start=1)
    ]
    return "\n\n".join(context_blocks), selected


def set_tool_runtime_context(patient_id: str, current_user: str) -> None:
    tool_runtime_context["patient_id"] = patient_id
    tool_runtime_context["current_user"] = current_user


def clear_tool_runtime_context() -> None:
    tool_runtime_context["patient_id"] = None
    tool_runtime_context["current_user"] = None


def _parse_appointment_datetime(date_str: str) -> datetime:
    cleaned = date_str.strip().replace("Z", "+00:00")
    parsed = datetime.fromisoformat(cleaned)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def _create_validated_appointment(patient_id: str, doctor_id: str, date_str: str, reason: str) -> Dict[str, Any]:
    if tool_runtime_context.get("patient_id") != patient_id:
        return {"status": "error", "message": "Tool context mismatch. Appointment not created."}

    if not reason or len(reason.strip()) < 3:
        return {"status": "error", "message": "A short reason for the visit is required."}

    try:
        appointment_date = _parse_appointment_datetime(date_str)
    except ValueError:
        return {
            "status": "error",
            "message": "Please provide the appointment date in ISO format like 2026-08-15T10:30:00.",
        }

    if appointment_date <= datetime.utcnow():
        return {"status": "error", "message": "Appointment time must be in the future."}

    sql_db: Session = next(get_db())
    try:
        doctor = (
            sql_db.query(User)
            .filter(User.username == doctor_id, User.role == UserRole.doctor, User.is_active.is_(True))
            .first()
        )
        if not doctor:
            return {"status": "error", "message": f"Doctor '{doctor_id}' was not found."}
    finally:
        sql_db.close()

    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongo_db_name = os.getenv("MONGODB_DB", "health_app_ai")
    with MongoClient(mongo_url) as sync_client:
        sync_db = sync_client[mongo_db_name]

        conflict = sync_db.appointments.find_one(
            {
                "doctor_id": doctor_id,
                "date": {
                    "$gt": appointment_date - timedelta(minutes=15),
                    "$lt": appointment_date + timedelta(minutes=15),
                },
                "status": {"$ne": "Cancelled"},
            }
        )
        if conflict:
            return {
                "status": "error",
                "message": "Doctor is not available at that time. Please choose another slot.",
            }

        appointment = AppointmentData(
            patient_id=patient_id,
            doctor_id=doctor_id,
            date=appointment_date,
            reason=reason.strip(),
            type="in-person",
            status="Requested",
        )
        result = sync_db.appointments.insert_one(appointment.dict())

    return {
        "status": "success",
        "message": "Appointment request created successfully.",
        "details": f"Doctor: {doctor_id}, Date: {appointment_date.isoformat()}",
        "appointment_id": str(result.inserted_id),
    }


def _create_waitlist_entry(patient_id: str, priority: str = "Medium", reason: str = "Requested by chatbot") -> Dict[str, Any]:
    normalized_priority = (priority or "Medium").capitalize()
    if normalized_priority not in {"High", "Medium", "Low"}:
        normalized_priority = "Medium"

    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    mongo_db_name = os.getenv("MONGODB_DB", "health_app_ai")
    with MongoClient(mongo_url) as sync_client:
        sync_db = sync_client[mongo_db_name]
        existing = sync_db.waitlist.find_one(
            {
                "patient_id": patient_id,
                "status": {"$in": ["Waiting", "Pending"]},
            }
        )
        if existing:
            return {
                "status": "error",
                "message": "Patient is already on the active waitlist.",
            }

        entry = WaitlistEntry(
            patient_id=patient_id,
            priority=normalized_priority,
            reason=reason[:200],
            department="General",
        )
        result = sync_db.waitlist.insert_one(entry.dict())

    return {
        "status": "success",
        "message": f"Patient added to waitlist with {normalized_priority} priority.",
        "waitlist_id": str(result.inserted_id),
    }


def book_appointment(doctor_id: str, date_str: str, reason: str) -> Dict[str, Any]:
    patient_id = tool_runtime_context.get("patient_id")
    if not patient_id:
        return {"status": "error", "message": "No patient is bound to the current chat session."}
    return _create_validated_appointment(patient_id, doctor_id, date_str, reason)


def add_to_waitlist(priority: str = "Medium", reason: str = "Requested by chatbot") -> Dict[str, Any]:
    patient_id = tool_runtime_context.get("patient_id")
    if not patient_id:
        return {"status": "error", "message": "No patient is bound to the current chat session."}
    return _create_waitlist_entry(patient_id, priority, reason)


tools_list = [book_appointment, add_to_waitlist]


async def _build_patient_context(patient_id: str) -> str:
    context_parts: List[str] = []

    profile = await mongo_db.patient_profiles.find_one({"patient_id": patient_id}) or {}
    if profile:
        bmi = None
        try:
            if profile.get("height") and profile.get("weight"):
                bmi = float(profile["weight"]) / ((float(profile["height"]) / 100) ** 2)
        except Exception:
            bmi = None

        core_items = []
        if profile.get("age") is not None:
            core_items.append(f"Age {profile.get('age')}")
        if profile.get("gender"):
            core_items.append(str(profile.get("gender")))
        if profile.get("blood_type"):
            core_items.append(f"Blood Type {profile.get('blood_type')}")
        if profile.get("height") and profile.get("weight"):
            core_items.append(f"Height {profile.get('height')} cm")
            core_items.append(f"Weight {profile.get('weight')} kg")
        if bmi is not None:
            core_items.append(f"BMI {bmi:.1f}")
        if core_items:
            context_parts.append("Profile: " + ", ".join(core_items))

        vitals = []
        if profile.get("systolic_bp") or profile.get("diastolic_bp"):
            vitals.append(f"Blood Pressure {profile.get('systolic_bp', '?')}/{profile.get('diastolic_bp', '?')}")
        if profile.get("heart_rate") is not None:
            vitals.append(f"Heart Rate {profile.get('heart_rate')} bpm")
        if profile.get("temperature") is not None:
            vitals.append(f"Temperature {profile.get('temperature')} C")
        if profile.get("oxygen_level") is not None:
            vitals.append(f"Oxygen Saturation {profile.get('oxygen_level')}%")
        if profile.get("glucose") is not None:
            vitals.append(f"Glucose {profile.get('glucose')} mg/dL")
        if profile.get("cholesterol") is not None:
            vitals.append(f"Cholesterol {profile.get('cholesterol')} mg/dL")
        if vitals:
            context_parts.append("Vitals and Labs: " + ", ".join(vitals))

        lifestyle = []
        if profile.get("smoking"):
            lifestyle.append(f"Smoking: {profile.get('smoking')}")
        if profile.get("alcohol"):
            lifestyle.append(f"Alcohol: {profile.get('alcohol')}")
        if profile.get("activity_level"):
            lifestyle.append(f"Activity Level: {profile.get('activity_level')}")
        if lifestyle:
            context_parts.append("Lifestyle: " + ", ".join(lifestyle))

        history_items = []
        if profile.get("conditions"):
            history_items.append(f"Conditions: {profile.get('conditions')}")
        if profile.get("medications"):
            history_items.append(f"Recorded Medications: {profile.get('medications')}")
        if profile.get("allergies"):
            history_items.append(f"Allergies: {profile.get('allergies')}")
        if history_items:
            context_parts.append("Profile History: " + ", ".join(history_items))

        symptom_labels = {
            "polyuria": "Frequent urination",
            "polydipsia": "Excessive thirst",
            "sudden_weight_loss": "Sudden weight loss",
            "weakness": "Weakness",
            "polyphagia": "Excessive hunger",
            "genital_thrush": "Genital thrush",
            "visual_blurring": "Blurred vision",
            "itching": "Itching",
            "irritability": "Irritability",
            "delayed_healing": "Delayed healing",
            "partial_paresis": "Partial paresis",
            "muscle_stiffness": "Muscle stiffness",
            "alopecia": "Alopecia",
        }
        symptoms = [label for key, label in symptom_labels.items() if str(profile.get(key, 0)) in {"1", "True", "true"} or profile.get(key) == 1]
        if symptoms:
            context_parts.append("Reported Symptoms: " + ", ".join(symptoms))

    heart_pred = await mongo_db.heart_predictions.find_one(
        {"patient_id": patient_id},
        sort=[("created_at", -1)],
    )
    if heart_pred and heart_pred.get("probability") is not None:
        context_parts.append(
            "Heart Disease Risk Model: "
            f"{'High' if heart_pred.get('prediction') == 1 else 'Low'} "
            f"(Probability {float(heart_pred.get('probability')):.2f})"
        )

    diabetes_pred = await mongo_db.diabetes_predictions.find_one(
        {"patient_id": patient_id},
        sort=[("created_at", -1)],
    )
    if diabetes_pred and diabetes_pred.get("probability") is not None:
        context_parts.append(
            "Diabetes Risk Model: "
            f"{'High' if diabetes_pred.get('prediction') == 1 else 'Low'} "
            f"(Probability {float(diabetes_pred.get('probability')):.2f})"
        )

    medical_history = await (
        mongo_db.medical_history.find({"patient_id": patient_id})
        .sort("created_at", -1)
        .limit(5)
        .to_list(length=5)
    )
    if medical_history:
        history_lines = []
        for item in medical_history:
            history_lines.append(
                f"{item.get('condition', 'Unknown condition')} ({item.get('status', 'Unknown status')}, diagnosed {item.get('date_diagnosed', 'Unknown date')})"
            )
        context_parts.append("Medical History Entries: " + "; ".join(history_lines))

    prescriptions = await (
        mongo_db.prescriptions.find({"patient_id": patient_id})
        .sort("created_at", -1)
        .limit(5)
        .to_list(length=5)
    )
    if prescriptions:
        prescription_lines = []
        for prescription in prescriptions:
            meds = prescription.get("medicines")
            if isinstance(meds, list) and meds:
                med_text = ", ".join(
                    f"{med.get('name', 'Unknown')} {med.get('dosage', '')}".strip()
                    for med in meds[:4]
                )
            else:
                med_text = prescription.get("medication") or "Unknown medication"
            prescription_lines.append(
                f"{med_text} from {prescription.get('doctor_id', prescription.get('prescribed_by', 'Unknown doctor'))}"
            )
        context_parts.append("Recent Prescriptions: " + "; ".join(prescription_lines))

    journal_entries = await (
        mongo_db.health_journal.find({"patient_id": patient_id})
        .sort("date", -1)
        .limit(5)
        .to_list(length=5)
    )
    if journal_entries:
        journal_lines = [
            f"{entry.get('type', 'entry')}: {entry.get('value', '')}"
            + (f" ({entry.get('notes')})" if entry.get("notes") else "")
            for entry in journal_entries
        ]
        context_parts.append("Recent Journal Entries: " + "; ".join(journal_lines))

    report = await mongo_db.reports.find_one(
        {"patient_id": patient_id, "processed": True},
        sort=[("uploaded_at", -1)],
    )
    if report and report.get("extracted_vitals"):
        context_parts.append(f"Latest Extracted Report Vitals: {report.get('extracted_vitals')}")

    return "\n".join(context_parts)


async def _get_recent_chat_history(patient_id: str) -> List[Dict[str, str]]:
    cursor = (
        mongo_db.chatbot_messages.find({"patient_id": patient_id})
        .sort("created_at", -1)
        .limit(MAX_CHAT_HISTORY_TURNS * 2)
    )
    items = await cursor.to_list(length=MAX_CHAT_HISTORY_TURNS * 2)
    items.reverse()
    return [{"role": item.get("role", "user"), "content": item.get("content", "")} for item in items]


async def _store_chat_turn(patient_id: str, user_query: str, assistant_response: str) -> None:
    now = datetime.utcnow()
    await mongo_db.chatbot_messages.insert_many(
        [
            {
                "patient_id": patient_id,
                "role": "user",
                "content": user_query,
                "created_at": now,
            },
            {
                "patient_id": patient_id,
                "role": "assistant",
                "content": assistant_response,
                "created_at": now,
            },
        ]
    )


def _format_history_for_prompt(history: List[Dict[str, str]]) -> str:
    if not history:
        return "No previous conversation."

    lines = []
    for item in history:
        speaker = "Patient" if item["role"] == "user" else "Assistant"
        lines.append(f"{speaker}: {item['content']}")
    return "\n".join(lines)


def _extract_usage_metrics(response: Any) -> Dict[str, Optional[int]]:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return {
            "prompt_tokens": None,
            "completion_tokens": None,
            "total_tokens": None,
            "thought_tokens": None,
        }

    def _safe_int(value: Any) -> Optional[int]:
        try:
            return int(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    return {
        "prompt_tokens": _safe_int(getattr(usage, "prompt_token_count", None)),
        "completion_tokens": _safe_int(getattr(usage, "candidates_token_count", None)),
        "total_tokens": _safe_int(getattr(usage, "total_token_count", None)),
        "thought_tokens": _safe_int(getattr(usage, "thoughts_token_count", None)),
    }


async def _log_chatbot_usage(
    patient_id: str,
    query: str,
    latency_ms: int,
    usage: Dict[str, Optional[int]],
    rag_used: bool,
    context_used: bool,
    sources: List[Dict[str, Any]],
) -> None:
    await mongo_db.chatbot_usage_logs.insert_one(
        {
            "patient_id": patient_id,
            "query_preview": query[:200],
            "latency_ms": latency_ms,
            "usage": usage,
            "rag_used": rag_used,
            "context_used": context_used,
            "sources": [
                {
                    "title": item.get("title"),
                    "source": item.get("source"),
                    "distance": item.get("distance"),
                }
                for item in sources
            ],
            "created_at": datetime.utcnow(),
        }
    )


@router.post("/ask")
async def ask_chatbot(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    if current_user.role != UserRole.patient:
        raise HTTPException(status_code=403, detail="Chatbot access is limited to patients.")

    if not genai_client:
        return {
            "response": "I'm currently offline because the AI service is not configured.",
            "context_used": False,
            "rag_used": False,
            "tool_used": False,
            "sources": [],
        }

    patient_id = current_user.username
    context = ""
    rag_context = ""
    protocol_sources: List[Dict[str, Any]] = []
    chat_history: List[Dict[str, str]] = []
    request_started = time.perf_counter()

    try:
        rag_context, protocol_sources = retrieve_protocol_context(request.query)

        if request.consent:
            context = await _build_patient_context(patient_id)

        chat_history = await _get_recent_chat_history(patient_id)

        prompt = (
            "You are an advanced AI Health Assistant. Provide clear, empathetic health guidance.\n"
            "Rules:\n"
            "1. Use protocol context only when it is relevant.\n"
            "2. If the user asks for an appointment or waitlist action, use the provided tools.\n"
            "3. Do not invent patient facts that are not present in the context.\n"
            "4. Mention uncertainty when protocol context is missing.\n"
            "5. Add a brief reminder to seek urgent care for emergency symptoms.\n\n"
            f"Authenticated Patient ID: {patient_id}\n"
            f"Patient Consented Context:\n{context or 'No patient context shared for this request.'}\n\n"
            f"Relevant Protocols:\n{rag_context or 'No sufficiently relevant protocol found.'}\n\n"
            f"Recent Conversation:\n{_format_history_for_prompt(chat_history)}\n\n"
            f"Current User Question:\n{request.query}\n\n"
            "If you use protocol context, cite it briefly with the protocol title in plain text."
        )

        set_tool_runtime_context(patient_id=patient_id, current_user=current_user.username)
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(tools=tools_list),
        )
        assistant_text = response.text or "I'm sorry, I couldn't generate a response just now."
        usage_metrics = _extract_usage_metrics(response)
        latency_ms = int((time.perf_counter() - request_started) * 1000)
        clear_tool_runtime_context()

        await _store_chat_turn(patient_id, request.query, assistant_text)
        await _log_chatbot_usage(
            patient_id=patient_id,
            query=request.query,
            latency_ms=latency_ms,
            usage=usage_metrics,
            rag_used=bool(protocol_sources),
            context_used=bool(context),
            sources=protocol_sources,
        )

        return {
            "response": assistant_text,
            "context_used": bool(context),
            "rag_used": bool(protocol_sources),
            "tool_used": bool(getattr(response, "function_calls", None)),
            "metrics": {
                "latency_ms": latency_ms,
                **usage_metrics,
            },
            "sources": [
                {
                    "title": item["title"],
                    "source": item["source"],
                    "distance": item["distance"],
                }
                for item in protocol_sources
            ],
        }
    except Exception as exc:
        clear_tool_runtime_context()
        print(f"Chatbot Error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
