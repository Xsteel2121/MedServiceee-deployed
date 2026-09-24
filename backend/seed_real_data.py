"""Backward-compatible entry point for the verified, non-synthetic seed."""

from migrations import ensure_schema
from seed_verified_data import seed_verified_data


def seed_db() -> None:
    ensure_schema()
    seed_verified_data()


if __name__ == "__main__":
    seed_db()
