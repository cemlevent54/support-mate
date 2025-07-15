from loguru import logger
import logging
from datetime import datetime
import colorama

colorama.init()

# Dosya için düz format
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} {level}: {message} {extra}"
# Konsol için renkli format
LOG_FORMAT_COLOR = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> <level>{level}</level>: <cyan>{message}</cyan> {extra}"

logger.remove()  # Varsayılan handler'ı kaldır
logger.add(
    "logs/app.log",  # Dosyaya da logla
    format=LOG_FORMAT,
    level="INFO",
    rotation="10 MB",
    retention="10 days",
    enqueue=True
)
logger.add(
    lambda msg: print(msg, end=""),  # Konsola renkli formatta yaz
    format=LOG_FORMAT_COLOR,
    level="INFO"
)

class InterceptHandler(logging.Handler):
    def emit(self, record):
        # Loguru seviyesine çevir
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        logger.opt(exception=record.exc_info).log(level, record.getMessage())

logging.basicConfig(handlers=[InterceptHandler()], level=0)
logging.getLogger().handlers = [InterceptHandler()]

# Uvicorn ve diğer logging loglarını da loguru'ya yönlendir
for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):  
    logging.getLogger(name).handlers = [InterceptHandler()]
    logging.getLogger(name).propagate = False

def get_logger():
    return logger
