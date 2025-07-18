import os
from dotenv import load_dotenv
from config.logger import get_logger

# Proje kök dizininde .env dosyasını yükle
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_default_language():
    logger = get_logger()
    logger.info(f"DEFAULT_LANGUAGE: {os.getenv('DEFAULT_LANGUAGE')}")
    return os.getenv('DEFAULT_LANGUAGE')
