from fastapi import FastAPI # Reload trigger 3
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    auth, ml_models, frontdesk, admin, files, doctor, chatbot, resources,
    operations, fhir, metrics, websocket, analytics, patient_portal,
    admin_tools, clinical_decision, integrations, admin_audit, session_management, reports
)
from database.database import engine, Base
from middleware.audit import AuditMiddleware
import uvicorn

# Create Tables (SQL)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HealthForesight API",
    description="Advanced Healthcare Management Platform with AI/ML Predictions",
    version="3.0.0"
)

# Add Audit Middleware (HIPAA Compliance)
app.add_middleware(AuditMiddleware)

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(ml_models.router)
app.include_router(frontdesk.router)
app.include_router(admin.router)
app.include_router(files.router)
app.include_router(doctor.router)
app.include_router(chatbot.router)
app.include_router(resources.router)
app.include_router(operations.router)
app.include_router(fhir.router)
app.include_router(metrics.router)
# Phase 3 Routers
app.include_router(websocket.router)
app.include_router(analytics.router)
app.include_router(patient_portal.router)
app.include_router(admin_tools.router)
app.include_router(clinical_decision.router)
app.include_router(integrations.router)
app.include_router(admin_audit.router)
app.include_router(session_management.router)
app.include_router(reports.router)

@app.on_event("startup")
async def startup_event():
    """Initialize heavy resources at startup"""
    print("🚀 Starting HealthForesight API...")
    print("📦 Pre-loading RAG components for faster chatbot responses...")
    from routers.chatbot import initialize_rag
    initialize_rag()
    print("✅ Startup complete!")

@app.get("/")
def read_root():
    return {"message": "HealthForesight API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
