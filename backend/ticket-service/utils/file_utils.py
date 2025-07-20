import os
import mimetypes
from typing import List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Desteklenen dosya türleri
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'}
VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'}
AUDIO_EXTENSIONS = {'.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma'}
DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'}
ARCHIVE_EXTENSIONS = {'.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'}

def get_file_type(filename: str) -> str:
    """
    Dosya türünü belirler
    """
    if not filename:
        return 'other'
    
    # Dosya uzantısını al
    _, ext = os.path.splitext(filename.lower())
    
    if ext in IMAGE_EXTENSIONS:
        return 'image'
    elif ext in VIDEO_EXTENSIONS:
        return 'video'
    elif ext in AUDIO_EXTENSIONS:
        return 'audio'
    elif ext in DOCUMENT_EXTENSIONS:
        return 'document'
    elif ext in ARCHIVE_EXTENSIONS:
        return 'archive'
    else:
        return 'other'

def generate_timestamped_filename(filename: str) -> str:
    """
    Dosya adının başına timestamp ekler
    Format: yyyy_mm_dd_hh_mm_ss_original_filename
    """
    if not filename:
        return filename
    
    # Şu anki zamanı al
    now = datetime.utcnow()
    timestamp = now.strftime("%Y_%m_%d_%H_%M_%S")
    
    # Dosya adı ve uzantısını ayır
    name, ext = os.path.splitext(filename)
    
    # Timestamp ile birleştir
    timestamped_filename = f"{timestamp}_{name}{ext}"
    
    return timestamped_filename

def get_upload_path(filename: str) -> str:
    """
    Dosya türüne göre upload path'ini belirler
    Timestamp'li dosya adı kullanır
    """
    # Dosya adına timestamp ekle
    timestamped_filename = generate_timestamped_filename(filename)
    file_type = get_file_type(filename)
    
    if file_type == 'image':
        return f"uploads/images/{timestamped_filename}"
    else:
        return f"uploads/files/{timestamped_filename}"

def ensure_upload_directories():
    """
    Gerekli upload klasörlerini oluşturur
    """
    directories = ['uploads/images', 'uploads/files']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Upload directory ensured: {directory}")

def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """
    Dosya boyutunu kontrol eder
    """
    max_size_bytes = max_size_mb * 1024 * 1024  # MB to bytes
    return file_size <= max_size_bytes

def get_file_size_mb(file_size: int) -> float:
    """
    Dosya boyutunu MB cinsinden döndürür
    """
    return round(file_size / (1024 * 1024), 2)

# Export edilebilir fonksiyonlar
__all__ = [
    'get_file_type',
    'generate_timestamped_filename',
    'get_upload_path',
    'ensure_upload_directories',
    'validate_file_size',
    'get_file_size_mb'
] 