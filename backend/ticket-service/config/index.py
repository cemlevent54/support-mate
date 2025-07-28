from .logger import get_logger
from .language import set_language, get_language, _
from .env import get_default_language
from .health_check import health_check
from .database import get_mongo_uri
from .redis import get_redis_url
from .kafka import get_kafka_brokers, get_kafka_producer, get_kafka_consumer
from .socketio import socket_manager
from .cors import CORS_CONFIG
from fastapi import APIRouter
import pymongo
import redis
from kafka import KafkaProducer
import logging
from kafka_files.kafkaConsumer import start_agent_online_consumer
import threading
from config.socketio import fastapi_app
from starlette.middleware.cors import CORSMiddleware

logger = get_logger()

router = APIRouter()

@router.get("/health")
def health():
    return health_check()

# SocketIO log
logging.getLogger("socketio").info(_(f"config.socketio.socketio_config_imported"))

# Bağlantı testleri

def test_mongo():
    try:
        client = pymongo.MongoClient(get_mongo_uri(), serverSelectionTimeoutMS=2000)
        client.server_info()  # Bağlantı testi
        logger.info(_(f"config.database.mongo_test_success"))
    except Exception as e:
        logger.error(_(f"config.database.mongo_test_error").format(error=e))

def test_redis():
    try:
        #r = redis.from_url(get_redis_url())
        r = redis.from_url('redis://127.0.0.1:6379')
        r.ping()
        logger.info(_(f"config.redis.redis_test_success"))
    except Exception as e:
        logger.error(_(f"config.redis.redis_test_error").format(error=e))

def test_kafka():
    try:
        producer = get_kafka_producer()
        producer.close()
        logger.info(_(f"config.kafka.kafka_test_success"))
    except Exception as e:
        logger.error(_(f"config.kafka.kafka_test_error").format(error=e))

def test_grpc():
    """gRPC bağlantısını test eder"""
    try:
        # gRPC config'i al
        from .grpcConfig import get_grpc_config, test_grpc_connection, get_grpc_client
        grpc_config = get_grpc_config()
        
        # Bağlantı testi
        if test_grpc_connection():
            logger.info(_(f"config.grpc.grpc_test_success"))
        else:
            logger.warning(_(f"config.grpc.grpc_test_warning"))
            
        # Client testi
        client = get_grpc_client()
        if client:
            logger.info(_(f"config.grpc.grpc_client_success"))
        else:
            logger.warning(_(f"config.grpc.grpc_client_warning"))
            
    except ImportError as e:
        logger.warning(f"gRPC config not available: {e}")
    except Exception as e:
        logger.error(_(f"config.grpc.grpc_test_error").format(error=e))

# API başlatıldığında testleri otomatik çalıştır

def test_all_connections():
    test_mongo()
    test_redis()
    test_kafka()
    test_grpc()

test_all_connections()

# Kafka consumer'ı arka planda başlat
threading.Thread(target=start_agent_online_consumer, daemon=True).start()

# CORS ayarlarını FastAPI app'ine uygula
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_CONFIG["allow_origins"],
    allow_credentials=CORS_CONFIG["allow_credentials"],
    allow_methods=CORS_CONFIG["allow_methods"],
    allow_headers=CORS_CONFIG["allow_headers"],
)
