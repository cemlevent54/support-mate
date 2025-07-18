import json
import os
from threading import local

# Thread-local storage ile dil seçimi
_thread_locals = local()

LOCALES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'locales')
LANGUAGES = ['tr', 'en']
TRANSLATIONS = {}

# Tüm dilleri yükle
for lang in LANGUAGES:
    path = os.path.join(LOCALES_DIR, f'{lang}.json')
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            TRANSLATIONS[lang] = json.load(f)
    else:
        TRANSLATIONS[lang] = {}

def set_language(lang):
    if lang in LANGUAGES:
        _thread_locals.language = lang
    else:
        _thread_locals.language = 'en'

def get_language():
    return getattr(_thread_locals, 'language', 'en')

def _(key, **kwargs):
    lang = get_language()
    text = TRANSLATIONS.get(lang, {}).get(key, key)
    if kwargs:
        try:
            return text.format(**kwargs)
        except Exception:
            return text
    return text
