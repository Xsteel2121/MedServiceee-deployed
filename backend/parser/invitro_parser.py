import os
import json
from base import BaseParser
from database import SessionLocal
from models import CategoryEnum, CurrencyEnum, RawData

class InvitroParser(BaseParser):
    def __init__(self):
        super().__init__()
        self.base_url = "https://www.invitro.kz"
        self.clinic_data = {
            "name": "Инвитро (Invitro)",
            "city": "Алматы",
            "address": "Сеть медицинских лабораторий",
            "phone": "8 (800) 200-363-0",
            "working_hours": "07:30 - 15:00",
            "source_url": self.base_url,
            "has_online_booking": True
        }

    def parse(self):
        if os.getenv("ENABLE_INVITRO_MOCK_DATA", "false").lower() != "true":
            raise RuntimeError("Invitro parser is disabled until live price extraction is configured")

        print("Starting Invitro Parser...")
        clinic = self.get_or_create_clinic(self.clinic_data)
        
        simulated_data = [
            {"title": "Клинический анализ крови (ОАК) Invitro", "price": 2800},
            {"title": "Глюкоза в плазме Invitro", "price": 1100},
            {"title": "ТТГ (Тиреотропный гормон) Invitro", "price": 2500},
            {"title": "Ферритин Invitro", "price": 3100},
            {"title": "Витамин D, 25-гидрокси (кальциферол) Invitro", "price": 7500}
        ]
        
        # 1. Save raw data first (Architecture requirement)
        db = SessionLocal()
        try:
            raw = RawData(
                source_name="Invitro",
                source_url=self.base_url,
                data_payload=json.dumps(simulated_data, ensure_ascii=False)
            )
            db.add(raw)
            db.commit()
        except Exception as e:
            print(f"Error saving raw data: {e}")
        finally:
            db.close()
            
        # 2. Process and normalize
        count = 0
        for item in simulated_data:
            title = item["title"]
            price = item["price"]
            
            try:
                service = self.get_or_create_service({
                    "name_raw": title,
                    "category": CategoryEnum.laboratory
                })
                
                self.add_or_update_price({
                    "clinic_id": clinic.id,
                    "service_id": service.id,
                    "price_kzt": price,
                    "currency": CurrencyEnum.KZT
                })
                print(f"Parsed Invitro: {title} - {price} ₸")
                count += 1
            except Exception as e:
                pass

        print(f"Finished parsing Invitro. Saved {count} prices.")

if __name__ == "__main__":
    parser = InvitroParser()
    parser.parse()
