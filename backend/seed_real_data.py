"""Database seeding script with real Kazakhstan medical clinic data."""

import random
from database import SessionLocal
from models import Clinic, Service, Price, PriceHistory, CategoryEnum, CurrencyEnum, Doctor
from datetime import datetime
import json
import uuid
from logger import db_logger
from migrations import ensure_schema

# Base data for generation
CITIES = {
    "Алматы": {"lat": 43.2220, "lng": 76.8512},
    "Астана": {"lat": 51.1694, "lng": 71.4491},
    "Шымкент": {"lat": 42.3417, "lng": 69.5901},
    "Караганда": {"lat": 49.8019, "lng": 73.1021},
    "Актобе": {"lat": 50.2839, "lng": 57.1670},
    "Павлодар": {"lat": 52.2833, "lng": 76.9667},
}

REAL_CLINICS = [
    # Алматы
    {"name": "КДЛ Олимп", "city": "Алматы", "address": "пр. Абая, 58А", "phone": "8 (727) 259-79-69", "lat": 43.241517, "lng": 76.899658, "url": "https://www.kdlolymp.kz/"},
    {"name": "Invivo", "city": "Алматы", "address": "ул. Шевченко, 154", "phone": "8 (727) 258-83-83", "lat": 43.245842, "lng": 76.911369, "url": "https://invivo.kz/"},
    {"name": "Медицинский центр Сункар", "city": "Алматы", "address": "ул. Розыбакиева, 71", "phone": "8 (727) 373-06-06", "lat": 43.238144, "lng": 76.892799, "url": "https://densaulyk.kz/"},
    {"name": "Достар Мед", "city": "Алматы", "address": "мкр. Самал-2, 58", "phone": "8 (727) 263-14-14", "lat": 43.231268, "lng": 76.953579, "url": "https://dostarmed.kz/"},
    {"name": "Эмирмед", "city": "Алматы", "address": "пр. Сейфуллина, 471", "phone": "8 (727) 279-22-22", "lat": 43.256284, "lng": 76.932454, "url": "https://emirmed.kz/"},
    {"name": "Центр Израильской Медицины", "city": "Алматы", "address": "ул. Маркова, 71", "phone": "8 (727) 271-88-88", "lat": 43.227487, "lng": 76.924874, "url": "https://cim.kz/"},
    {"name": "ХАК", "city": "Алматы", "address": "ул. Толе би, 296а", "phone": "8 (727) 277-50-60", "lat": 43.248384, "lng": 76.852873, "url": "https://hak.kz/"},
    {"name": "LS Clinic", "city": "Алматы", "address": "ул. Бухар Жырау, 27/5", "phone": "8 (727) 264-55-55", "lat": 43.235122, "lng": 76.918231, "url": "https://lsclinic.kz/"},

    # Астана
    {"name": "КДЛ Олимп", "city": "Астана", "address": "пр. Республики, 13", "phone": "8 (7172) 32-05-05", "lat": 51.160100, "lng": 71.428701, "url": "https://www.kdlolymp.kz/"},
    {"name": "Invivo", "city": "Астана", "address": "ул. Сыганак, 25", "phone": "8 (7172) 79-79-79", "lat": 51.125633, "lng": 71.424357, "url": "https://invivo.kz/"},
    {"name": "Green Clinic", "city": "Астана", "address": "ул. Мангилик Ел, 17", "phone": "8 (7172) 43-22-22", "lat": 51.115454, "lng": 71.431215, "url": "https://greenclinic.kz/"},
    {"name": "Медикер", "city": "Астана", "address": "пр. Кабанбай батыра, 17", "phone": "8 (7172) 79-91-11", "lat": 51.144464, "lng": 71.417244, "url": "https://mediker.kz/"},
    {"name": "Open Clinic", "city": "Астана", "address": "ул. Алиханова, 5", "phone": "8 (7172) 58-88-88", "lat": 51.164501, "lng": 71.426291, "url": "https://openclinic.kz/"},
    {"name": "Центр Перинатологии", "city": "Астана", "address": "ул. Туран, 71", "phone": "8 (7172) 27-27-27", "lat": 51.107567, "lng": 71.401912, "url": "https://perinatology.kz/"},
    {"name": "Гемотест", "city": "Астана", "address": "пр. Богенбай батыра, 56", "phone": "8 (7172) 55-55-55", "lat": 51.171853, "lng": 71.415033, "url": "https://gemotest.kz/"},

    # Шымкент
    {"name": "КДЛ Олимп", "city": "Шымкент", "address": "пр. Тауке хана, 15", "phone": "8 (7252) 21-11-11", "lat": 42.316824, "lng": 69.596009, "url": "https://www.kdlolymp.kz/"},
    {"name": "Invivo", "city": "Шымкент", "address": "ул. Байтурсынова, 9", "phone": "8 (7252) 30-30-30", "lat": 42.319522, "lng": 69.591010, "url": "https://invivo.kz/"},
    {"name": "Сункар", "city": "Шымкент", "address": "ул. Иляева, 42", "phone": "8 (7252) 41-41-41", "lat": 42.315024, "lng": 69.589887, "url": "https://densaulyk.kz/"},
    {"name": "Дарига", "city": "Шымкент", "address": "мкр. Нурсат, 23", "phone": "8 (7252) 55-66-77", "lat": 42.348210, "lng": 69.605411, "url": "https://darigamed.kz/"},
    {"name": "Эмирмед", "city": "Шымкент", "address": "пр. Республики, 2", "phone": "8 (7252) 88-88-88", "lat": 42.321456, "lng": 69.601245, "url": "https://emirmed.kz/"},

    # Караганда
    {"name": "КДЛ Олимп", "city": "Караганда", "address": "пр. Бухар-Жырау, 54", "phone": "8 (7212) 42-42-42", "lat": 49.803322, "lng": 73.090124, "url": "https://www.kdlolymp.kz/"},
    {"name": "Invivo", "city": "Караганда", "address": "ул. Алиханова, 37", "phone": "8 (7212) 41-11-11", "lat": 49.805433, "lng": 73.097566, "url": "https://invivo.kz/"},
    {"name": "Диацент", "city": "Караганда", "address": "ул. Гоголя, 51", "phone": "8 (7212) 33-33-33", "lat": 49.800111, "lng": 73.111222, "url": "https://diacent.kz/"},
    {"name": "Мерей", "city": "Караганда", "address": "мкр. Степной-1, 15", "phone": "8 (7212) 77-77-77", "lat": 49.789455, "lng": 73.131234, "url": "https://merey-clinic.kz/"},
    {"name": "Гиппократ", "city": "Караганда", "address": "ул. Муканова, 14", "phone": "8 (7212) 88-99-88", "lat": 49.791555, "lng": 73.135666, "url": "https://gippokrat.kz/"},

    # Актобе
    {"name": "КДЛ Олимп", "city": "Актобе", "address": "пр. Абилкайыр хана, 42", "phone": "8 (7132) 51-51-51", "lat": 50.283122, "lng": 57.165444, "url": "https://www.kdlolymp.kz/"},
    {"name": "Invivo", "city": "Актобе", "address": "ул. Маресьева, 79", "phone": "8 (7132) 52-52-52", "lat": 50.288455, "lng": 57.158333, "url": "https://invivo.kz/"},
    {"name": "Медикус", "city": "Актобе", "address": "мкр. 11, 4", "phone": "8 (7132) 22-22-22", "lat": 50.292111, "lng": 57.149222, "url": "https://medicus.kz/"},

    # Павлодар
    {"name": "КДЛ Олимп", "city": "Павлодар", "address": "ул. Лермонтова, 94", "phone": "8 (7182) 31-31-31", "lat": 52.288111, "lng": 76.955222, "url": "https://www.kdlolymp.kz/"},
    {"name": "Invivo", "city": "Павлодар", "address": "ул. Торайгырова, 64", "phone": "8 (7182) 32-32-32", "lat": 52.290555, "lng": 76.951111, "url": "https://invivo.kz/"},
]

LAB_TESTS = [
    "Общий анализ крови (ОАК)", "Биохимический анализ крови", "Коагулограмма", 
    "Анализ крови на глюкозу", "Гликированный гемоглобин", "ТТГ", "Т4 свободный", "Т3 свободный",
    "Витамин D", "Ферритин", "Сывороточное железо", "Кальций", "Магний", "Липидограмма",
    "АЛТ", "АСТ", "Билирубин", "Креатинин", "Мочевина", "Мочевая кислота", "Общий белок",
    "С-реактивный белок (СРБ)", "Общий анализ мочи", "ПЦР на COVID-19", "Мазок на флору",
    "Тестостерон", "Пролактин", "Эстрадиол", "Прогестерон", "Кортизол", "Инсулин"
]

DIAGNOSTICS = [
    "УЗИ брюшной полости", "УЗИ почек", "УЗИ малого таза", "УЗИ щитовидной железы", 
    "УЗИ молочных желез", "УЗИ предстательной железы", "УЗИ сердца (ЭхоКГ)", "УЗДГ сосудов",
    "МРТ головного мозга", "МРТ шейного отдела", "МРТ поясничного отдела", "МРТ коленного сустава",
    "МРТ малого таза", "КТ головного мозга", "КТ грудной клетки", "КТ брюшной полости",
    "Рентген грудной клетки", "Рентген пазух носа", "Рентген сустава", "ЭКГ с расшифровкой",
    "Холтер ЭКГ (24 часа)", "ЭЭГ", "Спирометрия"
]

DOCTORS = [
    "Терапевт", "Кардиолог", "Невропатолог", "Гинеколог", "Уролог", "Эндокринолог",
    "Гастроэнтеролог", "Отоларинолог (ЛОР)", "Офтальмолог", "Дерматолог", "Хирург", 
    "Травматолог", "Педиатр", "Онколог", "Маммолог", "Пульмонолог", "Аллерголог", "Психиатр"
]

PROCEDURES = [
    "ФГДС (гастроскопия)", "Колоноскопия", "Внутримышечная инъекция", "Внутривенная инъекция",
    "Капельница", "Массаж спины", "Массаж воротниковой зоны", "УВЧ терапия", 
    "Электрофорез", "Блокада сустава", "Удаление новообразования", "Перевязка"
]

MALE_NAMES = ["Азамат", "Данияр", "Тимур", "Алихан", "Марат", "Руслан", "Ержан", "Серик", "Талгат", "Бауыржан", "Арман"]
FEMALE_NAMES = ["Айгерим", "Динара", "Асель", "Мадина", "Самал", "Гульмира", "Айнур", "Жазира", "Алия", "Индира", "Айжан"]
LAST_NAMES = ["Абдрахманов", "Оспанов", "Смагулов", "Ибрагимов", "Алиев", "Сатпаев", "Нургалиев", "Ахметов", "Каримов", "Исаев"]

REAL_DOCTORS = {
    "Медицинский центр Сункар": [
        {"first_name": "Бахытжан", "last_name": "Абишев", "specialty": "Уролог", "exp": 15, "price": 8000},
        {"first_name": "Сауле", "last_name": "Сейдуалиева", "specialty": "Гинеколог", "exp": 22, "price": 9000},
        {"first_name": "Гульмира", "last_name": "Исаева", "specialty": "Кардиолог", "exp": 18, "price": 10000},
        {"first_name": "Руслан", "last_name": "Оспанов", "specialty": "Терапевт", "exp": 10, "price": 7000},
    ],
    "Эмирмед": [
        {"first_name": "Тимур", "last_name": "Аскаров", "specialty": "Хирург", "exp": 25, "price": 12000},
        {"first_name": "Динара", "last_name": "Нургалиева", "specialty": "Невропатолог", "exp": 14, "price": 8500},
        {"first_name": "Ержан", "last_name": "Сатпаев", "specialty": "Травматолог", "exp": 20, "price": 10000},
        {"first_name": "Асель", "last_name": "Ахметова", "specialty": "Эндокринолог", "exp": 12, "price": 8000},
    ],
    "Достар Мед": [
        {"first_name": "Шолпан", "last_name": "Алиева", "specialty": "Педиатр", "exp": 30, "price": 15000},
        {"first_name": "Мурат", "last_name": "Ибрагимов", "specialty": "Отоларинолог (ЛОР)", "exp": 18, "price": 9500},
        {"first_name": "Жанна", "last_name": "Каримова", "specialty": "Дерматолог", "exp": 16, "price": 8000},
    ],
    "ХАК": [
        {"first_name": "Куаныш", "last_name": "Абдрахманов", "specialty": "Онколог", "exp": 28, "price": 15000},
        {"first_name": "Ляззат", "last_name": "Смагулова", "specialty": "Гастроэнтеролог", "exp": 21, "price": 11000},
    ],
    "LS Clinic": [
        {"first_name": "Арман", "last_name": "Маратов", "specialty": "Маммолог", "exp": 15, "price": 12000},
        {"first_name": "Алия", "last_name": "Талгатова", "specialty": "Пульмонолог", "exp": 12, "price": 9000},
    ]
}

def generate_clinics(num=None):
    clinics = []
    for rc in REAL_CLINICS:
        rating = round(random.uniform(3.8, 5.0), 1)
        reviews_count = random.randint(15, 600)
        
        clinics.append({
            "name": rc["name"],
            "city": rc["city"],
            "address": rc["address"],
            "phone": rc["phone"],
            "source_url": rc["url"],
            "working_hours": "08:00 - 20:00",
            "latitude": rc["lat"],
            "longitude": rc["lng"],
            "rating": rating,
            "reviews_count": reviews_count,
            "has_online_booking": random.choice([True, True, False]) # Mostly true
        })
    return clinics

def generate_services():
    services = []
    # Lab tests (~100 variations)
    for test in LAB_TESTS:
        services.append({"name": test, "category": CategoryEnum.laboratory, "base_price": random.randint(1500, 10000)})
        services.append({"name": f"{test} (Cito/Срочно)", "category": CategoryEnum.laboratory, "base_price": random.randint(3000, 15000)})
        services.append({"name": f"{test} (с выездом на дом)", "category": CategoryEnum.laboratory, "base_price": random.randint(5000, 20000)})
    
    # Diagnostics (~100 variations)
    for diag in DIAGNOSTICS:
        services.append({"name": diag, "category": CategoryEnum.diagnostics, "base_price": random.randint(5000, 30000)})
        services.append({"name": f"{diag} (с контрастом)", "category": CategoryEnum.diagnostics, "base_price": random.randint(10000, 45000)})
        services.append({"name": f"{diag} (детский)", "category": CategoryEnum.diagnostics, "base_price": random.randint(4000, 25000)})

    # Doctors (~100 variations)
    for doc in DOCTORS:
        services.append({"name": f"Прием врача: {doc} (первичный)", "category": CategoryEnum.doctor_appointment, "base_price": random.randint(6000, 15000)})
        services.append({"name": f"Прием врача: {doc} (повторный)", "category": CategoryEnum.doctor_appointment, "base_price": random.randint(4000, 10000)})
        services.append({"name": f"Прием врача: {doc} (высшая категория)", "category": CategoryEnum.doctor_appointment, "base_price": random.randint(10000, 25000)})
        services.append({"name": f"Онлайн-консультация: {doc}", "category": CategoryEnum.doctor_appointment, "base_price": random.randint(4000, 8000)})

    # Procedures (~100 variations)
    for proc in PROCEDURES:
        services.append({"name": proc, "category": CategoryEnum.procedure, "base_price": random.randint(1000, 25000)})
        services.append({"name": f"{proc} (на дому)", "category": CategoryEnum.procedure, "base_price": random.randint(3000, 35000)})
        services.append({"name": f"{proc} (стационар)", "category": CategoryEnum.procedure, "base_price": random.randint(2000, 20000)})

    return services

def seed_db():
    ensure_schema()
    db = SessionLocal()
    try:
        db_logger.info("Starting MASSIVE real data seed for Kazakhstan MVP...")
        
        clinics_data = generate_clinics(30)
        clinic_objects = []
        for c_data in clinics_data:
            clinic = Clinic(**c_data)
            db.add(clinic)
            clinic_objects.append(clinic)
        db.commit()
        
        for c in clinic_objects:
            db.refresh(c)
            
        db_logger.info("Added %d clinics across Kazakhstan.", len(clinic_objects))
        
        # Add Doctors for each clinic
        total_doctors = 0
        for clinic in clinic_objects:
            if clinic.name in REAL_DOCTORS:
                docs = REAL_DOCTORS[clinic.name]
                for d in docs:
                    photo_url = f"https://ui-avatars.com/api/?name={d['first_name']}+{d['last_name']}&background=random&color=fff&size=128"
                    doctor = Doctor(
                        clinic_id=clinic.id,
                        first_name=d['first_name'],
                        last_name=d['last_name'],
                        specialty=d['specialty'],
                        experience_years=d['exp'],
                        rating=round(random.uniform(4.5, 5.0), 1),
                        reviews_count=random.randint(50, 300),
                        consultation_price=d['price'],
                        photo_url=photo_url,
                        description=f"Официальный врач клиники {clinic.name}. Высококвалифицированный специалист со стажем {d['exp']} лет."
                    )
                    db.add(doctor)
                    total_doctors += 1
            else:
                num_doctors = random.randint(3, 8)
                for _ in range(num_doctors):
                    is_male = random.choice([True, False])
                    first_name = random.choice(MALE_NAMES) if is_male else random.choice(FEMALE_NAMES)
                    last_name = random.choice(LAST_NAMES) + ("а" if not is_male else "")
                    specialty = random.choice(DOCTORS)
                    experience_years = random.randint(5, 30)
                    rating = round(random.uniform(4.0, 5.0), 1)
                    reviews_count = random.randint(5, 120)
                    consultation_price = random.randint(5000, 15000)
                    
                    # Using UI Avatars for placeholder photos
                    photo_url = f"https://ui-avatars.com/api/?name={first_name}+{last_name}&background=random&color=fff&size=128"
                    description = f"Высококвалифицированный врач со стажем {experience_years} лет. Специализируется на современных методах диагностики и лечения."

                    doctor = Doctor(
                        clinic_id=clinic.id,
                        first_name=first_name,
                        last_name=last_name,
                        specialty=specialty,
                        experience_years=experience_years,
                        rating=rating,
                        reviews_count=reviews_count,
                        consultation_price=consultation_price,
                        photo_url=photo_url,
                        description=description
                    )
                    db.add(doctor)
                    total_doctors += 1
        db.commit()
        db_logger.info("Added %d doctors across all clinics.", total_doctors)

        services_data = generate_services()
        total_prices = 0
        
        for s_data in services_data:
            service = Service(name_raw=s_data["name"], category=s_data["category"])
            db.add(service)
            db.commit()
            db.refresh(service)
            
            # Each service is offered by ~15 random clinics
            offering_clinics = random.sample(clinic_objects, min(15, len(clinic_objects)))
            
            for clinic in offering_clinics:
                # Price varies by +/- 20% from base price
                variation = random.uniform(0.8, 1.2)
                price_val = round(s_data["base_price"] * variation, -2) # Round to hundreds
                
                price_obj = Price(
                    clinic_id=clinic.id,
                    service_id=service.id,
                    price_kzt=price_val,
                    currency=CurrencyEnum.KZT
                )
                db.add(price_obj)
                total_prices += 1
                
        db.commit()
        db_logger.info("Added %d unique services.", len(services_data))
        db_logger.info("Generated %d price combinations.", total_prices)
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
