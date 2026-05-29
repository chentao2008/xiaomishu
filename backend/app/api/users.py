from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update

from app.api.deps import DbSession, require_admin
from app.models.fabric_tail import FabricTail
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.users import create_user, get_user_by_username, update_user


router = APIRouter(prefix="/users", tags=["后台账号管理"])


@router.get("", response_model=list[UserOut])
def list_users(db: DbSession, _: Annotated[User, Depends(require_admin)]) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id.desc())))


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def add_user(payload: UserCreate, db: DbSession, _: Annotated[User, Depends(require_admin)]) -> User:
    if get_user_by_username(db, payload.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="账号已存在")
    return create_user(db, payload)


@router.patch("/{user_id}", response_model=UserOut)
def edit_user(
    user_id: int,
    payload: UserUpdate,
    db: DbSession,
    _: Annotated[User, Depends(require_admin)],
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="账号不存在")
    if payload.username and payload.username != user.username and get_user_by_username(db, payload.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="账号已存在")
    return update_user(db, user, payload)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(require_admin)],
) -> None:
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能删除当前登录账号")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="账号不存在")
    db.execute(update(FabricTail).where(FabricTail.created_by == user_id).values(created_by=None))
    db.delete(user)
    db.commit()
