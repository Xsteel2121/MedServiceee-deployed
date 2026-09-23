"""Scheduled background tasks for automated data collection and indexing."""

from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
import os
import sys
from datetime import datetime, timedelta, timezone
from logger import scheduler_logger
from database import SessionLocal
from models import ParserLogs, RawData, PriceHistory


def log_parser_status(source: str, status: str, msg: str):
    db = SessionLocal()
    try:
        log_entry = ParserLogs(source_name=source, status=status, message=msg)
        db.add(log_entry)
        db.commit()
    except Exception as e:
        scheduler_logger.error("Failed to save parser log to DB: %s", e)
    finally:
        db.close()

def run_parsers_and_index() -> None:
    """
    Execute all configured parsers and re-index search data.
    Runs each parser as an isolated subprocess so failures don't cascade.
    """
    scheduler_logger.info("Starting scheduled parser run...")
    try:
        # Run KDL parser
        kdl_path = os.path.join(os.path.dirname(__file__), "parser", "kdl_parser.py")
        result = subprocess.run([sys.executable, kdl_path], check=False, capture_output=True, text=True)
        if result.returncode == 0:
            scheduler_logger.info("KDL parser completed successfully.")
            log_parser_status("KDL", "SUCCESS", "Parsed successfully")
        else:
            scheduler_logger.warning("KDL parser exited with code %d: %s", result.returncode, result.stderr[:200])
            log_parser_status("KDL", "FAILED", result.stderr[:200])

        # Run Olymp parser
        olymp_path = os.path.join(os.path.dirname(__file__), "parser", "olymp_parser.py")
        result = subprocess.run([sys.executable, olymp_path], check=False, capture_output=True, text=True)
        if result.returncode == 0:
            scheduler_logger.info("Olymp parser completed successfully.")
            log_parser_status("Olymp", "SUCCESS", "Parsed successfully")
        else:
            scheduler_logger.warning("Olymp parser exited with code %d: %s", result.returncode, result.stderr[:200])
            log_parser_status("Olymp", "FAILED", result.stderr[:200])

        # Re-index MeiliSearch after parsing
        search_path = os.path.join(os.path.dirname(__file__), "search.py")
        result = subprocess.run([sys.executable, search_path], check=False, capture_output=True, text=True)
        if result.returncode == 0:
            scheduler_logger.info("MeiliSearch re-indexing completed.")
        else:
            scheduler_logger.warning("MeiliSearch indexing exited with code %d: %s", result.returncode, result.stderr[:200])

        scheduler_logger.info("All scheduled tasks finished.")
    except Exception as e:
        scheduler_logger.error("Critical error during scheduled parsing: %s", e, exc_info=True)
        log_parser_status("System", "CRITICAL_FAILED", str(e))

def cleanup_old_data():
    """Delete raw data and price history older than 90 days."""
    scheduler_logger.info("Starting cleanup of old data (>90 days)...")
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=90)
        # Delete old RawData
        deleted_raw = db.query(RawData).filter(RawData.parsed_at < cutoff).delete()
        # Delete old PriceHistory
        deleted_history = db.query(PriceHistory).filter(PriceHistory.changed_at < cutoff).delete()
        
        db.commit()
        scheduler_logger.info(f"Cleanup finished. Deleted {deleted_raw} RawData rows and {deleted_history} PriceHistory rows.")
    except Exception as e:
        scheduler_logger.error("Error during cleanup: %s", e)
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()


def start_scheduler() -> None:
    """Start the APScheduler background scheduler."""
    scheduler.add_job(run_parsers_and_index, 'cron', hour=3, minute=0)
    scheduler.add_job(cleanup_old_data, 'cron', day_of_week='sun', hour=4, minute=0) # Weekly cleanup
    scheduler.start()
    scheduler_logger.info("APScheduler started: Parsers run daily at 03:00, Cleanup runs Sundays at 04:00.")


def stop_scheduler() -> None:
    """Gracefully shut down the APScheduler."""
    scheduler.shutdown()
    scheduler_logger.info("APScheduler stopped.")
