"""Expose the existing FastAPI application as a Vercel Python Function."""

from pathlib import Path
import sys
from urllib.parse import urlencode

from fastapi import Request


BACKEND_ROOT = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from main import app  # noqa: E402


@app.middleware("http")
async def restore_rewritten_api_path(request: Request, call_next):
    """Keep FastAPI's existing /api routes after Vercel's function rewrite."""
    original_path = request.query_params.get("__vercel_api_path")
    if request.scope["path"] == "/api/index" and original_path is not None:
        request.scope["path"] = f"/api/{original_path.lstrip('/')}"
        request.scope["raw_path"] = request.scope["path"].encode("utf-8")
        request.scope["query_string"] = urlencode(
            [(key, value) for key, value in request.query_params.multi_items()
             if key != "__vercel_api_path"]
        ).encode("utf-8")
    return await call_next(request)
