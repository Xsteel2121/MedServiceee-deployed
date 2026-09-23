"""Idempotent seed for product features added after the original data import."""

from datetime import timedelta

from database import SessionLocal
from migrations import ensure_schema
from models import Clinic, Doctor, PromoCode, utc_now


def seed_features() -> None:
    ensure_schema()
    db = SessionLocal()
    try:
        clinics = db.query(Clinic).order_by(Clinic.city, Clinic.name).all()
        for index, clinic in enumerate(clinics):
            if clinic.photo_url is None:
                clinic.photo_url = f"https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=640&q=80&sig={index}"
            if clinic.district is None:
                clinic.district = "Центральный"
            # Keep a visible, deterministic subset of clinics eligible for the
            # existing promotions/filter UI.
            clinic.has_active_promotion = index % 4 == 0

        for doctor in db.query(Doctor).all():
            if not doctor.languages:
                doctor.languages = "ru,kk"

        defaults = [
            ("WELCOME10", "percent", 10, None, None),
            ("MEDKZ500", "fixed", 500, 100, None),
        ]
        for code, discount_type, value, usage_limit, expires_at in defaults:
            if not db.query(PromoCode).filter(PromoCode.code == code).first():
                db.add(PromoCode(
                    code=code,
                    discount_type=discount_type,
                    discount_value=value,
                    usage_limit=usage_limit,
                    expires_at=expires_at or (utc_now() + timedelta(days=365)),
                    is_active=True,
                ))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_features()
    print("Feature seed completed")
