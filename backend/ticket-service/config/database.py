import os
from dotenv import load_dotenv
from pymongo import MongoClient
from urllib.parse import urlparse
from config.logger import get_logger
from config.language import _

logger = get_logger()

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_mongo_uri():
    return os.getenv('MONGO_URI')

def ensure_db_and_collection():
    uri = get_mongo_uri()
    logger.info(_(f"config.database.connecting").format(uri=uri))
    
    # URI'den veritabanı adını çıkar
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    
    # Önce MongoDB sunucusuna bağlan (veritabanı adı olmadan)
    base_uri = uri.rsplit('/', 1)[0]
    client = MongoClient(base_uri, serverSelectionTimeoutMS=2000)
    
    try:
        # MongoDB sunucusuna bağlantı testi
        client.server_info()
        logger.info(_(f"config.database.mongo_server_connected"))
        
        # Veritabanını oluştur (eğer yoksa)
        db = client[db_name]
        
        # Veritabanının varlığını kontrol etmek için bir koleksiyon listesi al
        # Bu işlem veritabanını otomatik olarak oluşturur
        db.list_collection_names()
        
        logger.info(_(f"config.database.db_created_or_exists").format(db=db_name))
        logger.info(_(f"config.database.connected").format(db=db_name))
        logger.info(_(f"config.database.mongo_connection_success").format(db=db_name))
        
    except Exception as e:
        logger.error(_(f"config.database.connection_failed").format(error=str(e)))
        logger.error(_(f"config.database.mongo_connection_error").format(error=str(e)))
        raise e
    finally:
        logger.info(_(f"config.database.closing"))
        client.close()
        logger.info(_(f"config.database.closed"))
    
    return db_name

# Modül yüklendiğinde otomatik çalıştır
DB_NAME = ensure_db_and_collection()

def get_db_status():
    uri = get_mongo_uri()
    parsed = urlparse(uri)
    host = parsed.hostname
    port = parsed.port or 27017
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    
    # Önce MongoDB sunucusuna bağlan (veritabanı adı olmadan)
    base_uri = uri.rsplit('/', 1)[0]
    client = MongoClient(base_uri, serverSelectionTimeoutMS=2000)
    
    try:
        # MongoDB sunucusuna bağlantı testi
        client.server_info()
        
        # Veritabanını oluştur (eğer yoksa)
        db = client[db_name]
        db.list_collection_names()  # Veritabanını oluşturur
        
        status = "up"
        ready_state = 1
    except Exception:
        status = "down"
        ready_state = 0
    finally:
        client.close()
    
    return {
        "status": status,
        "host": host,
        "port": port,
        "name": db_name,
        "readyState": ready_state
    }

def get_mongo_client_and_db():
    uri = get_mongo_uri()
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    client = MongoClient(uri)
    db = client[db_name]
    return client, db