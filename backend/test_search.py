import os
import meilisearch
from database import SessionLocal
from models import Service, Price

client = meilisearch.Client(
    os.getenv('MEILI_URL', 'http://localhost:7700'),
    os.getenv('MEILI_MASTER_KEY', ''),
)
db = SessionLocal()

res = client.index('services').search('УЗИ', {'limit': 5})
hits = res.get('hits', [])
print("Meili Hits length:", len(hits))

for h in hits:
    sid = h['id']
    s = db.query(Service).filter(Service.id == sid).first()
    print("Hit ID:", sid, "Found in PG:", s is not None)
    if s:
        prices = db.query(Price).filter(Price.service_id == sid, Price.is_active.is_(True)).all()
        print("  Prices count:", len(prices))
        for p in prices:
            print("  Price in city:", p.clinic.city)
