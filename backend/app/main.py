import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models import Reading
from app.routers import readings, refresh, reports, summary

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Atrium Comfort Monitoring API")

origins = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins == "*" else origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(readings.router)
app.include_router(summary.router)
app.include_router(reports.router)
app.include_router(refresh.router)


@app.on_event("startup")
def seed_on_startup():
    db = SessionLocal()
    try:
        has_data = db.query(Reading.id).first() is not None
        if not has_data:
            from app.seed import seed_database

            seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "service": "atrium-comfort-api"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
