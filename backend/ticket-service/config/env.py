import os
from dotenv import load_dotenv

# Proje kök dizininde .env dosyasını yükle
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_default_language():
    return os.getenv('DEFAULT_LANGUAGE', 'en')
