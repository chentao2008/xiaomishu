from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "小米数管理系统"
    app_env: str = "development"
    secret_key: str = "change-this-secret-key-before-production"
    access_token_expire_minutes: int = 0
    database_url: str = "postgresql+psycopg://user3:ct20082009@localhost:5432/xiaomishu"
    cors_origins: str = "http://localhost:8000,http://127.0.0.1:8000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
