import json
import os
from threading import local
from config.env import get_default_language

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
    # Eğer thread-local'da language yoksa, env'den oku ve ayarla
    lang = getattr(_thread_locals, 'language', None)
    if lang is None:
        lang = get_default_language()
        _thread_locals.language = lang
    return lang

def _(key, **kwargs):
    lang = get_language()
    # Nokta ile ayrılmış anahtarları iç içe gez
    def get_nested(dct, keys):
        for k in keys:
            if isinstance(dct, dict):
                dct = dct.get(k, None)
            else:
                return None
        return dct
    keys = key.split('.')
    text = get_nested(TRANSLATIONS.get(lang, {}), keys)
    if not text:
        text = key
    if kwargs:
        try:
            return text.format(**kwargs)
        except Exception:
            return text
    return text
