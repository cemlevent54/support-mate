import logging
import logging.config
from datetime import datetime

# ANSI renk kodları
RESET = "\033[0m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"

class ColoredFormatter(logging.Formatter):
    def format(self, record):
        msg = super().format(record)
        if record.levelno >= logging.ERROR:
            color = RED
        elif record.levelno == logging.WARNING:
            color = YELLOW
        else:
            color = GREEN
        return f"{color}{msg}{RESET}"

LOG_FORMAT = '%(asctime)s %(levelname)s: %(message)s'
LOG_DATEFMT = '%Y-%m-%d %H:%M:%S'

class ConsoleHandler(logging.StreamHandler):
    def __init__(self):
        super().__init__()
        self.setFormatter(ColoredFormatter(LOG_FORMAT, LOG_DATEFMT))

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": LOG_FORMAT,
            "datefmt": LOG_DATEFMT,
        },
        "colored": {
            '()': ColoredFormatter,
            'format': LOG_FORMAT,
            'datefmt': LOG_DATEFMT,
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "colored",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "default",
            "filename": "logs/app.log",
            "encoding": "utf-8",
        },
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console", "file"]
    },
    "loggers": {
        "uvicorn": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
        "uvicorn.access": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
    },
}

logging.config.dictConfig(LOG_CONFIG)

def get_logger():
    return logging.getLogger()
