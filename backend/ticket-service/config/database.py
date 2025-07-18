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
    client = MongoClient(uri, serverSelectionTimeoutMS=2000)
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    db = client[db_name]
    try:
        # Bağlantı testi
        client.server_info()
        logger.success(_(f"config.database.connected").format(db=db_name))
        logger.success(_(f"config.database.mongo_connection_success").format(db=db_name))
    except Exception as e:
        logger.error(_(f"config.database.connection_failed").format(error=str(e)))
        logger.error(_(f"config.database.mongo_connection_error").format(error=str(e)))
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
    client = MongoClient(uri, serverSelectionTimeoutMS=2000)
    db_name = uri.rsplit('/', 1)[-1].split('?')[0]
    db = client[db_name]
    try:
        client.server_info()
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
