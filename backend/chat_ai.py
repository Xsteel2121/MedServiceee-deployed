"""AI Chat Assistant module with Gemini Pro integration and intelligent fallback."""

import os
import re
from sqlalchemy.orm import Session
import models
import meilisearch
from logger import ai_logger

MEILI_URL = os.getenv("MEILI_URL", "http://meilisearch:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "")
meili_client = meilisearch.Client(MEILI_URL, MEILI_MASTER_KEY)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- Fallback Logic ---
def detect_language(text: str) -> str:
    text = text.lower().strip()
    kz_chars = set("әіңғүұқөһ")
    ru_chars = set("абвгдеёжзийклмнопрстуфхцчшщъыьэюя")
    if any(c in kz_chars for c in text): return "kz"
    ru_count = sum(1 for c in text if c in ru_chars)
    return "kz" if ru_count == 0 and any(c.isalpha() for c in text) else "ru"


def system_prompt_for(language: str) -> str:
    language_name = "қазақ тілінде" if language == "kz" else "на русском языке"
    return f"""Ты — медицинский AI-ассистент MedServicePrice.kz. Отвечай только {language_name}, на языке последнего сообщения пользователя.

Правила:
1. Помогай искать реальные клиники, услуги и врачей из переданной базы. Не выдумывай цены, адреса и доступность.
2. При симптомах объясняй возможные причины только как ориентир, рекомендуй подходящую специальность и первичные обследования.
3. Всегда добавляй предупреждение: «Не является диагнозом. При ухудшении состояния обратитесь к врачу или в экстренную службу».
4. Не назначай лечение и рецептурные препараты. При опасных симптомах советуй срочно обратиться за медицинской помощью.
5. Пиши кратко, понятными пунктами, без стандартного приветствия.
"""


SYMPTOM_RULES = [
    {
        "keywords": ["грудь", "сердце", "жүрек", "кеуде", "одышка", "ентігу"],
        "specialty": "Кардиолог",
        "causes_ru": ["перегрузка или стресс", "артериальное давление", "сердечно-сосудистые причины"],
        "causes_kz": ["шаршау немесе күйзеліс", "артериялық қысым", "жүрек-қантамыр себептері"],
        "tests_ru": ["ЭКГ", "измерение давления", "общий анализ крови"],
        "tests_kz": ["ЭКГ", "қан қысымын өлшеу", "жалпы қан талдауы"],
    },
    {
        "keywords": ["голов", "басым", "мигрень", "бас ауыру", "голova"],
        "specialty": "Невропатолог",
        "causes_ru": ["головная боль напряжения", "мигрень", "колебания давления"],
        "causes_kz": ["кернеулі бас ауруы", "мигрень", "қысымның өзгеруі"],
        "tests_ru": ["измерение давления", "осмотр невролога", "общий анализ крови"],
        "tests_kz": ["қан қысымын өлшеу", "невропатолог тексеруі", "жалпы қан талдауы"],
    },
    {
        "keywords": ["живот", "ішім", "іш ау", "тошнот", "жүрек айну"],
        "specialty": "Гастроэнтеролог",
        "causes_ru": ["нарушение питания", "гастрит или рефлюкс", "заболевания желчного пузыря"],
        "causes_kz": ["тамақтану тәртібінің бұзылуы", "гастрит немесе рефлюкс", "өт қабы аурулары"],
        "tests_ru": ["общий анализ крови", "биохимия крови", "УЗИ брюшной полости"],
        "tests_kz": ["жалпы қан талдауы", "қан биохимиясы", "іш қуысының УДЗ"],
    },
    {
        "keywords": ["горло", "нос", "ухо", "тамақ", "мұрын", "құлақ"],
        "specialty": "Отоларинголог (ЛОР)",
        "causes_ru": ["ОРВИ", "воспаление горла или пазух", "аллергия"],
        "causes_kz": ["ЖРВИ", "тамақ немесе қойнаудың қабынуы", "аллергия"],
        "tests_ru": ["осмотр ЛОР-врача", "общий анализ крови", "мазок по показаниям"],
        "tests_kz": ["ЛОР дәрігерінің тексеруі", "жалпы қан талдауы", "көрсеткіш бойынша жағынды"],
    },
]


def analyze_symptoms(message: str, language: str = "ru"):
    normalized = message.lower()
    rule = next((item for item in SYMPTOM_RULES if any(keyword in normalized for keyword in item["keywords"])), None)
    if not rule:
        return None
    is_kz = language == "kz"
    return {
        "specialty": rule["specialty"],
        "possible_causes": rule["causes_kz" if is_kz else "causes_ru"],
        "recommended_examinations": rule["tests_kz" if is_kz else "tests_ru"],
        "disclaimer": "Диагноз болып табылмайды. Жағдай нашарласа, дәрігерге немесе жедел жәрдемге жүгініңіз." if is_kz else "Не является диагнозом. При ухудшении состояния обратитесь к врачу или в экстренную службу.",
    }


def recommend_doctors(specialty: str, city: str, db: Session):
    query = db.query(models.Doctor).join(models.Clinic).filter(models.Doctor.specialty.ilike(f"%{specialty}%"))
    if city:
        query = query.filter(models.Clinic.city.ilike(f"%{city}%"))
    return query.order_by(models.Doctor.rating.desc(), models.Doctor.reviews_count.desc()).limit(3).all()

def extract_city(text: str) -> str:
    cities = ["Алматы", "Астана", "Шымкент", "Павлодар", "Актобе", "Караганда", "Атырау", "Тараз", "Усть-Каменогорск", "Семей", "Кызылорда", "Орал", "Костанай", "Петропавловск", "Актау", "Талдыкорган", "Туркестан", "Кокшетау"]
    text_lower = text.lower()
    for city in cities:
        city_root = city.lower()[:-1] if len(city) > 5 else city.lower()
        if city_root in text_lower:
            return city
    return None

def extract_service_keyword(text: str, db: Session) -> str:
    services = db.query(models.Service).all()
    text_lower = text.lower()
    synonyms = {
        "мрт": ["мрт", "mrt", "магнит", "томография"],
        "кт": ["кт", "kt", "компьютерная"],
        "узи": ["узи", "uzi", "ультразвук"],
        "оак": ["оак", "қан", "кровь", "анализ"],
        "терапевт": ["терапевт", "врач", "дәрігер", "прием терапевта"],
        "лор": ["лор", "оториноларинголог", "ухо", "горло", "нос", "құлақ"],
        "гинеколог": ["гинеколог", "әйелдер дәрігері"],
        "уролог": ["уролог", "ерлер дәрігері"],
        "кардиолог": ["кардиолог", "жүрек", "сердце"],
        "стоматолог": ["стоматолог", "тіс", "зуб", "дансист"],
        "рентген": ["рентген", "снимка", "снимок", "xray", "x-ray"],
        "экг": ["экг", "кардиограмма"]
    }
    for key, syn_list in synonyms.items():
        for syn in syn_list:
            if re.search(r'\b' + re.escape(syn) + r'\w*', text_lower): return key
    for s in services:
        name_lower = s.name_raw.lower()
        words = [w for w in name_lower.split() if len(w) > 4]
        for w in words:
            if w[:5] in text_lower: return s.name_raw
    return None

def get_best_clinic_for_service(service_name: str, city: str, db: Session):
    try:
        search_res = meili_client.index('services').search(service_name, {'limit': 5})
        hits = search_res.get('hits', [])
        if not hits: return None, None
        best_price_obj = None
        best_score = -1
        found_service = None
        for hit in hits:
            service_id = hit['id']
            service = db.query(models.Service).filter(models.Service.id == service_id).first()
            if not service: continue
            prices_query = db.query(models.Price).filter(models.Price.service_id == service_id)
            if city: prices_query = prices_query.join(models.Clinic).filter(models.Clinic.city.ilike(f"%{city}%"))
            prices = prices_query.all()
            if not prices: continue
            found_service = service
            prices_list = [float(p.price_kzt) for p in prices]
            min_price = min(prices_list)
            max_price = max(prices_list)
            for p in prices:
                rating = float(p.clinic.rating) if p.clinic.rating else 4.5
                price_val = float(p.price_kzt)
                norm_rating = rating / 5.0
                norm_price = 1.0 - ((price_val - min_price) / (max_price - min_price)) if max_price > min_price else 1.0
                score = (norm_rating * 0.6) + (norm_price * 0.4)
                if score > best_score:
                    best_score = score
                    best_price_obj = p
            if best_price_obj: break
        return found_service, best_price_obj
    except Exception as exc:
        ai_logger.warning("Clinic recommendation error: %s", exc, exc_info=True)
        return None, None

def get_top_clinics_in_city(city: str, db: Session):
    return db.query(models.Clinic).filter(models.Clinic.city.ilike(f"%{city}%")).order_by(models.Clinic.rating.desc()).limit(3).all()

# --- GEMINI INTEGRATION ---
def build_db_context(db: Session) -> str:
    clinics = db.query(models.Clinic).all()
    services = db.query(models.Service).all()
    doctors = db.query(models.Doctor).all()
    prices = db.query(models.Price).filter(models.Price.is_active.is_(True)).all()
    
    ctx = "БАЗА КЛИНИК (Используй эти данные для ответов, цены в тенге, рейтинги из 5.0):\n"
    ctx += "ВАЖНОЕ ПРАВИЛО ДЛЯ ССЫЛОК: Если рекомендуешь клинику, ОБЯЗАТЕЛЬНО делай её название кликабельной ссылкой в формате Markdown: [Название Клиники](/clinics/ID_КЛИНИКИ). Рядом укажи её адрес.\n\n"
    for c in clinics:
        ctx += f"Клиника: [{c.name}](/clinics/{c.id}) (ID: {c.id}), Город: {c.city}, Адрес: {c.address}, Рейтинг: {c.rating}\n"
        
        # Prices
        c_prices = [p for p in prices if p.clinic_id == c.id]
        if c_prices:
            ctx += "  Услуги и цены:\n"
            for p in c_prices:
                s = next((srv for srv in services if srv.id == p.service_id), None)
                if s: ctx += f"  - {s.name_raw}: {p.price_kzt} ₸\n"
                
        # Doctors
        c_docs = [d for d in doctors if d.clinic_id == c.id]
        if c_docs:
            ctx += "  Врачи:\n"
            for d in c_docs:
                ctx += f"  - {d.first_name} {d.last_name}, {d.specialty}, Стаж: {d.experience_years} лет, Прием: {d.consultation_price} ₸, Рейтинг: {d.rating}\n"
        ctx += "\n"
    return ctx

def ask_gemini(message: str, db: Session, language: str = "ru") -> str:
    system_prompt = """ЖҮЙЕЛІК РӨЛ:
Сен — MedServicePrice.kz платформасының өте жылдам, сауатты әрі мейірімді AI-көмекшісісің. Сенің басты мақсатың — клиентке кез келген тақырыпта лезде жауап беру және медициналық қызметтер мен дәрігерлерді табуға көмектесу.

ҚАТАҢ ЕРЕЖЕЛЕР (БҰЗУҒА БОЛМАЙДЫ):

1. ТІЛДІК АЙНА ЖӘНЕ САУАТТЫЛЫҚ (СТРОГОЕ ЗЕРКАЛИРОВАНИЕ ЯЗЫКА):
- Клиент қандай тілде жазса, ТУРА СОЛ ТІЛДЕ (қазақша немесе орысша) мінсіз, грамматикалық тұрғыдан өте сауатты жауап бер.
- Егер клиент қатемен немесе шала (жаргонмен) жазса да, сен оның деңгейіне түспе, әдеби, таза әрі сыпайы тілде жауап қайтар.
- Ағылшын тіліне ешқашан ауыспа (егер клиент өзі ағылшынша сұрамаса).

2. НАЙЗАҒАЙДАЙ ЖЫЛДАМДЫҚ ПЕН ҚЫСҚАЛЫҚ (МАКСИМАЛЬНАЯ СКОРОСТЬ):
- "Сәлеметсіз бе, мен жасанды интеллектпін, сізге қалай көмектесем" деген сияқты шаблонды, ішпыстыратын кіріспелерді МҮЛДЕМ ҚОЛДАНБА!
- Сұраққа бірден, тікелей жауап бер. Артық "су" болмасын. Максимум 2-3 қысқа сөйлем немесе нақты тізім (bullet points) қолдан.
- Жауаптарың көз жүгіртіп оқуға (сканирование) өте ыңғайлы болуы тиіс.

3. ҚАТЕЛЕРДІ ЖАЛМАП ЖҰТУ (АБСОЛЮТНОЕ ПОНИМАНИЕ):
- Клиенттің сөзінде қате болса да ("узы", "гиниколог", "оак багсы"), оның нені меңзеп тұрғанын 100% түсініп, дұрыс қызметті ұсын. Қатесін ешқашан бетіне баспа.

4. "МЯГКИЙ ПИВОТ" (БИЗНЕСКЕ БҰРУ):
- Клиент кез келген нәрсені сұрай алады (ауа райы, көңіл-күй, рецепт). Оған қысқаша әрі қызықты жауап бер де, мүмкіндік болса әңгімені денсаулыққа, клиникаларға немесе анализ бағаларына сыпайы түрде бұрып жібер.
- Егер нақты дәрігер/анализ іздесе, базадан ең тиімді баға мен рейтингі жоғарысын бірден ұсын.
"""
    # Keep the legacy prompt block above for backwards compatibility with old
    # deployments, but use the strict bilingual prompt for every new request.
    system_prompt = system_prompt_for(language)
    context = build_db_context(db)
    full_prompt = f"{system_prompt}\n\n{context}\n\nВопрос клиента: {message}"
    
    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )
        return response.text
    except Exception as e:
        ai_logger.error("Gemini API Error: %s", e, exc_info=True)
        return "🤖 AI серверінде қате кетті. Кейінірек қайталап көріңіз." if language == "kz" else "🤖 Ошибка AI-сервера. Попробуйте ещё раз позже."

import requests

def generate_ai_response(message: str, db: Session, language: str | None = None) -> str:
    message = message.strip()
    if not message or len(message) > 2000:
        return "Сұрауды 1-ден 2000 таңбаға дейін жазыңыз." if (language or detect_language(message)) == "kz" else "Сформулируйте запрос длиной от 1 до 2000 символов."
    if GEMINI_API_KEY:
        return ask_gemini(message, db, language=language or detect_language(message))
    
    # --- HYBRID FAST FALLBACK ---
    lang = language or detect_language(message)
    message_lower = message.lower()
    
    # 1. Fast Heuristic Match (0.1s)
    doctors = db.query(models.Doctor).all()
    found_doc = next((d for d in doctors if d.last_name.lower() in message_lower and len(d.last_name) > 3), None)
    
    if found_doc:
        clinic = db.query(models.Clinic).filter(models.Clinic.id == found_doc.clinic_id).first()
        if lang == "kz":
            return f"👨‍⚕️ **{found_doc.first_name} {found_doc.last_name}** ({found_doc.specialty}) осында қабылдайды:\n🏥 **[{clinic.name}](/clinics/{clinic.id})**\n📍 {clinic.address} ({clinic.city})\n💰 Бағасы: {found_doc.consultation_price} ₸\n⭐ Рейтинг: {found_doc.rating}"
        else:
            return f"👨‍⚕️ **{found_doc.first_name} {found_doc.last_name}** ({found_doc.specialty}) принимает здесь:\n🏥 **[{clinic.name}](/clinics/{clinic.id})**\n📍 {clinic.address} ({clinic.city})\n💰 Цена: {found_doc.consultation_price} ₸\n⭐ Рейтинг: {found_doc.rating}"

    city = extract_city(message)
    service_keyword = extract_service_keyword(message, db)
    needs_clinic = any(word in message_lower for word in ["клиник", "клинка", "больниц", "емхана", "аурухан"])
    
    if needs_clinic and not service_keyword:
        if city:
            clinics = get_top_clinics_in_city(city, db)
            if clinics:
                response = f"**{city}** қаласындағы үздік клиникалар:\n" if lang == "kz" else f"Лучшие клиники в городе **{city}**:\n"
                for c in clinics: response += f"- 🏥 **[{c.name}](/clinics/{c.id})** (⭐ {c.rating}/5.0)\n"
                return response
            else:
                return f"Кешіріңіз, **{city}** қаласында әзірге клиникалар жоқ." if lang == "kz" else f"Извините, в городе **{city}** пока нет клиник."

    if service_keyword:
        service, best_price = get_best_clinic_for_service(service_keyword, city, db)
        if service and best_price:
            if lang == "kz": return f"**{service.name_raw}** үшін ең тиімді нұсқа:\n🏥 **[{best_price.clinic.name}](/clinics/{best_price.clinic.id})**\n📍 {best_price.clinic.address}\n💰 **{best_price.price_kzt} ₸** (⭐ {best_price.clinic.rating}/5.0)"
            else: return f"Лучшее соотношение цена/качество для **{service.name_raw}**:\n🏥 **[{best_price.clinic.name}](/clinics/{best_price.clinic.id})**\n📍 {best_price.clinic.address}\n💰 **{best_price.price_kzt} ₸** (⭐ {best_price.clinic.rating}/5.0)"

    # External fallback is opt-in to avoid sending user messages to a third party.
    if os.getenv("ENABLE_EXTERNAL_AI_FALLBACK", "false").lower() != "true":
        return "Уточните ваш запрос. Какую услугу или клинику вы ищете?" if lang != "kz" else "Сұрағыңызды нақтылай түсіңізші. Қандай қызмет немесе клиника іздеп жүрсіз?"

    # 2. Pollinations AI for general chat (Weather, etc.)
    system_prompt = """ЖҮЙЕЛІК РӨЛ: Сен MedServicePrice.kz жылдам әрі мейірімді AI-көмекшісісің.
ҚАТАҢ ЕРЕЖЕЛЕР:
1. ТІЛДІК АЙНА: Клиент қай тілде жазса, сол тілде жауап бер.
2. ҚЫСҚАЛЫҚ: Максимум 1-2 сөйлем. Өте қысқа.
3. БИЗНЕСКЕ БҰРУ: Мүмкіндік болса, клиникаға немесе анализге сыпайы бұрып жібер.
"""
    system_prompt = system_prompt_for(lang)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message}
    ]
    try:
        resp = requests.post("https://text.pollinations.ai/", json={"messages": messages, "model": "openai"}, timeout=10)
        if resp.status_code == 200: return resp.text
    except Exception as e:
        ai_logger.warning("Pollinations fallback error: %s", e)
    
    return "Сұрағыңызды нақтылай түсіңізші. Қандай қызмет немесе клиника іздеп жүрсіз?" if lang == "kz" else "Уточните ваш запрос. Какую услугу или клинику вы ищете?"
