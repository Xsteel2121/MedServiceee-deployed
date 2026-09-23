"""MeiliSearch indexing module for full-text service search."""

import os
import meilisearch
from models import Service, Price
from database import SessionLocal
from logger import search_logger

MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "")

client = meilisearch.Client(MEILI_URL, MEILI_MASTER_KEY)


def init_meilisearch() -> None:
    """Initialize MeiliSearch index with searchable and filterable attributes."""
    try:
        client.create_index('services', {'primaryKey': 'id'})
        client.index('services').update_searchable_attributes(['name_raw', 'name_norm', 'category'])
        client.index('services').update_filterable_attributes(['category'])
        search_logger.info("MeiliSearch index initialized successfully.")
    except Exception as e:
        search_logger.error("Error initializing MeiliSearch: %s", e, exc_info=True)


def index_all_services() -> None:
    """Fetch all services from the database and index them into MeiliSearch."""
    db = SessionLocal()
    try:
        services = db.query(Service).all()
        documents = []
        for s in services:
            documents.append({
                "id": s.id,
                "name_raw": s.name_raw,
                "name_norm": s.name_norm or "",
                "category": s.category.value if hasattr(s.category, 'value') else s.category
            })

        if documents:
            client.index('services').add_documents(documents)
            search_logger.info("Indexed %d services into MeiliSearch.", len(documents))
        else:
            search_logger.warning("No services found in database to index.")
    except Exception as e:
        search_logger.error("Error indexing services: %s", e, exc_info=True)
    finally:
        db.close()


if __name__ == "__main__":
    init_meilisearch()
    index_all_services()
