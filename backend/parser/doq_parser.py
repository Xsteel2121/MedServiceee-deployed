from playwright.sync_api import sync_playwright
from base import BaseParser
from models import CategoryEnum, CurrencyEnum
import re

class DoqParser(BaseParser):
    def __init__(self):
        super().__init__()
        self.base_url = "https://doq.kz"

    def parse(self):
        print("Starting Doq.kz Parser (Doctors) with Playwright...")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            try:
                print("Navigating to DOQ.kz...")
                page.goto(f"{self.base_url}/doctors/almaty", timeout=60000, wait_until="networkidle")
                
                content = page.content()
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(content, 'html.parser')
                
                count = 0
                
                # Each doctor is typically in a card. Let's find common card containers or just search for prices and traverse up
                price_elements = soup.find_all(string=re.compile(r'\d+.*тг', re.IGNORECASE))
                
                print(f"Found {len(price_elements)} price-like texts.")
                
                for p_text in price_elements:
                    text = p_text.strip()
                    price_match = re.search(r'(\d[\d\s]*)\s*тг', text, re.IGNORECASE)
                    if price_match:
                        price_str = price_match.group(1).replace(' ', '').replace('\xa0', '')
                        try:
                            price = float(price_str)
                            
                            # Navigate up the DOM to find a likely title (h1, h2, h3, h4 or a strong tag)
                            parent = p_text.parent
                            doctor_name = None
                            for _ in range(5): # Go up 5 levels max
                                if not parent: break
                                headings = parent.find_all(['h2', 'h3', 'h4', 'strong', 'a'])
                                for h in headings:
                                    h_text = h.get_text(strip=True)
                                    if len(h_text) > 5 and h_text != text:
                                        doctor_name = h_text
                                        break
                                if doctor_name:
                                    break
                                parent = parent.parent
                                
                            if not doctor_name:
                                doctor_name = "Специалист Doq.kz"
                                
                            clinic = self.get_or_create_clinic({
                                "name": "Doq.kz (Агрегатор)",
                                "city": "Алматы",
                                "address": "Онлайн запись",
                                "source_url": self.base_url
                            })
                            
                            service = self.get_or_create_service({
                                "name_raw": f"Прием врача: {doctor_name[:50]}",
                                "category": CategoryEnum.doctor_appointment
                            })
                            
                            self.add_or_update_price({
                                "clinic_id": clinic.id,
                                "service_id": service.id,
                                "price_kzt": price,
                                "currency": CurrencyEnum.KZT
                            })
                            print(f"Parsed DOQ Price: {doctor_name} - {price} ₸")
                            count += 1
                        except ValueError:
                            pass
                                
                print(f"Finished parsing Doq.kz. Saved {count} prices.")
            except Exception as e:
                print(f"Playwright error on DOQ: {e}")
            finally:
                browser.close()

if __name__ == "__main__":
    parser = DoqParser()
    parser.parse()
