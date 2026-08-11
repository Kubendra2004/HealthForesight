from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database.database import Base, engine
from middleware.audit import AuditMiddleware
from routers import (
    admin,
    admin_audit,
    admin_tools,
    analytics,
    auth,
    chatbot,
    clinical_decision,
    doctor,
    fhir,
    files,
    frontdesk,
    integrations,
    messages,
    metrics,
    ml_models,
    operations,
    patient_portal,
    reports,
    resources,
    session_management,
    websocket,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HealthForesight API",
    description="Advanced Healthcare Management Platform with AI/ML Predictions",
    version="3.0.0",
)

app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(websocket.router)
app.include_router(analytics.router)
app.include_router(patient_portal.router)
app.include_router(admin_tools.router)
app.include_router(clinical_decision.router)
app.include_router(integrations.router)
app.include_router(admin_audit.router)
app.include_router(session_management.router)
app.include_router(reports.router)
app.include_router(messages.router)


@app.on_event("startup")
async def startup_event() -> None:
    print("Starting HealthForesight API...")
    print("Pre-loading RAG components for faster chatbot responses...")
    from routers.chatbot import initialize_rag

    initialize_rag()
    print("Startup complete!")


@app.get("/")
def read_root() -> dict:
    return {"message": "HealthForesight API is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
