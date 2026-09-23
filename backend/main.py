"""MedServicePrice API — Main application entry point."""

from fastapi import Cookie, FastAPI, Depends, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import os
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
from jose import JWTError, jwt
import hmac

import models, schemas, auth
from database import engine, get_db
import meilisearch
from scheduler_tasks import start_scheduler, stop_scheduler
import chat_ai
from migrations import ensure_schema
from pydantic import BaseModel, Field
from logger import api_logger

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: Optional[str] = Field(default=None, pattern="^(ru|kz)$")

MEILI_URL = os.getenv("MEILI_URL", "http://meilisearch:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]
meili_client = meilisearch.Client(MEILI_URL, MEILI_MASTER_KEY)

# Keep the existing data and add only missing schema pieces.
ensure_schema()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = token or access_token
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Return the logged-in user when available, otherwise keep public flows public."""

    if not token and not access_token:
        return None
    try:
        return get_current_user(token=token, access_token=access_token, db=db)
    except HTTPException:
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="MedServicePrice API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def require_admin_key(x_admin_key: Optional[str] = Header(default=None)):
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Admin API is not configured")
    if not x_admin_key or not hmac.compare_digest(x_admin_key, ADMIN_API_KEY):
        raise HTTPException(status_code=403, detail="Admin access required")

@app.get("/")
def read_root():
    return {"message": "MedServicePrice API is running"}

# --- Auth API ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        plan="free",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENVIRONMENT", "development") == "production",
        samesite="lax",
        max_age=int(access_token_expires.total_seconds()),
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie("access_token")

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Search API ---
@app.get("/api/search", response_model=List[schemas.UnifiedSearchResult])
def search_services(
    q: str = Query(..., min_length=2),
    city: Optional[str] = None,
    district: Optional[str] = None,
    specialty: Optional[str] = None,
    language: Optional[str] = None,
    has_promotion: Optional[bool] = None,
    min_rating: Optional[float] = None,
    online_booking: Optional[bool] = None,
    min_price_filter: Optional[float] = Query(None, alias="min_price", ge=0),
    max_price_filter: Optional[float] = Query(None, alias="max_price", ge=0),
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        search_res = meili_client.index('services').search(q, {'limit': 20})
        hits = search_res.get('hits', [])
        if not hits:
            raise RuntimeError("Meilisearch returned no hits")
    except Exception as exc:
        api_logger.warning("Meilisearch unavailable, using database search: %s", exc)
        matching_services = db.query(models.Service).filter(
            or_(
                models.Service.name_raw.ilike(f"%{q}%"),
                models.Service.name_norm.ilike(f"%{q}%"),
            )
        ).limit(20).all()
        hits = [{"id": service.id} for service in matching_services]
        
    results = []
    thirty_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    
    for hit in hits:
        service_id = hit['id']
        service = db.query(models.Service).filter(models.Service.id == service_id).first()
        if not service:
            continue
            
        # Join with Clinic to apply clinic-level filters in DB query if possible, or filter in Python
        prices = db.query(models.Price).filter(
            models.Price.service_id == service_id,
            models.Price.is_active.is_(True),
            models.Price.parsed_at.is_not(None),
            models.Price.parsed_at >= thirty_days_ago
        ).all()
        # Fallback to all available prices if no recent ones exist
        if not prices:
            prices = db.query(models.Price).filter(
                models.Price.service_id == service_id,
                models.Price.is_active.is_(True),
                models.Price.parsed_at.is_not(None),
            ).all()
        
        filtered_prices = []
        for p in prices:
            # Apply city filter
            if city and p.clinic.city.casefold() != city.casefold():
                continue
            if district and (not p.clinic.district or p.clinic.district.casefold() != district.casefold()):
                continue
            # Apply rating filter
            if min_rating and (p.clinic.rating or 0) < min_rating:
                continue
            # Apply online booking filter
            if online_booking is not None and p.clinic.has_online_booking != online_booking:
                continue
            if has_promotion is not None and bool(p.clinic.has_active_promotion) != has_promotion:
                continue
            clinic_doctors = p.clinic.doctors or []
            if specialty and not any(specialty.casefold() in (doctor.specialty or "").casefold() for doctor in clinic_doctors):
                continue
            if language and not any(language.casefold() in (doctor.languages or "").casefold() for doctor in clinic_doctors):
                continue
            if min_price_filter is not None and float(p.price_kzt) < min_price_filter:
                continue
            if max_price_filter is not None and float(p.price_kzt) > max_price_filter:
                continue
            filtered_prices.append(p)
            
        if not filtered_prices:
            continue
            
        prices_list = [p.price_kzt for p in filtered_prices if p.price_kzt is not None]
        if not prices_list:
            continue
            
        min_service_price = min(prices_list)
        avg_price = sum(prices_list) / len(prices_list)
        
        priced_offers = [p for p in filtered_prices if p.price_kzt is not None]
        best_price_obj = min(priced_offers, key=lambda p: p.price_kzt)
        
        results.append(schemas.UnifiedSearchResult(
            service=service,
            avg_price=float(avg_price),
            min_price=float(min_service_price),
            clinics_count=len(filtered_prices),
            best_offer_clinic=best_price_obj.clinic,
            best_offer_price=float(best_price_obj.price_kzt),
            last_updated_at=best_price_obj.parsed_at
        ))
        
    # Sorting logic
    if sort_by == 'price_asc':
        results.sort(key=lambda x: x.min_price)
    elif sort_by == 'price_desc':
        results.sort(key=lambda x: x.min_price, reverse=True)
    elif sort_by == 'date_desc':
        results.sort(key=lambda x: x.last_updated_at or datetime.min, reverse=True)
        
    return results

@app.post("/api/admin/trigger-parser", dependencies=[Depends(require_admin_key)])
def trigger_parser():
    import threading
    from scheduler_tasks import run_parsers_and_index
    # Run in background to not block the API
    t = threading.Thread(target=run_parsers_and_index)
    t.start()
    return {"message": "Parsers started in background."}


FREE_AI_LIMIT = 20


def consume_ai_quota(user: Optional[models.User], session_key: str, db: Session) -> Optional[int]:
    """Atomically account for a chat request and return the remaining quota."""

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if user and user.plan in {"pro", "premium"}:
        return None

    if user:
        period_started = user.ai_usage_period_started_at
        if not period_started or now - period_started >= timedelta(days=30):
            user.ai_requests_used = 0
            user.ai_usage_period_started_at = now
        if user.ai_requests_used >= FREE_AI_LIMIT:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Лимит бесплатного AI-доступа исчерпан",
                    "upgrade_required": True,
                    "plan": user.plan,
                    "limit": FREE_AI_LIMIT,
                },
            )
        user.ai_requests_used += 1
        db.commit()
        return FREE_AI_LIMIT - user.ai_requests_used

    usage = db.query(models.AIUsage).filter(models.AIUsage.session_key == session_key).first()
    if not usage:
        usage = models.AIUsage(session_key=session_key, requests_used=0, period_started_at=now)
        db.add(usage)
        db.flush()
    elif now - usage.period_started_at >= timedelta(days=30):
        usage.requests_used = 0
        usage.period_started_at = now
    if usage.requests_used >= FREE_AI_LIMIT:
        db.rollback()
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Лимит бесплатного AI-доступа исчерпан",
                "upgrade_required": True,
                "plan": "free",
                "limit": FREE_AI_LIMIT,
            },
        )
    usage.requests_used += 1
    db.commit()
    return FREE_AI_LIMIT - usage.requests_used


@app.post("/api/chat")
def chat_with_ai(
    req: ChatRequest,
    request: Request,
    response: Response,
    x_ai_session: Optional[str] = Header(default=None),
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Process a user message through the AI chat assistant."""
    try:
        language = req.language or chat_ai.detect_language(req.message)
        session_key = x_ai_session or f"anonymous:{request.client.host if request.client else 'unknown'}"
        remaining = consume_ai_quota(current_user, session_key, db)
        if remaining is not None:
            response.headers["X-AI-Remaining"] = str(remaining)

        reply = chat_ai.generate_ai_response(req.message, db, language=language)
        triage = chat_ai.analyze_symptoms(req.message, language=language)
        if triage:
            if language == "kz":
                reply = f"{reply}\n\nБолжамды себептер: {', '.join(triage['possible_causes'])}.\nАлғашқы тексерулер: {', '.join(triage['recommended_examinations'])}.\n\n⚠️ {triage['disclaimer']}"
            else:
                reply = f"{reply}\n\nВозможные причины: {', '.join(triage['possible_causes'])}.\nПервичные обследования: {', '.join(triage['recommended_examinations'])}.\n\n⚠️ {triage['disclaimer']}"
        recommended_doctors = []
        if triage:
            city = chat_ai.extract_city(req.message)
            recommended_doctors = [
                {
                    "id": doctor.id,
                    "name": f"{doctor.first_name} {doctor.last_name}",
                    "specialty": doctor.specialty,
                    "clinic_id": doctor.clinic_id,
                    "clinic_name": doctor.clinic.name if doctor.clinic else None,
                    "price": float(doctor.consultation_price or 0),
                    "rating": doctor.rating,
                    "photo_url": doctor.photo_url,
                }
                for doctor in chat_ai.recommend_doctors(triage["specialty"], city, db)
            ]
        return {
            "reply": reply,
            "language": language,
            "triage": triage,
            "recommended_doctors": recommended_doctors,
            "ai_remaining": remaining,
        }
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error("Chat API Error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="AI Error")

# --- Clinics & Services API ---
@app.get("/api/clinics", response_model=List[schemas.Clinic])
def read_clinics(
    city: Optional[str] = None,
    district: Optional[str] = None,
    q: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    online_booking: Optional[bool] = None,
    has_promotion: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(models.Clinic)
    if city:
        query = query.filter(models.Clinic.city.ilike(city.strip()))
    if district:
        query = query.filter(models.Clinic.district.ilike(district.strip()))
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(models.Clinic.name.ilike(pattern), models.Clinic.address.ilike(pattern)))
    if min_rating is not None:
        query = query.filter(models.Clinic.rating >= min_rating)
    if online_booking is not None:
        query = query.filter(models.Clinic.has_online_booking == online_booking)
    if has_promotion is not None:
        query = query.filter(models.Clinic.has_active_promotion == has_promotion)
    return query.offset(skip).limit(limit).all()


@app.get("/api/doctors", response_model=List[schemas.Doctor])
def read_doctors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    language: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    has_promotion: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(models.Doctor).join(models.Clinic)
    if specialty:
        query = query.filter(models.Doctor.specialty.ilike(f"%{specialty.strip()}%"))
    if city:
        query = query.filter(models.Clinic.city.ilike(city.strip()))
    if language:
        query = query.filter(models.Doctor.languages.ilike(f"%{language.strip()}%"))
    if min_rating is not None:
        query = query.filter(models.Doctor.rating >= min_rating)
    if min_price is not None:
        query = query.filter(models.Doctor.consultation_price >= min_price)
    if max_price is not None:
        query = query.filter(models.Doctor.consultation_price <= max_price)
    if has_promotion is not None:
        query = query.filter(models.Clinic.has_active_promotion == has_promotion)
    return query.order_by(models.Doctor.rating.desc()).offset(skip).limit(limit).all()

@app.get("/api/clinics/{clinic_id}", response_model=schemas.ClinicDetailResponse)
def read_clinic_details(clinic_id: str, db: Session = Depends(get_db)):
    clinic = db.query(models.Clinic).filter(models.Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
        
    recent_cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    services = db.query(models.Price).filter(
        models.Price.clinic_id == clinic_id,
        models.Price.is_active.is_(True),
        models.Price.price_kzt.is_not(None),
        models.Price.parsed_at.is_not(None),
        models.Price.parsed_at >= recent_cutoff,
    ).all()
    doctors = db.query(models.Doctor).filter(models.Doctor.clinic_id == clinic_id).all()
    
    return schemas.ClinicDetailResponse(clinic=clinic, services=services, doctors=doctors)

@app.get("/api/services", response_model=List[schemas.Service])
def read_services(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Service).offset(skip).limit(limit).all()

@app.get("/api/prices/{service_id}", response_model=List[schemas.Price])
def read_prices_for_service(service_id: str, city: Optional[str] = None, db: Session = Depends(get_db)):
    recent_cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    query = db.query(models.Price).filter(
        models.Price.service_id == service_id,
        models.Price.is_active.is_(True),
        models.Price.price_kzt.is_not(None),
        models.Price.parsed_at.is_not(None),
        models.Price.parsed_at >= recent_cutoff,
    )
    if city:
        query = query.join(models.Clinic).filter(models.Clinic.city == city)
    return query.all()


def _active_promo(code: str, clinic_id: Optional[str], db: Session):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    promo = db.query(models.PromoCode).filter(
        func.upper(models.PromoCode.code) == code.strip().upper(),
        models.PromoCode.is_active.is_(True),
        or_(models.PromoCode.starts_at.is_(None), models.PromoCode.starts_at <= now),
        or_(models.PromoCode.expires_at.is_(None), models.PromoCode.expires_at >= now),
    ).first()
    if not promo:
        raise HTTPException(status_code=400, detail="Промокод недействителен или истёк")
    if promo.usage_limit is not None and promo.used_count >= promo.usage_limit:
        raise HTTPException(status_code=400, detail="Лимит активаций промокода исчерпан")
    if promo.clinic_id and promo.clinic_id != clinic_id:
        raise HTTPException(status_code=400, detail="Промокод не действует для этой клиники")
    return promo


def _promo_amount(promo, amount: float) -> float:
    if promo.discount_type == "fixed":
        return min(amount, float(promo.discount_value))
    return min(amount, amount * float(promo.discount_value) / 100)


@app.post("/api/promocodes/validate", response_model=schemas.PromoCodeResponse)
def validate_promocode(payload: schemas.PromoCodeValidate, db: Session = Depends(get_db)):
    promo = _active_promo(payload.code, payload.clinic_id, db)
    discount = round(_promo_amount(promo, payload.amount), 2)
    return schemas.PromoCodeResponse(
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=float(promo.discount_value),
        discount_amount=discount,
        total_amount=round(payload.amount - discount, 2),
        expires_at=promo.expires_at,
    )


@app.get("/api/doctors/{doctor_id}/slots", response_model=List[schemas.DoctorSlot])
def read_doctor_slots(
    doctor_id: str,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    try:
        selected_date = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now().date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Дата должна быть в формате YYYY-MM-DD") from exc

    start = datetime.combine(selected_date, datetime.min.time()).replace(hour=9)
    slots = [start + timedelta(minutes=30 * index) for index in range(18)]
    booked = {
        booking.appointment_at
        for booking in db.query(models.Booking).filter(
            models.Booking.doctor_id == doctor_id,
            models.Booking.status.in_(["new", "confirmed"]),
            models.Booking.appointment_at >= start,
            models.Booking.appointment_at < start + timedelta(days=1),
        ).all()
        if booking.appointment_at
    }
    return [schemas.DoctorSlot(starts_at=slot, available=slot not in booked) for slot in slots]


@app.get("/api/bookings/me", response_model=List[schemas.BookingResponse])
def read_my_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Booking).filter(
        models.Booking.patient_id == current_user.id,
    ).order_by(models.Booking.priority_booking.desc(), models.Booking.appointment_at.asc(), models.Booking.created_at.desc()).all()


@app.post("/api/bookings", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking: schemas.BookingCreate,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    clinic = db.query(models.Clinic).filter(models.Clinic.id == booking.clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    if not booking.name.strip() or not booking.phone.strip():
        raise HTTPException(status_code=422, detail="Укажите имя и телефон")
    doctor = None
    if booking.doctor_id:
        doctor = db.query(models.Doctor).filter(
            models.Doctor.id == booking.doctor_id,
            models.Doctor.clinic_id == booking.clinic_id,
        ).first()
        if not doctor:
            raise HTTPException(status_code=400, detail="Doctor does not belong to clinic")
    appointment_at = booking.appointment_at
    if appointment_at and appointment_at.tzinfo:
        appointment_at = appointment_at.astimezone(timezone.utc).replace(tzinfo=None)
    if appointment_at and appointment_at <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Выберите будущий слот")
    if appointment_at:
        occupied = db.query(models.Booking).filter(
            models.Booking.clinic_id == booking.clinic_id,
            models.Booking.doctor_id == booking.doctor_id,
            models.Booking.appointment_at == appointment_at,
            models.Booking.status.in_(["new", "confirmed"]),
        ).first()
        if occupied:
            raise HTTPException(status_code=409, detail="Этот слот уже занят")

    base_amount = float(doctor.consultation_price or 0) if doctor else 0
    discount = 0.0
    promo = None
    if booking.promo_code:
        promo = _active_promo(booking.promo_code, booking.clinic_id, db)
        discount = _promo_amount(promo, base_amount)

    created = models.Booking(
        clinic_id=booking.clinic_id,
        doctor_id=booking.doctor_id,
        patient_id=current_user.id if current_user else None,
        name=booking.name.strip(),
        phone=booking.phone.strip(),
        preferred_time=booking.preferred_time,
        appointment_at=appointment_at,
        promo_code=promo.code if promo else None,
        discount_amount=discount,
        total_amount=round(base_amount - discount, 2) if doctor else None,
        priority_booking=bool(current_user and current_user.plan == "premium"),
    )
    db.add(created)
    if promo:
        promo.used_count += 1
    db.commit()
    db.refresh(created)
    return created

@app.post("/api/price-alerts", status_code=status.HTTP_201_CREATED)
def create_price_alert(
    alert: schemas.PriceAlertCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = db.query(models.Service).filter(models.Service.id == alert.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    existing = db.query(models.UserSubscription).filter_by(
        user_id=current_user.id,
        service_id=alert.service_id,
        clinic_id=alert.clinic_id,
    ).first()
    if existing:
        return {"id": existing.id, "status": "already_subscribed"}
    subscription = models.UserSubscription(
        user_id=current_user.id,
        service_id=alert.service_id,
        clinic_id=alert.clinic_id,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return {"id": subscription.id, "status": "created", "target_price_kzt": alert.target_price_kzt}

# --- Subscriptions API ---
@app.post("/api/subscriptions", response_model=schemas.SubscriptionResponse)
def subscribe(sub: schemas.SubscriptionCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.UserSubscription).filter(
        models.UserSubscription.user_id == current_user.id,
        models.UserSubscription.service_id == sub.service_id,
        models.UserSubscription.clinic_id == sub.clinic_id
    ).first()
    
    if existing:
        return existing
        
    new_sub = models.UserSubscription(
        user_id=current_user.id,
        service_id=sub.service_id,
        clinic_id=sub.clinic_id
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@app.get("/api/subscriptions", response_model=List[schemas.SubscriptionResponse])
def get_my_subscriptions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.UserSubscription).filter(models.UserSubscription.user_id == current_user.id).all()


@app.get("/api/subscriptions/plan", response_model=schemas.PlanResponse)
def get_my_plan(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/api/subscriptions/plan", response_model=schemas.PlanResponse)
def update_my_plan(
    payload: schemas.PlanUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.plan = payload.plan
    db.commit()
    db.refresh(current_user)
    return current_user


def _recalculate_rating(db: Session, *, doctor_id: Optional[str] = None, clinic_id: Optional[str] = None):
    filters = [models.Review.doctor_id == doctor_id] if doctor_id else [models.Review.clinic_id == clinic_id]
    average, count = db.query(func.avg(models.Review.rating), func.count(models.Review.id)).filter(*filters).one()
    if doctor_id:
        target = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    else:
        target = db.query(models.Clinic).filter(models.Clinic.id == clinic_id).first()
    if target and count:
        target.rating = round(float(average), 2)
        target.reviews_count = int(count)
    return target


@app.get("/api/doctors/{doctor_id}/reviews", response_model=List[schemas.ReviewResponse])
def read_doctor_reviews(doctor_id: str, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.doctor_id == doctor_id).order_by(models.Review.created_at.desc()).all()


@app.get("/api/clinics/{clinic_id}/reviews", response_model=List[schemas.ReviewResponse])
def read_clinic_reviews(clinic_id: str, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.clinic_id == clinic_id).order_by(models.Review.created_at.desc()).all()


@app.post("/api/reviews", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: schemas.ReviewCreate,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    if bool(review.doctor_id) == bool(review.clinic_id):
        raise HTTPException(status_code=400, detail="Укажите врача или клинику")
    if review.doctor_id and not db.query(models.Doctor).filter(models.Doctor.id == review.doctor_id).first():
        raise HTTPException(status_code=404, detail="Doctor not found")
    if review.clinic_id and not db.query(models.Clinic).filter(models.Clinic.id == review.clinic_id).first():
        raise HTTPException(status_code=404, detail="Clinic not found")
    created = models.Review(
        user_id=current_user.id if current_user else None,
        doctor_id=review.doctor_id,
        clinic_id=review.clinic_id,
        rating=review.rating,
        comment=review.comment.strip() if review.comment else None,
    )
    db.add(created)
    db.flush()
    target = _recalculate_rating(db, doctor_id=review.doctor_id, clinic_id=review.clinic_id)
    db.commit()
    db.refresh(created)
    response_payload = schemas.ReviewResponse.model_validate(created).model_dump()
    response_payload["average_rating"] = target.rating if target else None
    response_payload["reviews_count"] = target.reviews_count if target else None
    return response_payload


