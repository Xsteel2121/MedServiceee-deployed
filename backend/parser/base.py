import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List, Dict, Any
from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Clinic, Service, Price, PriceHistory, CategoryEnum, CurrencyEnum
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class BaseParser(ABC):
    def __init__(self):
        self.db: Session = SessionLocal()

    @abstractmethod
    def parse(self):
        """Implement parsing logic here"""
        pass

    def get_or_create_clinic(self, clinic_data: Dict[str, Any]) -> Clinic:
        clinic = self.db.query(Clinic).filter(
            Clinic.name == clinic_data['name'],
            Clinic.city == clinic_data.get('city', ''),
            Clinic.address == clinic_data.get('address', ''),
        ).first()
        if not clinic:
            clinic = Clinic(**clinic_data)
            self.db.add(clinic)
            self.db.commit()
            self.db.refresh(clinic)
        else:
            for field in ('phone', 'working_hours', 'source_url', 'latitude', 'longitude', 'rating', 'reviews_count', 'has_online_booking'):
                value = clinic_data.get(field)
                if value is not None:
                    setattr(clinic, field, value)
            self.db.commit()
        return clinic

    def get_or_create_service(self, service_data: Dict[str, Any]) -> Service:
        service = self.db.query(Service).filter(
            Service.name_raw == service_data['name_raw']
        ).first()
        if not service:
            service = Service(**service_data)
            self.db.add(service)
            self.db.commit()
            self.db.refresh(service)
        return service

    def add_or_update_price(self, price_data: Dict[str, Any]):
        price = self.db.query(Price).filter(
            Price.clinic_id == price_data['clinic_id'],
            Price.service_id == price_data['service_id']
        ).first()
        
        if price:
            old_kzt = price.price_kzt
            new_kzt = price_data.get('price_kzt')
            if new_kzt is None:
                raise ValueError('price_kzt is required')
            if old_kzt is None or float(old_kzt) != float(new_kzt):
                price.price_kzt = price_data['price_kzt']
                price.parsed_at = utc_now()
                history = PriceHistory(price_id=price.id, old_price_kzt=old_kzt, new_price_kzt=price.price_kzt)
                self.db.add(history)
            price.is_active = True
            price.parsed_at = utc_now()
            self.db.commit()
        else:
            price = Price(**price_data)
            self.db.add(price)
            self.db.commit()
            self.db.refresh(price)
            history = PriceHistory(price_id=price.id, old_price_kzt=None, new_price_kzt=price.price_kzt)
            self.db.add(history)
            self.db.commit()

    def __del__(self):
        self.db.close()
