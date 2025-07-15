import os
from dotenv import load_dotenv
from kafka import KafkaProducer
from config.logger import get_logger
from config.language import _

logger = get_logger()

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_kafka_brokers():
    return os.getenv('KAFKA_BROKERS')

def get_kafka_status():
    brokers = get_kafka_brokers()
    try:
        producer = KafkaProducer(bootstrap_servers=brokers, request_timeout_ms=2000)
        producer.close()
        logger.success(_("config.kafka.kafka_connection_success"))
        status = "up"
    except Exception as e:
        logger.error(_("config.kafka.kafka_connection_error", error=str(e)))
        status = "down"
    return {
        "status": status,
        "brokers": brokers
    }
