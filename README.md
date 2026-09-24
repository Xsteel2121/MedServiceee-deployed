# 🏥 MedService.kz — Умный агрегатор медицинских цен
> **Слоган:** Не переплачивайте за здоровье. Найдите лучшую цену за 1 клик.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Meilisearch](https://img.shields.io/badge/Meilisearch-0.24-FF428A?style=for-the-badge&logo=meilisearch&logoColor=white)
![AI Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge)

---

## 🛑 Проблема (The Problem)
Каждый день тысячи пациентов получают направления на сдачу анализов или прохождение МРТ/КТ. 
Но **медицинский рынок абсолютно непрозрачен**:
1. **Разброс цен:** Один и тот же анализ (например, ТТГ) в разных клиниках может стоить от 1,500 до 6,000 тенге.
2. **Сложность поиска:** Пациентам приходится открывать 10 разных вкладок (Олимп, Инвитро, КДЛ), чтобы сравнить цены.
3. **Непонятные термины:** Врачи пишут направления сложным почерком или медицинскими терминами, которые обычный человек не понимает.

## 💡 Наше решение (The Solution)
**MedService.kz** — это первая в Казахстане платформа, которая объединяет прайс-листы всех крупных лабораторий и клиник в одном удобном интерфейсе.

* **⚡ Мгновенный поиск (Meilisearch):** Поиск понимает синонимы, опечатки и выдает результат за миллисекунды.
* **🤖 AI-Ассистент:** Пользователь может просто сфотографировать рецепт врача или написать "У меня болит живот", и ИИ сам подберет нужные анализы и покажет, где их сдать дешевле всего.
* **📊 График изменения цен:** Мы показываем, когда клиника искусственно завышает цену перед "акцией".
* **🛒 Сравнение корзины:** Сборка всех нужных анализов в корзину и сравнение итоговой суммы (где-то дешевле сдать всё вместе, где-то по отдельности).

---

## 💰 Бизнес-модель (Monetization)
Как мы планируем зарабатывать:
1. **B2B Лидогенерация (CPA/CPC):** Клиники платят комиссию за каждого записавшегося через нас пациента (5-10% от чека).
2. **Приоритетное размещение:** Платное продвижение клиник в топ поисковой выдачи по определенным анализам (как в Яндекс.Еде или 2GIS).
3. **B2C Premium подписка:** Для пользователей — уведомления о падении цен на дорогие процедуры (МРТ, стоматология), история изменения цен.
4. **B2B SaaS Аналитика:** Продажа клиникам дашбордов с аналитикой цен конкурентов в реальном времени.

---

## 🚀 Уникальное преимущество (USP)
* Единственный сервис с автоматическим **Real-time парсингом** цен из разных клиник.
* **Встроенный AI** для расшифровки сложных медицинских назначений.
* Максимально плавный и премиальный UI/UX дизайн (Dark Mode, Glassmorphism).

---

## 🛠 Стек технологий (Tech Stack)

### Фронтенд (Frontend)
- **Next.js 16** (App Router) — серверный и клиентский рендеринг.
- **TailwindCSS + Framer Motion** — современные и плавные анимации.
- **Lucide React** — минималистичные иконки.

### Бэкенд (Backend)
- **Python + FastAPI** — молниеносный API.
- **PostgreSQL + SQLAlchemy** — надежное хранение данных.
- **Playwright & BeautifulSoup4** — автоматизированные парсеры (Web Scraping).

### Поиск и AI
- **Meilisearch** — сверхбыстрый полнотекстовый движок.
- **Google Gemini Pro AI** — интеграция умного чат-бота.

### Деплой и Инфраструктура
- **Vercel** — хостинг фронтенда.
- **PS Cloud (регион Казахстан)** — хостинг бэкенда и PostgreSQL; см. [инструкцию](deploy/kz/README.md).

---

## 🏃‍♂️ Как запустить проект (How to Run)

### 1. Запуск Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # (или .venv\Scripts\activate для Windows)
pip install -r requirements.txt
set DATABASE_URL=postgresql://postgres:<password>@localhost:5432/medservice
set SECRET_KEY=<random-secret>
set MEILI_MASTER_KEY=<meilisearch-secret>
set ADMIN_API_KEY=<admin-secret>
set CORS_ORIGINS=http://localhost:3000
uvicorn main:app --reload
```

`SECRET_KEY`, `MEILI_MASTER_KEY`, `ADMIN_API_KEY` и production database credentials не должны
храниться в репозитории. Для запуска через Docker Compose задайте эти переменные в `.env`.

### 2. Запуск Frontend
```bash
npm install
npm run dev
```

### Feature seed and environment

Copy `.env.example` to `.env` and fill the backend secrets plus public map keys. On an existing database run the additive migration and feature seed before starting the API:

```bash
cd backend
python migrations.py
python seed_features.py
```

The seed now adds only a verified ЭМИРМЕД branch and three physicians published on the clinic's own site. Source URLs are stored in the database. It does **not** generate doctors, ratings, appointment availability, or promo codes. Promotions require a documented clinic offer; online booking requires the clinic to supply real slots. Unconnected clinics link to their official booking page.

---
*Сделано с ❤️ для Хакатона.*
