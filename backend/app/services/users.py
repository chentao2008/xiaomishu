from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = get_user_by_username(db, username)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        username=data.username,
        full_name=data.full_name,
        warehouse=data.warehouse,
        hashed_password=get_password_hash(data.password),
        plain_password=data.password,
        role="admin" if data.is_admin else "staff",
        is_active=data.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    values = data.model_dump(exclude_unset=True)
    if password := values.pop("password", None):
        user.hashed_password = get_password_hash(password)
        user.plain_password = password
    if "is_admin" in values:
        user.role = "admin" if values.pop("is_admin") else "staff"
    for key, value in values.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
