"""Smoke tests for real catalogue data and non-fabricated booking behaviour."""

import asyncio
import atexit
import os
import tempfile
import unittest
from pathlib import Path

from httpx import ASGITransport, AsyncClient


_temporary_database = tempfile.TemporaryDirectory(prefix="medservice-tests-")
_db_path = Path(_temporary_database.name) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path.as_posix()}"
os.environ.pop("VERCEL", None)

from main import app  # noqa: E402 - environment must be configured first
from database import engine  # noqa: E402

atexit.register(engine.dispose)


class VerifiedFeaturesTest(unittest.TestCase):
    def request(self, method, path, **kwargs):
        async def run():
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                return await client.request(method, path, **kwargs)
        return asyncio.run(run())

    def test_real_catalogue_and_filters(self):
        clinics = self.request("GET", "/api/clinics?city=Алматы")
        self.assertEqual(clinics.status_code, 200)
        self.assertEqual(len(clinics.json()), 1)
        clinic = clinics.json()[0]
        self.assertEqual(clinic["source_url"], "https://emirmed.kz/ru/companies/20/")
        self.assertFalse(clinic["has_online_booking"])
        self.assertEqual(clinic["rating"], 0)

        doctors = self.request("GET", "/api/doctors?specialty=Кардиолог&city=Алматы")
        self.assertEqual(doctors.status_code, 200)
        self.assertEqual(len(doctors.json()), 2)
        self.assertTrue(all(doctor["source_url"].startswith("https://emirmed.kz/") for doctor in doctors.json()))
        self.assertEqual(len(self.request("GET", "/api/doctors?district=Алмалинский").json()), 3)
        self.assertEqual(self.request("GET", "/api/doctors?district=Медеуский").json(), [])

        search = self.request("GET", "/api/search?q=Кардиолог&city=Алматы")
        self.assertEqual(search.status_code, 200)
        self.assertEqual(len(search.json()), 2)
        self.assertTrue(all(result["clinics_count"] == 1 for result in search.json()))
        filtered = self.request("GET", "/api/search?q=Кардиолог&city=Алматы&max_price=10000")
        self.assertEqual(filtered.json(), [])

    def test_unverified_slots_and_unauthorised_upgrade(self):
        doctor = self.request("GET", "/api/doctors?specialty=Кардиолог").json()[0]
        slots = self.request("GET", f"/api/doctors/{doctor['id']}/slots?date=2026-10-01")
        self.assertEqual(slots.status_code, 200)
        self.assertEqual(slots.json(), [])

        booking = self.request("POST", "/api/bookings", json={
            "clinic_id": doctor["clinic_id"], "doctor_id": doctor["id"],
            "name": "Test Patient", "phone": "+77000000000",
            "appointment_at": "2026-10-01T09:00:00+05:00",
        })
        self.assertEqual(booking.status_code, 409)
        self.assertEqual(self.request("GET", "/api/promocodes/public").json(), [])

    def test_auth_reviews_and_paid_plan_guard(self):
        registered = self.request("POST", "/api/auth/register", json={
            "email": "patient@example.test", "password": "StrongPass123!", "full_name": "Test Patient",
        })
        self.assertEqual(registered.status_code, 200, registered.text)
        login = self.request("POST", "/api/auth/login", data={
            "username": "patient@example.test", "password": "StrongPass123!",
        })
        self.assertEqual(login.status_code, 200, login.text)
        cookies = {"access_token": login.cookies["access_token"]}
        self.assertEqual(self.request("POST", "/api/subscriptions/plan", json={"plan": "premium"}, cookies=cookies).status_code, 403)

        doctor = self.request("GET", "/api/doctors?specialty=Кардиолог").json()[0]
        review = self.request("POST", "/api/reviews", json={"doctor_id": doctor["id"], "rating": 5}, cookies=cookies)
        self.assertEqual(review.status_code, 201, review.text)
        self.assertEqual(review.json()["average_rating"], 5)
        duplicate = self.request("POST", "/api/reviews", json={"doctor_id": doctor["id"], "rating": 1}, cookies=cookies)
        self.assertEqual(duplicate.status_code, 409)


if __name__ == "__main__":
    unittest.main()
