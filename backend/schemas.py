from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

class CategoryEnum(str, Enum):
    laboratory = "лаборатория"
    doctor_appointment = "приём врача"
    diagnostics = "диагностика"
    procedure = "процедура"

class CurrencyEnum(str, Enum):
    KZT = "KZT"
    USD = "USD"

# Clinic Schemas
class ClinicBase(BaseModel):
    name: str
    city: str
    address: str
    phone: Optional[str] = None
    working_hours: Optional[str] = None
    source_url: Optional[str] = None
    photo_url: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0
    has_online_booking: bool = False
    has_active_promotion: bool = False

class BookingCreate(BaseModel):
    clinic_id: str
    doctor_id: Optional[str] = None
    name: str
    phone: str
    preferred_time: Optional[str] = None
    appointment_at: Optional[datetime] = None
    promo_code: Optional[str] = Field(default=None, max_length=32)

class BookingResponse(BookingCreate):
    id: str
    status: str
    discount_amount: float = 0
    total_amount: Optional[float] = None
    priority_booking: bool = False
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PriceAlertCreate(BaseModel):
    service_id: str
    clinic_id: Optional[str] = None
    target_price_kzt: Optional[float] = None

class ClinicCreate(ClinicBase):
    pass

class Clinic(ClinicBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

# Doctor Schemas
class DoctorBase(BaseModel):
    clinic_id: str
    first_name: str
    last_name: str
    specialty: str
    experience_years: Optional[int] = None
    rating: float = 0.0
    reviews_count: int = 0
    consultation_price: Optional[float] = None
    photo_url: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    source_url: Optional[str] = None
    clinic_has_online_booking: bool = False

    @field_validator("languages", mode="before")
    @classmethod
    def split_languages(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

class DoctorCreate(DoctorBase):
    pass

class Doctor(DoctorBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

# Service Schemas
class ServiceBase(BaseModel):
    name_raw: str
    name_norm: Optional[str] = None
    category: CategoryEnum

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

# Price History Schemas
class PriceHistory(BaseModel):
    id: str
    price_id: str
    old_price_kzt: Optional[float] = None
    new_price_kzt: float
    changed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Price Schemas
class PriceBase(BaseModel):
    clinic_id: str
    service_id: str
    price_kzt: float
    currency: CurrencyEnum = CurrencyEnum.KZT
    duration_days: Optional[int] = None
    parsed_at: Optional[datetime] = None
    is_active: bool = True

class PriceCreate(PriceBase):
    pass

class Price(PriceBase):
    id: str
    parsed_at: datetime
    clinic: Clinic
    service: Service
    history: List[PriceHistory] = []

    model_config = ConfigDict(from_attributes=True)

# Unified Search Result Schema
class UnifiedSearchResult(BaseModel):
    service: Service
    avg_price: float
    min_price: float
    clinics_count: int
    best_offer_clinic: Optional[Clinic] = None
    best_offer_price: Optional[float] = None
    last_updated_at: Optional[datetime] = None

# User & Auth Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    plan: str = "free"
    ai_requests_used: int = 0
    ai_limit: Optional[int] = 20
    priority_booking: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Subscription Schemas
class SubscriptionCreate(BaseModel):
    service_id: str
    clinic_id: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    service_id: str
    clinic_id: Optional[str] = None
    created_at: datetime
    service: Service
    clinic: Optional[Clinic] = None
    
    model_config = ConfigDict(from_attributes=True)

class ClinicDetailResponse(BaseModel):
    clinic: Clinic
    services: List[Price]
    doctors: List[Doctor] = []
    
    model_config = ConfigDict(from_attributes=True)


class DoctorSlot(BaseModel):
    starts_at: datetime
    available: bool = True


class DoctorSlotCreate(BaseModel):
    starts_at: datetime


class PromoCodeValidate(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    amount: float = Field(ge=0)
    clinic_id: Optional[str] = None


class PromoCodeResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    discount_amount: float
    total_amount: float
    expires_at: Optional[datetime] = None


class PublicPromotion(BaseModel):
    code: str
    title: str
    description: str
    clinic_name: str
    city: str
    expires_at: Optional[datetime] = None
    source_url: str


class PromoCodeCreate(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    discount_type: str = Field(pattern="^(percent|fixed)$")
    discount_value: float = Field(gt=0)
    usage_limit: Optional[int] = Field(default=None, gt=0)
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    clinic_id: str
    title: str = Field(min_length=4, max_length=255)
    description: str = Field(min_length=4, max_length=2000)
    source_url: str = Field(pattern="^https://")


class PlanResponse(BaseModel):
    plan: str
    ai_requests_used: int
    ai_limit: Optional[int]
    priority_booking: bool


class PlanUpdate(BaseModel):
    plan: str = Field(pattern="^(free|pro|premium)$")


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)
    doctor_id: Optional[str] = None
    clinic_id: Optional[str] = None


class ReviewResponse(ReviewCreate):
    id: str
    user_id: Optional[str] = None
    created_at: datetime
    average_rating: Optional[float] = None
    reviews_count: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
