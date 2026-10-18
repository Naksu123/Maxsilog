"""
AutoValuate Administrator Endpoints
Secured administrative endpoints for training status, model history, manual retraining, and rollback.
"""

import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query, BackgroundTasks, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/admin", tags=["Administration & Retraining"])

ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "admin123")


def verify_admin_auth(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None)
):
    """
    Validate administrator credentials via 'X-Admin-Key' or 'Authorization: Bearer <token>'.
    """
    provided_key = None
    if x_admin_key:
        provided_key = x_admin_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        provided_key = authorization[7:].strip()

    if not provided_key or provided_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing administrator API key."
        )
    return True


class TriggerTrainingRequest(BaseModel):
    force: bool = Field(default=False, description="Force retraining even if dataset checksum is unchanged", examples=[False])


class AdminLoginRequest(BaseModel):
    username: Optional[str] = Field(default="admin", description="Admin username")
    password: Optional[str] = Field(default=None, description="Admin password or admin key")
    admin_key: Optional[str] = Field(default=None, description="Direct Admin API Key")


@router.post("/login")
def admin_login(req: AdminLoginRequest):
    """
    Authenticate administrator credentials and return access token.
    Accepts username/password or direct admin_key.
    Default password / key: 'autovaluate-admin-2026'
    """
    key_candidate = (req.admin_key or req.password or "").strip()
    if not key_candidate or key_candidate != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials or secret key."
        )

    return {
        "success": True,
        "message": "Administrator authentication successful.",
        "token": ADMIN_API_KEY,
        "user": {
            "username": req.username or "admin",
            "role": "Super Administrator"
        }
    }


@router.get("/verify", dependencies=[Depends(verify_admin_auth)])
def verify_session():
    """Verify that an active admin token or session is valid."""
    return {
        "valid": True,
        "role": "Super Administrator"
    }


@router.get("/training/status", dependencies=[Depends(verify_admin_auth)])
def get_training_status():
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")
    return RETRAIN_MANAGER.get_status()


@router.get("/training/history", dependencies=[Depends(verify_admin_auth)])
def get_training_history():
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")
    return RETRAIN_MANAGER.get_history()


@router.get("/models", dependencies=[Depends(verify_admin_auth)])
def get_archived_models():
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")
    return RETRAIN_MANAGER.get_versions()


@router.post("/training/run", dependencies=[Depends(verify_admin_auth)])
def trigger_training(
    background_tasks: BackgroundTasks,
    req: Optional[TriggerTrainingRequest] = None
):
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")

    if RETRAIN_MANAGER.is_training:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A machine learning training job is already actively running on the server."
        )

    force_retrain = req.force if req else False

    # Execute in background task so HTTP response returns immediately and prediction endpoints stay responsive
    def _run_bg():
        RETRAIN_MANAGER.run_retraining(trigger="manual_admin", force=force_retrain)

    background_tasks.add_task(_run_bg)

    return {
        "success": True,
        "status": "initiated",
        "message": f"Training job successfully queued in background (Force Retrain: {force_retrain}). Poll /api/admin/training/status for live progress."
    }


@router.post("/models/{version}/rollback", dependencies=[Depends(verify_admin_auth)])
def rollback_model_version(version: str):
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")

    result = RETRAIN_MANAGER.rollback_to_version(version)
    if not result.get("success"):
        if result.get("status") == "conflict":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=result["message"])
        elif result.get("status") == "not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["message"])
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["message"])

    return result
