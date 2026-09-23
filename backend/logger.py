"""
Centralized logging configuration for MedServicePrice backend.
Provides structured, leveled logging instead of raw print() statements.
"""

import logging
import sys
from datetime import datetime


def setup_logger(name: str = "medservice", level: int = logging.INFO) -> logging.Logger:
    """
    Create and configure a logger with console and structured formatting.

    Args:
        name: Logger name (used for module identification).
        level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).

    Returns:
        Configured logging.Logger instance.
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(level)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger


# Pre-configured loggers for each module
api_logger = setup_logger("medservice.api")
parser_logger = setup_logger("medservice.parser")
search_logger = setup_logger("medservice.search")
scheduler_logger = setup_logger("medservice.scheduler")
db_logger = setup_logger("medservice.database")
ai_logger = setup_logger("medservice.ai")
