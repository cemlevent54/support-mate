from .logger import get_logger
from .language import set_language, get_language, _
from .env import get_default_language
from .health_check import health_check
from .database import get_mongo_uri
from .redis import get_redis_url
from .kafka import get_kafka_brokers
from fastapi import APIRouter
import pymongo
import redis
from kafka import KafkaProducer

logger = get_logger()

router = APIRouter()

@router.get("/health")
def health():
    return health_check()

# Bağlantı testleri

def test_mongo():
    try:
        client = pymongo.MongoClient(get_mongo_uri(), serverSelectionTimeoutMS=2000)
        client.server_info()  # Bağlantı testi
        logger.success("MongoDB bağlantısı başarılı.")
    except Exception as e:
        logger.error(f"MongoDB bağlantı hatası: {e}")

def test_redis():
    try:
        r = redis.from_url(get_redis_url())
        r.ping()
        logger.success("Redis bağlantısı başarılı.")
    except Exception as e:
        logger.error(f"Redis bağlantı hatası: {e}")

def test_kafka():
    try:
        producer = KafkaProducer(bootstrap_servers=get_kafka_brokers(), request_timeout_ms=2000)
        producer.close()
        logger.success("Kafka bağlantısı başarılı.")
    except Exception as e:
        logger.error(f"Kafka bağlantı hatası: {e}")

# API başlatıldığında testleri otomatik çalıştır

def test_all_connections():
    test_mongo()
    test_redis()
    test_kafka()

test_all_connections()
