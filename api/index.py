"""Expose the existing FastAPI application as a Vercel Python Function."""

from pathlib import Path
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from main import app  # noqa: E402
