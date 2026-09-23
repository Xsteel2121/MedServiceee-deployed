import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///./test-data-flow.db")

import models
import schemas
from database import SessionLocal, engine
from parser.base import BaseParser


class TestParser(BaseParser):
    def parse(self):
        return None


class PriceDataFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        models.Base.metadata.drop_all(engine)
        models.Base.metadata.create_all(engine)

    @classmethod
    def tearDownClass(cls):
        models.Base.metadata.drop_all(engine)
        engine.dispose()

    def setUp(self):
        self.parser = TestParser()

    def tearDown(self):
        self.parser.db.close()

    def test_price_keeps_clinic_and_service_identity(self):
        clinic = self.parser.get_or_create_clinic({
            "name": "Test Clinic",
            "city": "Almaty",
            "address": "Test street 1",
            "latitude": 43.238949,
            "longitude": 76.889709,
        })
        service = self.parser.get_or_create_service({
            "name_raw": "MRI",
            "category": models.CategoryEnum.diagnostics,
        })

        self.parser.add_or_update_price({
            "clinic_id": clinic.id,
            "service_id": service.id,
            "price_kzt": 1000,
            "currency": models.CurrencyEnum.KZT,
        })
        self.parser.add_or_update_price({
            "clinic_id": clinic.id,
            "service_id": service.id,
            "price_kzt": 900,
            "currency": models.CurrencyEnum.KZT,
        })

        db = SessionLocal()
        try:
            price = db.query(models.Price).filter_by(
                clinic_id=clinic.id,
                service_id=service.id,
            ).one()
            self.assertTrue(price.is_active)
            self.assertEqual(float(price.price_kzt), 900)
            self.assertEqual(price.clinic.id, clinic.id)
            self.assertEqual(price.service.id, service.id)
            schemas.Price.model_validate(price)
        finally:
            db.close()

    def test_same_name_different_address_creates_separate_clinics(self):
        first = self.parser.get_or_create_clinic({
            "name": "Same Clinic",
            "city": "Almaty",
            "address": "First address",
        })
        second = self.parser.get_or_create_clinic({
            "name": "Same Clinic",
            "city": "Almaty",
            "address": "Second address",
        })
        self.assertNotEqual(first.id, second.id)


if __name__ == "__main__":
    unittest.main()
