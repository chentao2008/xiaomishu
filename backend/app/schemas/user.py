from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str = ""
    warehouse: str = ""
    is_admin: bool = False
    is_active: bool = True


class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None
    full_name: str | None = None
    warehouse: str | None = None
    is_admin: bool | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: int
    username: str
    password: str = ""
    full_name: str
    warehouse: str
    is_admin: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "plain_password"):
            data = {
                "id": obj.id,
                "username": obj.username,
                "password": obj.plain_password or "",
                "full_name": obj.full_name,
                "warehouse": obj.warehouse,
                "is_admin": obj.is_admin,
                "is_active": obj.is_active,
                "created_at": obj.created_at,
            }
            return super().model_validate(data, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)
