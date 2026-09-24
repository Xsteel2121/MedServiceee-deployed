"""Small, dependency-free schema migration layer for the existing MVP database.

The project historically used ``Base.metadata.create_all`` only.  That creates
new tables but cannot add columns to an existing SQLite database, so this module
keeps upgrades additive and safe for both SQLite and PostgreSQL.
"""

from sqlalchemy import inspect, text

from database import engine
from models import Base


ADDITIVE_COLUMNS = {
    "clinics": {
        "photo_url": "VARCHAR",
        "district": "VARCHAR",
        "has_active_promotion": "BOOLEAN DEFAULT FALSE",
    },
    "doctors": {
        "languages": "TEXT",
        "source_url": "VARCHAR",
    },
    "users": {
        "full_name": "VARCHAR",
        "plan": "VARCHAR DEFAULT 'free'",
        "ai_requests_used": "INTEGER DEFAULT 0",
        "ai_usage_period_started_at": "DATETIME",
    },
    "bookings": {
        "patient_id": "VARCHAR",
        "appointment_at": "DATETIME",
        "promo_code": "VARCHAR",
        "discount_amount": "NUMERIC(10, 2) DEFAULT 0",
        "total_amount": "NUMERIC(10, 2)",
        "priority_booking": "BOOLEAN DEFAULT FALSE",
    },
    "prices": {
        "doctor_id": "VARCHAR",
        "source_url": "VARCHAR",
    },
    "promo_codes": {
        "title": "VARCHAR",
        "description": "TEXT",
        "source_url": "VARCHAR",
    },
}


def ensure_schema() -> None:
    """Create missing tables and add missing columns without dropping data."""

    dialect = engine.dialect.name

    with engine.begin() as connection:
        if dialect == "postgresql":
            # Multiple Vercel cold starts can initialize the database together.
            connection.execute(text("SELECT pg_advisory_xact_lock(43852765)"))
        Base.metadata.create_all(bind=connection)
        inspector = inspect(connection)
        for table_name, columns in ADDITIVE_COLUMNS.items():
            if table_name not in inspector.get_table_names():
                continue
            existing = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name in existing:
                    continue
                if dialect == "postgresql":
                    column_type = column_type.replace("DATETIME", "TIMESTAMP")
                # PostgreSQL accepts IF NOT EXISTS; SQLite does not. Inspection
                # above makes the operation idempotent for both engines.
                table_sql = f'"{table_name}"'
                column_sql = f'"{column_name}"'
                connection.execute(text(f"ALTER TABLE {table_sql} ADD COLUMN {column_sql} {column_type}"))

if __name__ == "__main__":
    ensure_schema()
    print("Database schema is up to date")
