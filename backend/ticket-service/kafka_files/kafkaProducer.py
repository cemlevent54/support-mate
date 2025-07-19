import json
import logging
from kafka import KafkaProducer
from config.kafka import get_kafka_brokers
from string import Template

logger = logging.getLogger(__name__)

TICKET_CREATED_TOPIC = "ticket-created"
AGENT_ASSIGNED_TOPIC = "agent-assigned"

_producer = None

def get_producer():
    global _producer
    if _producer is None:
        try:
            _producer = KafkaProducer(
                bootstrap_servers=get_kafka_brokers(),
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
        except Exception as e:
            logger.error(f"KafkaProducer başlatılamadı: {e}")
            _producer = None
    return _producer

def send_ticket_created_event(ticket, user, html_path=None, language='tr'):
    try:
        # HTML şablonunu oku ve değişkenleri doldur
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=user.get("firstName", ""),
                    ticketTitle=ticket.title,
                    ticketId=ticket.id
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        event = {
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "language": language,
            "ticketId": ticket.id,
            "ticketTitle": ticket.title,
            "html": html_content
        }
        logger.info(f"Sending ticket_created event to Kafka: {event}")
        producer = get_producer()
        if producer:
            producer.send(TICKET_CREATED_TOPIC, event)
            producer.flush()
        else:
            logger.error("KafkaProducer mevcut değil, event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka ticket_created event could not be sent: {e}")

def send_agent_assigned_event(customer_info, agent_info, ticket_info, html_path=None, language='tr'):
    try:
        # HTML şablonunu oku ve değişkenleri doldur
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=customer_info.get("firstName", ""),
                    agentName=agent_info.get("name", "Müşteri Temsilcisi"),
                    ticketTitle=ticket_info.get("title", "Destek Talebi"),
                    ticketId=ticket_info.get("id", "")
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        
        event = {
            "email": customer_info.get("email"),
            "firstName": customer_info.get("firstName", ""),
            "language": language,
            "ticketId": ticket_info.get("id"),
            "ticketTitle": ticket_info.get("title", "Destek Talebi"),
            "agentName": agent_info.get("name", "Müşteri Temsilcisi"),
            "agentId": agent_info.get("id"),
            "html": html_content
        }
        logger.info(f"Sending agent_assigned event to Kafka: {event}")
        producer = get_producer()
        if producer:
            producer.send(AGENT_ASSIGNED_TOPIC, event)
            producer.flush()
            logger.info(f"agent_assigned event Kafka'ya gönderildi: {ticket_info.get('id')}")
        else:
            logger.error("KafkaProducer mevcut değil, agent_assigned event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka agent_assigned event could not be sent: {e}")
