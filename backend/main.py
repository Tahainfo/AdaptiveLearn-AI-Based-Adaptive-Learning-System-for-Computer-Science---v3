"""
Main FastAPI Application
Adaptive Learning System for Moroccan High School Students
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

# Import routes
from backend.routes.auth import router as auth_router
from backend.routes.diagnostic import router as diagnostic_router
from backend.routes.exercise import router as exercise_router
from backend.routes.analytics import router as analytics_router
from backend.routes.curriculum import router as curriculum_router
from backend.routes.admin import router as admin_router
from backend.routes.ai import router as ai_router

# Initialize database
from backend.database.db import init_db, insert_default_concepts

app = FastAPI(
    title="Adaptive Learning System",
    description="AI-powered learning platform for Moroccan high school students",
    version="1.0.0"
)

# CORS middleware
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8000,http://127.0.0.1:8000,https://adaptivelearn-ppe.onrender.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    init_db()
    insert_default_concepts()
    print("✅ Database initialized")

# ── API routes (must be declared BEFORE static file catch-all) ──
app.include_router(auth_router)
app.include_router(curriculum_router)
app.include_router(diagnostic_router)
app.include_router(exercise_router)
app.include_router(analytics_router)
app.include_router(admin_router)
app.include_router(ai_router)

# ── Health / version endpoints ───────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/version")
async def get_version():
    return {"version": "1.0.0"}

# ── Frontend static files ────────────────────────────────────────
# Mount static assets (JS, CSS, images) under /assets
# The catch-all route below serves index.html for everything else
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
frontend_dir = os.path.abspath(frontend_dir)

if os.path.exists(frontend_dir):
    # Serve static assets without intercepting API routes
    app.mount("/js",  StaticFiles(directory=os.path.join(frontend_dir, "js")),  name="js")
    app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
    # Add more sub-folders if needed (images, etc.)
    for sub in ["images", "img", "assets", "static"]:
        sub_path = os.path.join(frontend_dir, sub)
        if os.path.exists(sub_path):
            app.mount(f"/{sub}", StaticFiles(directory=sub_path), name=sub)

@app.get("/")
async def serve_index():
    login = os.path.join(frontend_dir, "login.html")
    return FileResponse(login)

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """Serve frontend files; fall back to index.html for SPA routing."""
    file_path = os.path.join(frontend_dir, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(frontend_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))