import re
from typing import List, Dict, Any
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from config.language import _, set_language

class LoremFilterMiddleware:
    """
    Lorem ipsum kelimelerini filtreleyen middleware
    """
    
    def __init__(self):
        # Lorem ipsum kelime listesi
        self.lorem_words = {
            # En yaygınlar
            "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
            "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua",
            
            # Orta yaygınlık
            "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco",
            "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat",
            
            # Daha uzun lorem versiyonları için
            "duis", "aute", "irure", "in", "reprehenderit", "voluptate", "velit", "esse",
            "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat",
            "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia", "deserunt",
            "mollit", "anim", "id", "est", "laborum"
        }
        
        # Kontrol edilecek alanlar (case-insensitive)
        self.text_fields_to_check = {
            "title", "description", "content", "message", "comment", "note", "summary",
            "name", "subject", "body", "text", "details", "explanation"
        }
    
    def _contains_lorem_words(self, text: str) -> List[str]:
        """
        Metinde lorem ipsum kelimelerini kontrol eder
        Returns: Bulunan lorem kelimelerinin listesi
        """
        if not text or not isinstance(text, str):
            return []
        
        # Metni küçük harfe çevir ve kelimelere ayır
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Lorem kelimelerini bul
        found_lorem_words = []
        for word in words:
            if word in self.lorem_words:
                found_lorem_words.append(word)
        
        return found_lorem_words
    
    def _check_dict_for_lorem(self, data: Dict[str, Any], path: str = "") -> List[Dict[str, Any]]:
        """
        Dictionary içindeki metin alanlarını kontrol eder
        Returns: Bulunan lorem kelimelerinin detayları
        """
        violations = []
        
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            
            # String değerleri kontrol et
            if isinstance(value, str):
                lorem_words = self._contains_lorem_words(value)
                if lorem_words and key.lower() in self.text_fields_to_check:
                    violations.append({
                        "field": current_path,
                        "value": value,
                        "lorem_words": lorem_words,
                        "type": "string"
                    })
            
            # Dictionary değerleri recursive kontrol et
            elif isinstance(value, dict):
                violations.extend(self._check_dict_for_lorem(value, current_path))
            
            # List değerleri kontrol et
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        violations.extend(self._check_dict_for_lorem(item, f"{current_path}[{i}]"))
                    elif isinstance(item, str):
                        lorem_words = self._contains_lorem_words(item)
                        if lorem_words and key.lower() in self.text_fields_to_check:
                            violations.append({
                                "field": f"{current_path}[{i}]",
                                "value": item,
                                "lorem_words": lorem_words,
                                "type": "list_item"
                            })
        
        return violations
    
    async def __call__(self, request: Request, call_next):
        """
        Middleware ana fonksiyonu
        """
        # Sadece POST, PUT, PATCH isteklerini kontrol et
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Request body'yi al
                body = await request.json()
                
                # Lorem kontrolü yap
                violations = self._check_dict_for_lorem(body)
                
                if violations:
                    # Dil ayarını al
                    lang = request.headers.get("Accept-Language", "tr")
                    set_language(lang)
                    
                    # Hata mesajı oluştur
                    error_message = _("middleware.loremFilter.lorem_words_detected")
                    
                    # Detaylı hata bilgisi
                    error_details = {
                        "message": error_message,
                        "violations": violations,
                        "total_violations": len(violations)
                    }
                    
                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "message": error_message,
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