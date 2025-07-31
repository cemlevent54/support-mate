import re
import base64
import json
import os
from typing import List, Dict, Any, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path

class SwearFilter:
    """
    Python tabanlı küfür filtreleme sistemi
    """

    def __init__(self):
        self.list = []
        self.place_holder = '*'
        self._load_swear_words()

    def _load_swear_words(self):
        """Base64 encoded dosyaları oku ve decode et"""
        try:
            # Dosya yollarını belirle
            current_dir = Path(__file__).parent.parent / "config" / "badword"
            tr_file_path = current_dir / "tr-bad-words.txt"
            en_file_path = current_dir / "en-bad-words.txt"

            # Türkçe kelimeleri yükle
            if tr_file_path.exists():
                with open(tr_file_path, 'r', encoding='utf-8') as f:
                    tr_content = f.read().strip()
                    try:
                        # Önce JSON olarak decode etmeyi dene
                        tr_data_set = json.loads(base64.b64decode(tr_content).decode('utf-8'))
                        self.list.extend(tr_data_set)
                    except json.JSONDecodeError:
                        # JSON değilse, satır satır decode et
                        decoded_content = base64.b64decode(tr_content).decode('utf-8')
                        tr_words = [word.strip() for word in decoded_content.split('\n') if word.strip()]
                        self.list.extend(tr_words)

            # İngilizce kelimeleri yükle
            if en_file_path.exists():
                with open(en_file_path, 'r', encoding='utf-8') as f:
                    en_content = f.read().strip()
                    try:
                        # Önce JSON olarak decode etmeyi dene
                        en_data_set = json.loads(base64.b64decode(en_content).decode('utf-8'))
                        self.list.extend(en_data_set)
                    except json.JSONDecodeError:
                        # JSON değilse, satır satır decode et
                        decoded_content = base64.b64decode(en_content).decode('utf-8')
                        en_words = [word.strip() for word in decoded_content.split('\n') if word.strip()]
                        self.list.extend(en_words)

        except Exception as e:
            print(f"Küfür kelimeleri yüklenirken hata: {e}")
            # Fallback: Temel kelimeler
            self.list = ["amk", "orospu", "piç", "fuck", "shit", "bitch"]

    def add_words(self, *words):
        """Kelime listesine yeni kelimeler ekle"""
        self.list.extend(words)

    def clean(self, text: str) -> str:
        """Metindeki küfür kelimelerini temizle"""
        if not text or not isinstance(text, str):
            return text

        result = text

        for word in self.list:
            if word and word.strip():
                # Küfür kelimesini regex ile bul ve değiştir
                escaped_word = re.escape(word)
                regex = re.compile(escaped_word, re.IGNORECASE)
                result = regex.sub(self.place_holder * len(word), result)

        return result

    def is_profane(self, text: str) -> bool:
        """Metinde küfür olup olmadığını kontrol et"""
        if not text or not isinstance(text, str):
            return False

        for word in self.list:
            if word and word.strip():
                escaped_word = re.escape(word)
                regex = re.compile(escaped_word, re.IGNORECASE)
                if regex.search(text):
                    return True

        return False

# Global filter instance
swear_filter = SwearFilter()

def check_for_swear_words(text: str) -> Dict[str, Any]:
    """Küfür kontrolü yapan fonksiyon"""
    if not text or not isinstance(text, str):
        return {"has_swear_words": False, "filtered_text": text}

    original_text = text
    filtered_text = swear_filter.clean(text)

    return {
        "has_swear_words": original_text != filtered_text,
        "filtered_text": filtered_text,
        "original_text": original_text
    }

def control_username(username: str) -> bool:
    """Username kontrolü için özel fonksiyon"""
    if not username or not isinstance(username, str):
        return False

    username_filter = swear_filter.clean(username)
    return "*" not in username_filter

def create_swear_word_response(locale: str = "tr") -> Dict[str, Any]:
    """Küfür içeren metin için özel response oluştur"""
    messages = {
        "tr": {
            "success": False,
            "message": "Mesajınızda uygunsuz kelimeler bulunmaktadır. Lütfen mesajınızı düzenleyin.",
            "data": None
        },
        "en": {
            "success": False,
            "message": "Your message contains inappropriate words. Please edit your message.",
            "data": None
        }
    }

    return messages.get(locale, messages["tr"])

async def swear_check_middleware(request: Request, call_next):
    """Küfür kontrolü middleware'i"""
    # Debug log
    print(f"[SWEAR MIDDLEWARE] {request.method} {request.url.path}")
    print(f"[SWEAR MIDDLEWARE] Headers: {dict(request.headers)}")
    
    # Sadece POST, PUT, PATCH isteklerini kontrol et
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            # Content-Type kontrolü
            content_type = request.headers.get("content-type", "").lower()
            print(f"[SWEAR MIDDLEWARE] Content-Type: {content_type}")
            
            if "application/json" in content_type:
                # JSON body kontrolü
                body = await request.json()
                violations = _check_dict_for_swear(body)
                print(f"[SWEAR MIDDLEWARE] JSON violations: {violations}")
            elif "multipart/form-data" in content_type:
                # Form data kontrolü
                form_data = await request.form()
                violations = _check_form_data_for_swear(form_data)
                print(f"[SWEAR MIDDLEWARE] Form violations: {violations}")
            else:
                # Diğer content type'lar için devam et
                print(f"[SWEAR MIDDLEWARE] Skipping - content type: {content_type}")
                response = await call_next(request)
                return response

            if violations:
                # Dil ayarını al
                lang = request.headers.get("Accept-Language", "tr")

                # Hata mesajı oluştur
                error_message = create_swear_word_response(lang)

                # Detaylı hata bilgisi
                error_details = {
                    "message": error_message["message"],
                    "violations": violations,
                    "total_violations": len(violations)
                }

                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": error_message["message"],
                        "data": None,
                        "details": error_details
                    }
                )

        except Exception as e:
            # JSON parse hatası veya diğer hatalar için devam et
            pass

    # Middleware'i devam ettir
    response = await call_next(request)
    return response

def _check_dict_for_swear(data: Dict[str, Any], path: str = "") -> List[Dict[str, Any]]:
    """Dictionary içindeki metin alanlarını kontrol et"""
    violations = []

    # Kontrol edilecek alanlar (case-insensitive)
    text_fields_to_check = {
        "title", "description", "content", "message", "comment", "note", "summary",
        "name", "subject", "body", "text", "details", "explanation"
    }

    for key, value in data.items():
        current_path = f"{path}.{key}" if path else key

        # String değerleri kontrol et
        if isinstance(value, str):
            result = check_for_swear_words(value)
            if result["has_swear_words"] and key.lower() in text_fields_to_check:
                # Hangi kelimelerin bulunduğunu logla
                found_words = []
                for word in swear_filter.list:
                    if word and word.strip():
                        escaped_word = re.escape(word)
                        regex = re.compile(escaped_word, re.IGNORECASE)
                        if regex.search(value):
                            found_words.append(word)
                
                print(f"[SWEAR DETECTED] Field: '{current_path}', Value: '{value}', Found words: {found_words}")
                
                violations.append({
                    "field": current_path,
                    "value": value,
                    "filtered_text": result["filtered_text"],
                    "type": "string",
                    "found_words": found_words
                })

        # Dictionary değerleri recursive kontrol et
        elif isinstance(value, dict):
            violations.extend(_check_dict_for_swear(value, current_path))

        # List değerleri kontrol et
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    violations.extend(_check_dict_for_swear(item, f"{current_path}[{i}]"))
                elif isinstance(item, str):
                    result = check_for_swear_words(item)
                    if result["has_swear_words"] and key.lower() in text_fields_to_check:
                        # Hangi kelimelerin bulunduğunu logla
                        found_words = []
                        for word in swear_filter.list:
                            if word and word.strip():
                                escaped_word = re.escape(word)
                                regex = re.compile(escaped_word, re.IGNORECASE)
                                if regex.search(item):
                                    found_words.append(word)
                        
                        print(f"[SWEAR DETECTED] Field: '{current_path}[{i}]', Value: '{item}', Found words: {found_words}")
                        
                        violations.append({
                            "field": f"{current_path}[{i}]",
                            "value": item,
                            "filtered_text": result["filtered_text"],
                            "type": "list_item",
                            "found_words": found_words
                        })

    return violations

def _check_form_data_for_swear(form_data) -> List[Dict[str, Any]]:
    """Form data içindeki metin alanlarını kontrol et"""
    violations = []

    # Kontrol edilecek alanlar (case-insensitive)
    text_fields_to_check = {
        "title", "description", "content", "message", "comment", "note", "summary",
        "name", "subject", "body", "text", "details", "explanation"
    }

    for key, value in form_data.items():
        if isinstance(value, str):
            result = check_for_swear_words(value)
            if result["has_swear_words"] and key.lower() in text_fields_to_check:
                # Hangi kelimelerin bulunduğunu logla
                found_words = []
                for word in swear_filter.list:
                    if word and word.strip():
                        escaped_word = re.escape(word)
                        regex = re.compile(escaped_word, re.IGNORECASE)
                        if regex.search(value):
                            found_words.append(word)
                
                print(f"[SWEAR DETECTED] Field: '{key}', Value: '{value}', Found words: {found_words}")
                
                violations.append({
                    "field": key,
                    "value": value,
                    "filtered_text": result["filtered_text"],
                    "type": "form_field",
                    "found_words": found_words
                })

    return violations

async def username_check_middleware(request: Request, call_next):
    """Username kontrolü için özel middleware"""
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.json()

            if "username" in body and isinstance(body["username"], str):
                is_clean = control_username(body["username"])
                if not is_clean:
                    lang = request.headers.get("Accept-Language", "tr")
                    message = (
                        "Username contains inappropriate words. Please choose a different username."
                        if lang == "en" else
                        "Kullanıcı adında uygunsuz kelimeler bulunmaktadır. Lütfen farklı bir kullanıcı adı seçin."
                    )

                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "message": message,
                            "data": None
                        }
                    )
        except Exception as e:
            # JSON parse hatası için devam et
            pass

    response = await call_next(request)
    return response 