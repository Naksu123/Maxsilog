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
VALID_ADMIN_KEYS = {ADMIN_API_KEY, "admin123", "research_admin_2026"}


def verify_admin_auth(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    authorization: Optional[str] = Header(None)
):
    """
    Validate administrator credentials via 'X-Admin-Key' or 'Authorization: Bearer <token>'.
    Accepts configured ADMIN_API_KEY or research credentials.
    """
    provided_key = None
    if x_admin_key:
        provided_key = x_admin_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        provided_key = authorization[7:].strip()

    if not provided_key or provided_key not in VALID_ADMIN_KEYS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing administrator API key."
        )
    return True


class TriggerTrainingRequest(BaseModel):
    force: Optional[bool] = Field(default=False, description="Force retraining even if dataset checksum is unchanged", examples=[False])
    force_retraining: Optional[bool] = Field(default=None, description="Alias for force parameter", examples=[False])

    def is_forced(self) -> bool:
        if self.force_retraining is not None:
            return bool(self.force_retraining)
        return bool(self.force)


class AdminLoginRequest(BaseModel):
    username: Optional[str] = Field(default="admin", description="Admin username")
    password: Optional[str] = Field(default=None, description="Admin password or admin key")
    admin_key: Optional[str] = Field(default=None, description="Direct Admin API Key")


@router.post("/login")
def admin_login(req: AdminLoginRequest):
    """
    Authenticate administrator credentials and return access token.
    Accepts username/password or direct admin_key.
    Default password / key: 'admin123'
    """
    key_candidate = (req.admin_key or req.password or "").strip()
    if not key_candidate or key_candidate not in VALID_ADMIN_KEYS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials or secret key."
        )

    return {
        "success": True,
        "message": "Administrator authentication successful.",
        "token": key_candidate,
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
def get_training_history(
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(5, ge=1, le=100, description="Records per page, default 5"),
    status: Optional[str] = Query(None, description="Filter by status (completed, skipped, failed)"),
    trigger: Optional[str] = Query(None, description="Filter by trigger source")
):
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")
    
    history = RETRAIN_MANAGER.get_history()

    # Filter by status and/or trigger if provided
    filtered = history
    if status and status.lower() != "all":
        filtered = [h for h in filtered if str(h.get("status", "")).lower() == status.lower()]
    if trigger and trigger.lower() != "all":
        filtered = [h for h in filtered if trigger.lower() in str(h.get("trigger", "")).lower()]

    # If page is not requested, return flat list for backwards compatibility
    if page is None:
        return filtered

    total = len(filtered)
    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
    current_page = min(page, total_pages) if page else 1
    start_idx = (current_page - 1) * page_size
    end_idx = start_idx + page_size
    items = filtered[start_idx:end_idx]

    return {
        "items": items,
        "total": total,
        "page": current_page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": current_page < total_pages,
        "has_prev": current_page > 1
    }


@router.get("/models", dependencies=[Depends(verify_admin_auth)])
def get_archived_models(
    model: Optional[str] = Query(None, description="Filter by model name/type"),
    all_artifacts: bool = Query(False, description="Return flat list of all candidate model artifacts"),
    view: Optional[str] = Query(None, description="View mode: 'artifacts' or 'versions'")
):
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")
    return_artifacts = all_artifacts or (view == "artifacts")
    return RETRAIN_MANAGER.get_versions(model_filter=model, all_artifacts=return_artifacts)


@router.get("/rollback/history", dependencies=[Depends(verify_admin_auth)])
def get_rollback_history(
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(5, ge=1, le=100, description="Records per page, default 5"),
    event_type: Optional[str] = Query(None, description="Filter by event type (PROMOTION, ROLLBACK)")
):
    """Retrieve persistent audit ledger of model deployments, promotions, and rollbacks."""
    from .main import RETRAIN_MANAGER
    if not RETRAIN_MANAGER:
        raise HTTPException(status_code=503, detail="Retrain manager not initialized.")
    
    history = RETRAIN_MANAGER.get_rollback_history()

    filtered = history
    if event_type and event_type.lower() != "all":
        filtered = [h for h in filtered if str(h.get("event_type", "")).upper() == event_type.upper()]

    if page is None:
        return filtered

    total = len(filtered)
    total_pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1
    current_page = min(page, total_pages) if page else 1
    start_idx = (current_page - 1) * page_size
    end_idx = start_idx + page_size
    items = filtered[start_idx:end_idx]

    return {
        "items": items,
        "total": total,
        "page": current_page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": current_page < total_pages,
        "has_prev": current_page > 1
    }


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

    force_retrain = req.is_forced() if req else False

    # Execute in background task so HTTP response returns immediately and prediction endpoints stay responsive
    def _run_bg():
        RETRAIN_MANAGER.run_retraining(trigger="manual_admin", force=force_retrain)

    background_tasks.add_task(_run_bg)

    return {
        "success": True,
        "status": "initiated",
        "force_retraining": force_retrain,
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
