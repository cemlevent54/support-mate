#!/usr/bin/env python3
"""
Uploads klasöründeki mevcut dosyaları yeni klasör yapısına taşır:
- Resimler: uploads/images/
- Diğer dosyalar: uploads/files/
"""

import os
import shutil
from pathlib import Path

# Desteklenen resim uzantıları
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'}

def get_file_type(filename):
    """Dosya türünü belirler"""
    if not filename:
        return 'other'
    
    _, ext = os.path.splitext(filename.lower())
    
    if ext in IMAGE_EXTENSIONS:
        return 'image'
    else:
        return 'other'

def migrate_uploads():
    """Mevcut uploads dosyalarını yeni klasör yapısına taşır"""
    
    # Ana uploads klasörü
    uploads_dir = Path("uploads")
    images_dir = uploads_dir / "images"
    files_dir = uploads_dir / "files"
    
    # Klasörleri oluştur
    images_dir.mkdir(exist_ok=True)
    files_dir.mkdir(exist_ok=True)
    
    print(f"Migration başlatılıyor...")
    print(f"Kaynak: {uploads_dir}")
    print(f"Resimler: {images_dir}")
    print(f"Dosyalar: {files_dir}")
    
    # Mevcut dosyaları listele
    migrated_count = 0
    skipped_count = 0
    
    for file_path in uploads_dir.iterdir():
        if file_path.is_file():
            filename = file_path.name
            
            # Klasörleri atla
            if filename in ['images', 'files']:
                continue
                
            file_type = get_file_type(filename)
            
            if file_type == 'image':
                destination = images_dir / filename
            else:
                destination = files_dir / filename
            
            try:
                # Dosyayı taşı
                shutil.move(str(file_path), str(destination))
                print(f"✓ {filename} -> {destination}")
                migrated_count += 1
            except Exception as e:
                print(f"✗ {filename} taşınamadı: {e}")
                skipped_count += 1
    
    print(f"\nMigration tamamlandı!")
    print(f"Taşınan dosya sayısı: {migrated_count}")
    print(f"Atlanan dosya sayısı: {skipped_count}")

if __name__ == "__main__":
    migrate_uploads() 