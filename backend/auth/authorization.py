from fastapi import Depends, HTTPException, status

from auth.auth import get_current_user
from database.database import mongo_db
from database.models_sql import User, UserRole


def require_roles(*roles: UserRole):
    """Build a FastAPI dependency that restricts an endpoint to specific roles."""

    allowed = {role.value for role in roles}

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        role = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return dependency


async def require_patient_access(
    patient_id: str,
    current_user: User,
    *,
    allow_frontdesk: bool = False,
) -> None:
    """Allow a patient to access their own data and assigned clinicians to access theirs."""

    role = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    if role == UserRole.admin.value:
        return
    if role == UserRole.patient.value and current_user.username == patient_id:
        return
    if allow_frontdesk and role == UserRole.frontdesk.value:
        return
    if role == UserRole.doctor.value:
        assignment = await mongo_db.assignments.find_one(
            {"patient_id": patient_id, "doctor_id": current_user.username}
        )
        if assignment:
            return
        appointment = await mongo_db.appointments.find_one(
            {
                "patient_id": patient_id,
                "doctor_id": current_user.username,
                "status": {"$ne": "Cancelled"},
            }
        )
        if appointment:
            return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this patient's records",
    )
