"""
Announcement endpoints for the High School Management System API
"""

from datetime import date
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import announcements_collection, teachers_collection

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)


class AnnouncementCreate(BaseModel):
    """Payload for creating an announcement."""

    message: str = Field(min_length=3, max_length=500)
    expires_on: str
    starts_on: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    """Payload for updating an announcement."""

    message: str = Field(min_length=3, max_length=500)
    expires_on: str
    starts_on: Optional[str] = None


def parse_date(value: Optional[str], field_name: str, required: bool = False) -> Optional[date]:
    """Parse YYYY-MM-DD date values and raise a validation error when invalid."""
    if not value:
        if required:
            raise HTTPException(status_code=400, detail=f"{field_name} is required")
        return None

    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must use YYYY-MM-DD format"
        ) from error


def require_teacher(teacher_username: Optional[str]) -> Dict[str, Any]:
    """Ensure the request comes from a signed-in teacher/admin account."""
    if not teacher_username:
        raise HTTPException(status_code=401, detail="Authentication required for this action")

    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid teacher credentials")

    return teacher


def serialize_announcement(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Mongo document into API response payload."""
    expires_on = doc.get("expires_on") or doc.get("date")
    return {
        "id": str(doc["_id"]),
        "message": doc["message"],
        "starts_on": doc.get("starts_on"),
        "expires_on": expires_on
    }


@router.get("")
def list_active_announcements() -> List[Dict[str, Any]]:
    """Get currently active announcements for the public site banner."""
    today = date.today().isoformat()

    query = {
        "expires_on": {"$gte": today},
        "$or": [
            {"starts_on": None},
            {"starts_on": {"$exists": False}},
            {"starts_on": ""},
            {"starts_on": {"$lte": today}}
        ]
    }

    announcements = announcements_collection.find(query).sort("expires_on", 1)
    return [serialize_announcement(announcement) for announcement in announcements]


@router.get("/manage")
def list_all_announcements(
    teacher_username: Optional[str] = Query(default=None)
) -> List[Dict[str, Any]]:
    """Get all announcements for management UI (requires auth)."""
    require_teacher(teacher_username)

    announcements = announcements_collection.find({}).sort("expires_on", 1)
    return [serialize_announcement(announcement) for announcement in announcements]


@router.post("/manage")
def create_announcement(
    payload: AnnouncementCreate,
    teacher_username: Optional[str] = Query(default=None)
) -> Dict[str, Any]:
    """Create a new announcement (requires auth)."""
    teacher = require_teacher(teacher_username)

    starts_on = parse_date(payload.starts_on, "starts_on", required=False)
    expires_on = parse_date(payload.expires_on, "expires_on", required=True)

    if starts_on and expires_on and starts_on > expires_on:
        raise HTTPException(status_code=400, detail="starts_on cannot be after expires_on")

    document = {
        "message": payload.message.strip(),
        "starts_on": starts_on.isoformat() if starts_on else None,
        "expires_on": expires_on.isoformat(),
        "created_by": teacher["username"]
    }

    result = announcements_collection.insert_one(document)
    inserted = announcements_collection.find_one({"_id": result.inserted_id})
    return serialize_announcement(inserted)


@router.put("/manage/{announcement_id}")
def update_announcement(
    announcement_id: str,
    payload: AnnouncementUpdate,
    teacher_username: Optional[str] = Query(default=None)
) -> Dict[str, Any]:
    """Update an existing announcement (requires auth)."""
    teacher = require_teacher(teacher_username)

    starts_on = parse_date(payload.starts_on, "starts_on", required=False)
    expires_on = parse_date(payload.expires_on, "expires_on", required=True)

    if starts_on and expires_on and starts_on > expires_on:
        raise HTTPException(status_code=400, detail="starts_on cannot be after expires_on")

    try:
        object_id = ObjectId(announcement_id)
    except Exception as error:
        raise HTTPException(status_code=400, detail="Invalid announcement id") from error

    result = announcements_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "message": payload.message.strip(),
                "starts_on": starts_on.isoformat() if starts_on else None,
                "expires_on": expires_on.isoformat(),
                "updated_by": teacher["username"]
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    updated = announcements_collection.find_one({"_id": object_id})
    return serialize_announcement(updated)


@router.delete("/manage/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    teacher_username: Optional[str] = Query(default=None)
) -> Dict[str, str]:
    """Delete an announcement (requires auth)."""
    require_teacher(teacher_username)

    try:
        object_id = ObjectId(announcement_id)
    except Exception as error:
        raise HTTPException(status_code=400, detail="Invalid announcement id") from error

    result = announcements_collection.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement deleted"}
