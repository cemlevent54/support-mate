import os
from dotenv import load_dotenv
from kafka import KafkaProducer, KafkaConsumer
from config.logger import get_logger
from config.language import _

logger = get_logger()

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

KAFKA_BROKERS = os.getenv('KAFKA_BROKERS', 'localhost:9092')
KAFKA_AGENT_EVENTS_TOPIC = 'agent-events'
KAFKA_GROUP_ID = 'ticket-service-group'

# Producer oluştur
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKERS,
    value_serializer=lambda v: v.encode('utf-8') if isinstance(v, str) else v
)

def get_kafka_brokers():
    return KAFKA_BROKERS

def get_kafka_status():
    brokers = get_kafka_brokers()
    try:
        producer = KafkaProducer(bootstrap_servers=brokers, request_timeout_ms=2000)
        producer.close()
        logger.info(_("config.kafka.kafka_connection_success"))
        status = "up"
    except Exception as e:
        logger.error(_("config.kafka.kafka_connection_error", error=str(e)))
        status = "down"
    return {
        "status": status,
        "brokers": brokers
    }

def get_kafka_producer():
    return producer

def get_kafka_consumer(topics=[KAFKA_AGENT_EVENTS_TOPIC], group_id=KAFKA_GROUP_ID):
    consumer = KafkaConsumer(
        *topics,
        bootstrap_servers=KAFKA_BROKERS,
        group_id=group_id,
        value_deserializer=lambda m: m.decode('utf-8'),
        auto_offset_reset='earliest',
        enable_auto_commit=True
    )
    return consumer
