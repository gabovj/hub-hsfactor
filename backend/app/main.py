from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import admin, auth, contenidos, crm

app = FastAPI(
    title="HS Factor Hub API",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(crm.router)
app.include_router(admin.router)
app.include_router(contenidos.router)


@app.get("/health")
def health():
    return {"status": "ok"}
