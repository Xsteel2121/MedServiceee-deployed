import requests
from bs4 import BeautifulSoup
from base import BaseParser
from models import CategoryEnum, CurrencyEnum
import re

class KDLParser(BaseParser):
    def __init__(self):
        super().__init__()
        self.base_url = "https://kdlolymp.kz"
        self.clinic_data = {
            "name": "КДЛ ОЛИМП",
            "city": "Астана",
            "address": "Сеть лабораторий",
            "phone": "8 (727) 259-79-69",
            "working_hours": "07:30 - 15:00",
            "source_url": self.base_url
        }

    def parse(self):
        print("Starting KDL Olymp Parser...")
        clinic = self.get_or_create_clinic(self.clinic_data)
        
        url = f"{self.base_url}/price"
        headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Failed to fetch {url}")
                return
        except Exception as e:
            print(f"Error connecting: {e}")
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        count = 0
        
        # In KDL, services are usually within list elements or tables. Let's look for elements that might hold prices
        # Let's search for actual text matching "тг."
        price_texts = soup.find_all(string=re.compile(r'\d+.*тг', re.IGNORECASE))
        
        for p_text in price_texts:
            text = p_text.strip()
            price_match = re.search(r'(\d[\d\s]*)\s*тг', text, re.IGNORECASE)
            if price_match:
                price_str = price_match.group(1).replace(' ', '')
                try:
                    price = float(price_str)
                    
                    # Find title - usually the preceding sibling or parent text
                    parent = p_text.parent
                    title = ""
                    # try to get previous elements
                    if parent and parent.parent:
                        # get all text in the parent container minus the price part
                        full_text = parent.parent.get_text(strip=True)
                        title = full_text.replace(text, '').strip()
                        
                    if not title or len(title) < 5:
                        title = f"Анализ KDL Olymp {count+1}"
                        
                    # Remove random non-title junk
                    title = title[:150].strip()
                    if title:
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
                        print(f"Parsed KDL: {title} - {price} ₸")
                        count += 1
                except Exception as e:
                    pass

        print(f"Finished parsing KDL. Saved {count} prices.")

if __name__ == "__main__":
    parser = KDLParser()
    parser.parse()
