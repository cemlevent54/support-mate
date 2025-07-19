#!/usr/bin/env python3
"""
MongoDB Data Migration Script
Bu script MongoDB verilerini 27018 portundan 27017 portuna tasir.
Kullanim: python scripts/migrate_mongodb_data.py
"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime
import logging

# Logging konfigurasyonu
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# MongoDB baglanti bilgileri
SOURCE_URI = "mongodb://root:password@localhost:27018/ticket-service?authSource=admin"
TARGET_URI = "mongodb://root:password@localhost:27017/ticket-service?authSource=admin"

# Koleksiyon isimleri
COLLECTIONS = ["tickets", "messages", "chats", "tasks"]

def connect_to_mongodb(uri, name):
    """MongoDB'ye baglan ve baglantiyi test et"""
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.server_info()  # Baglanti testi
        db_name = uri.rsplit('/', 1)[-1].split('?')[0]
        db = client[db_name]
        logger.info(f"[SUCCESS] {name} MongoDB'ye basariyla baglandi: {db_name}")
        return client, db
    except Exception as e:
        logger.error(f"[ERROR] {name} MongoDB baglantisi basarisiz: {str(e)}")
        return None, None

def get_collection_stats(db, collection_name):
    """Koleksiyon istatistiklerini al"""
    try:
        collection = db[collection_name]
        count = collection.count_documents({})
        logger.info(f"[INFO] {collection_name} koleksiyonu: {count} dokuman")
        return count
    except Exception as e:
        logger.error(f"[ERROR] {collection_name} koleksiyonu istatistikleri alinamadi: {str(e)}")
        return 0

def migrate_collection(source_db, target_db, collection_name):
    """Tek bir koleksiyonu tasi"""
    try:
        source_collection = source_db[collection_name]
        target_collection = target_db[collection_name]
        
        # Kaynak koleksiyondaki tum dokumanlari al
        documents = list(source_collection.find({}))
        count = len(documents)
        
        if count == 0:
            logger.info(f"[INFO] {collection_name} koleksiyonu bos, atlaniyor")
            return 0
        
        logger.info(f"[MIGRATE] {collection_name} koleksiyonu tasiniyor... ({count} dokuman)")
        
        # Hedef koleksiyona dokumanlari ekle
        if documents:
            # _id alanlarini korumak icin insert_many kullan
            result = target_collection.insert_many(documents)
            inserted_count = len(result.inserted_ids)
            logger.info(f"[SUCCESS] {collection_name} koleksiyonu basariyla tasindi: {inserted_count} dokuman")
            return inserted_count
        
        return 0
        
    except Exception as e:
        logger.error(f"[ERROR] {collection_name} koleksiyonu tasinirken hata: {str(e)}")
        return 0

def verify_migration(source_db, target_db):
    """Tasima islemini dogrula"""
    logger.info("[VERIFY] Tasima islemi dogrulaniyor...")
    
    for collection_name in COLLECTIONS:
        try:
            source_count = source_db[collection_name].count_documents({})
            target_count = target_db[collection_name].count_documents({})
            
            if source_count == target_count:
                logger.info(f"[SUCCESS] {collection_name}: {source_count} dokuman (eslesiyor)")
            else:
                logger.warning(f"[WARNING] {collection_name}: Kaynak={source_count}, Hedef={target_count} (eslesmiyor)")
                
        except Exception as e:
            logger.error(f"[ERROR] {collection_name} dogrulama hatasi: {str(e)}")

def main():
    """Ana fonksiyon"""
    logger.info("[START] MongoDB Veri Tasima Script'i Baslatiliyor")
    logger.info(f"[SOURCE] Kaynak: {SOURCE_URI}")
    logger.info(f"[TARGET] Hedef: {TARGET_URI}")
    logger.info("=" * 60)
    
    # Kaynak MongoDB'ye baglan
    source_client, source_db = connect_to_mongodb(SOURCE_URI, "Kaynak")
    if source_db is None:
        logger.error("[ERROR] Kaynak MongoDB'ye baglanilamadi. Script sonlandiriliyor.")
        return
    
    # Hedef MongoDB'ye baglan
    target_client, target_db = connect_to_mongodb(TARGET_URI, "Hedef")
    if target_db is None:
        logger.error("[ERROR] Hedef MongoDB'ye baglanilamadi. Script sonlandiriliyor.")
        source_client.close()
        return
    
    try:
        # Kaynak koleksiyonlarin istatistiklerini al
        logger.info("[INFO] Kaynak koleksiyon istatistikleri:")
        total_source_docs = 0
        for collection in COLLECTIONS:
            count = get_collection_stats(source_db, collection)
            total_source_docs += count
        
        logger.info(f"[INFO] Toplam kaynak dokuman sayisi: {total_source_docs}")
        logger.info("=" * 60)
        
        # Koleksiyonlari tasi
        total_migrated = 0
        for collection in COLLECTIONS:
            migrated_count = migrate_collection(source_db, target_db, collection)
            total_migrated += migrated_count
        
        logger.info("=" * 60)
        logger.info(f"[SUMMARY] Tasima Ozeti: {total_migrated} dokuman tasindi")
        
        # Tasima islemini dogrula
        verify_migration(source_db, target_db)
        
        logger.info("[SUCCESS] Veri tasima islemi tamamlandi!")
        
    except Exception as e:
        logger.error(f"[ERROR] Genel hata: {str(e)}")
    
    finally:
        # Baglantilari kapat
        source_client.close()
        target_client.close()
        logger.info("[INFO] MongoDB baglantilari kapatildi")

if __name__ == "__main__":
    main() 