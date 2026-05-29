from app.core.database import Base, SessionLocal, engine
from app.models import fabric_tail, user  # noqa: F401
from app.schemas.user import UserCreate
from app.schemas.user import UserUpdate
from app.services.users import create_user, get_user_by_username, update_user


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        username = "admin"
        existing = get_user_by_username(db, username)
        if existing:
            update_user(
                db,
                existing,
                UserUpdate(
                    password="admin123456",
                    full_name=existing.full_name or "系统管理员",
                    is_admin=True,
                    is_active=True,
                ),
            )
            print("已重置管理员：admin / admin123456，请上线前修改密码")
            return
        create_user(
            db,
            UserCreate(
                username=username,
                password="admin123456",
                full_name="系统管理员",
                is_admin=True,
            ),
        )
        print("已创建管理员：admin / admin123456，请上线前修改密码")
    finally:
        db.close()


if __name__ == "__main__":
    main()
