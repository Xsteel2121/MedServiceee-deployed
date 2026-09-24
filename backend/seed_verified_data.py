"""Small, idempotent catalogue sourced from the clinic's own public pages.

Only published facts are stored. Our rating starts at zero until this service
receives reviews; the clinic's own ratings are not represented as our reviews.
The clinic has not integrated its calendar with this service, so online booking
is disabled and patients are sent to the official booking page instead.
"""

from uuid import NAMESPACE_URL, uuid5
from datetime import datetime

from sqlalchemy.exc import IntegrityError

import models
from database import SessionLocal


CLINIC_URL = "https://emirmed.kz/ru/companies/20/"
CLINIC_ID = str(uuid5(NAMESPACE_URL, CLINIC_URL))

DOCTORS = (
    {
        "source_url": "https://emirmed.kz/ru/specialists/2314/",
        "first_name": "Избасаров",
        "last_name": "Болатбек Кенджаботурович",
        "specialty": "Кардиолог",
        "experience_years": 15,
        "consultation_price": 14000,
    },
    {
        "source_url": "https://emirmed.kz/ru/specialists/1124/",
        "first_name": "Балиева",
        "last_name": "Куляш Ермековна",
        "specialty": "Терапевт, Аллерголог, Кардиолог",
        "experience_years": 35,
        "consultation_price": 14000,
    },
    {
        "source_url": "https://emirmed.kz/ru/specialists/859/",
        "first_name": "Оспанова",
        "last_name": "Гульжайна Атайбекова",
        "specialty": "ЛОР/ Оториноларинголог",
        "experience_years": 11,
        "consultation_price": 14000,
    },
)


def seed_verified_data() -> None:
    db = SessionLocal()
    try:
        if not db.get(models.Clinic, CLINIC_ID):
            db.add(models.Clinic(
                id=CLINIC_ID,
                name="ЭМИРМЕД — Розыбакиева, 37В",
                city="Алматы",
                district="Алмалинский",
                address="ул. Розыбакиева, 37В",
                phone="+7 (707) 000-01-03",
                working_hours="Уточняйте время приёма по телефону",
                latitude=43.254544,
                longitude=76.887145,
                source_url=CLINIC_URL,
                has_online_booking=False,
                has_active_promotion=False,
            ))
        for entry in DOCTORS:
            doctor_id = str(uuid5(NAMESPACE_URL, entry["source_url"]))
            if not db.get(models.Doctor, doctor_id):
                db.add(models.Doctor(id=doctor_id, clinic_id=CLINIC_ID, **entry))
            service_id = str(uuid5(NAMESPACE_URL, entry["source_url"] + "#service"))
            if not db.get(models.Service, service_id):
                db.add(models.Service(
                    id=service_id,
                    name_raw=f"Приём врача: {entry['first_name']} {entry['last_name']} ({entry['specialty']})",
                    name_norm=f"приём {entry['specialty'].lower()}",
                    category=models.CategoryEnum.doctor_appointment,
                ))
            price_id = str(uuid5(NAMESPACE_URL, entry["source_url"] + "#price"))
            if not db.get(models.Price, price_id):
                db.add(models.Price(
                    id=price_id,
                    clinic_id=CLINIC_ID,
                    doctor_id=doctor_id,
                    service_id=service_id,
                    price_kzt=entry["consultation_price"],
                    parsed_at=datetime(2026, 9, 24),
                    source_url=entry["source_url"],
                ))
        db.commit()
    except IntegrityError:
        # Parallel serverless cold starts may seed the same deterministic IDs.
        db.rollback()
    finally:
        db.close()
