import uuid
import datetime
import json
from sqlalchemy import Boolean, Column, String, Float, DateTime, Enum as SQLAlchemyEnum, Numeric, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

class CategoryEnum(str, enum.Enum):
    laboratory = "лаборатория"
    doctor_appointment = "приём врача"
    diagnostics = "диагностика"
    procedure = "процедура"

class CurrencyEnum(str, enum.Enum):
    KZT = "KZT"
    USD = "USD"

class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, index=True)
    city = Column(String, index=True)
    address = Column(String)
    phone = Column(String, nullable=True)
    working_hours = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    district = Column(String, nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    has_online_booking = Column(Boolean, default=True)
    has_active_promotion = Column(Boolean, default=False, index=True)

    prices = relationship("Price", back_populates="clinic")
    subscriptions = relationship("UserSubscription", back_populates="clinic")
    doctors = relationship("Doctor", back_populates="clinic")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), index=True)
    first_name = Column(String)
    last_name = Column(String)
    specialty = Column(String)
    experience_years = Column(Integer)
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    consultation_price = Column(Numeric(10, 2))
    photo_url = Column(String, nullable=True)
    languages = Column(Text, default="ru,kk")
    description = Column(String, nullable=True)

    clinic = relationship("Clinic", back_populates="doctors")

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name_raw = Column(String, index=True)
    name_norm = Column(String, index=True, nullable=True)
    category = Column(SQLAlchemyEnum(CategoryEnum), index=True)
    is_matched = Column(Boolean, default=True)

    prices = relationship("Price", back_populates="service")
    subscriptions = relationship("UserSubscription", back_populates="service")

class Price(Base):
    __tablename__ = "prices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"))
    service_id = Column(String, ForeignKey("services.id"))
    
    price_kzt = Column(Numeric(10, 2))
    currency = Column(SQLAlchemyEnum(CurrencyEnum), default=CurrencyEnum.KZT)
    duration_days = Column(Integer, nullable=True)
    parsed_at = Column(DateTime, default=utc_now)
    is_active = Column(Boolean, default=True)

    clinic = relationship("Clinic", back_populates="prices")
    service = relationship("Service", back_populates="prices")
    history = relationship("PriceHistory", back_populates="price_parent")

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    price_id = Column(String, ForeignKey("prices.id"))
    old_price_kzt = Column(Numeric(10, 2), nullable=True)
    new_price_kzt = Column(Numeric(10, 2))
    changed_at = Column(DateTime, default=utc_now)
    
    price_parent = relationship("Price", back_populates="history")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    plan = Column(String, default="free", nullable=False, index=True)
    ai_requests_used = Column(Integer, default=0, nullable=False)
    ai_usage_period_started_at = Column(DateTime, default=utc_now, nullable=True)
    
    subscriptions = relationship("UserSubscription", back_populates="user")
    bookings = relationship("Booking", back_populates="patient")

    @property
    def priority_booking(self):
        return self.plan == "premium"

    @property
    def ai_limit(self):
        return None if self.plan in {"pro", "premium"} else 20

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"))
    service_id = Column(String, ForeignKey("services.id"))
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True) # Optional, can subscribe to any clinic for this service
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="subscriptions")
    service = relationship("Service", back_populates="subscriptions")
    clinic = relationship("Clinic", back_populates="subscriptions")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=True)
    patient_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    preferred_time = Column(String, nullable=True)
    appointment_at = Column(DateTime, nullable=True, index=True)
    promo_code = Column(String, nullable=True)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), nullable=True)
    priority_booking = Column(Boolean, default=False, nullable=False)
    status = Column(String, default="new", nullable=False)
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("User", back_populates="bookings")
    doctor = relationship("Doctor")
    clinic = relationship("Clinic")

    @property
    def doctor_name(self):
        return f"{self.doctor.first_name} {self.doctor.last_name}" if self.doctor else None

    @property
    def clinic_name(self):
        return self.clinic.name if self.clinic else None


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_type = Column(String, nullable=False, default="percent")
    discount_value = Column(Numeric(10, 2), nullable=False)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0, nullable=False)
    starts_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    clinic = relationship("Clinic")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=True, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User")
    doctor = relationship("Doctor")
    clinic = relationship("Clinic")


class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_key = Column(String, unique=True, index=True, nullable=False)
    requests_used = Column(Integer, default=0, nullable=False)
    period_started_at = Column(DateTime, default=utc_now, nullable=False)

class RawData(Base):
    __tablename__ = "raw_data"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    source_name = Column(String, index=True)
    source_url = Column(String)
    data_payload = Column(Text) # JSON string
    parsed_at = Column(DateTime, default=utc_now)

class ParserLogs(Base):
    __tablename__ = "parser_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    source_name = Column(String, index=True)
    status = Column(String) # "SUCCESS", "FAILED"
    message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.datetime.utcnow)
