from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_runtime_schema() -> None:
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "warehouse" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN warehouse VARCHAR(80) NOT NULL DEFAULT ''"))
        if "plain_password" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN plain_password VARCHAR(100) NOT NULL DEFAULT ''"))
