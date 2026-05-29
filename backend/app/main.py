from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import auth, fabric_tails, users
from app.core.config import settings
from app.core.database import Base, engine
from app.core.schema import ensure_runtime_schema
from app.models import fabric_tail, user  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    frontend_dir = Path(__file__).resolve().parents[2] / "frontend"

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def no_cache_for_frontend(request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path == "/" or path.endswith((".html", ".css", ".js")) or path.startswith("/assets/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    app.include_router(auth.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(fabric_tails.router, prefix="/api")

    if frontend_dir.exists():
        app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="assets")

        @app.get("/")
        def index() -> FileResponse:
            return FileResponse(frontend_dir / "login.html")

        @app.get("/{page_name}.html")
        def html_page(page_name: str) -> FileResponse:
            page = frontend_dir / f"{page_name}.html"
            if page.exists():
                return FileResponse(page)
            return FileResponse(frontend_dir / "login.html")

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
