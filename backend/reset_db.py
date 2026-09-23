"""Database reset and re-seed utility script."""

from database import engine, Base
import models
import seed_real_data
import search
from logger import db_logger


def reset() -> None:
    """Drop all tables, recreate them, seed data, and re-index search."""
    db_logger.info("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    db_logger.info("Creating all tables...")
    Base.metadata.create_all(bind=engine)

    db_logger.info("Seeding database with real Kazakhstan data...")
    seed_real_data.seed_db()

    db_logger.info("Re-indexing MeiliSearch...")
    search.init_meilisearch()
    search.index_all_services()

    db_logger.info("Database reset completed successfully!")


if __name__ == "__main__":
    reset()
