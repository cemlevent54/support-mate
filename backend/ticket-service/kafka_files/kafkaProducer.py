import json
import logging
from kafka import KafkaProducer
from config.kafka import get_kafka_brokers
from string import Template

logger = logging.getLogger(__name__)

TICKET_CREATED_TOPIC = "ticket-created"
AGENT_ASSIGNED_TOPIC = "agent-assigned"
TASK_ASSIGNED_TOPIC = "task-assigned"
TASK_DONE_TOPIC = "task-done"
TASK_APPROVED_TOPIC = "task-approved"
TASK_REJECTED_TOPIC = "task-rejected"

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

def send_agent_assigned_event(event_data):
    try:
        logger.info(f"Sending agent_assigned event to Kafka: {event_data}")
        producer = get_producer()
        if producer:
            producer.send(AGENT_ASSIGNED_TOPIC, event_data)
            producer.flush()
            logger.info(f"agent_assigned event Kafka'ya gönderildi: {event_data.get('ticket', {}).get('id')}")
        else:
            logger.error("KafkaProducer mevcut değil, agent_assigned event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka agent_assigned event could not be sent: {e}")

def send_task_assigned_event(task, user, html_path=None, language='tr'):
    try:
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=user.get("firstName", ""),
                    taskTitle=task.title,
                    taskId=task.id
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        event = {
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "language": language,
            "taskId": task.id,
            "taskTitle": task.title,
            "html": html_content
        }
        logger.info(f"Sending task_assigned event to Kafka: {event}")
        producer = get_producer()
        if producer:
            producer.send(TASK_ASSIGNED_TOPIC, event)
            producer.flush()
        else:
            logger.error("KafkaProducer mevcut değil, event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka task_assigned event could not be sent: {e}")

def send_task_done_event(task, user, html_path=None, language='tr'):
    try:
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=user.get("firstName", ""),
                    taskTitle=task.title,
                    taskId=task.id
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        event = {
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "language": language,
            "taskId": task.id,
            "taskTitle": task.title,
            "html": html_content
        }
        logger.info(f"Sending task_done event to Kafka: {event}")
        producer = get_producer()
        if producer:
            producer.send(TASK_DONE_TOPIC, event)
            producer.flush()
        else:
            logger.error("KafkaProducer mevcut değil, event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka task_done event could not be sent: {e}")

def send_task_approved_event(task, user, html_path=None, language='tr'):
    try:
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=user.get("firstName", ""),
                    taskTitle=task.title,
                    taskId=task.id
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        event = {
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "language": language,
            "taskId": task.id,
            "taskTitle": task.title,
            "html": html_content
        }
        logger.info(f"Sending task_approved event to Kafka: {event}")
        producer = get_producer()
        if producer:
            producer.send(TASK_APPROVED_TOPIC, event)
            producer.flush()
        else:
            logger.error("KafkaProducer mevcut değil, event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka task_approved event could not be sent: {e}")

def send_task_rejected_event(task, user, html_path=None, language='tr'):
    try:
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=user.get("firstName", ""),
                    taskTitle=task.title,
                    taskId=task.id
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        event = {
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "language": language,
            "taskId": task.id,
            "taskTitle": task.title,
            "html": html_content
        }
        logger.info(f"Sending task_rejected event to Kafka: {event}")
        producer = get_producer()
        if producer:
            producer.send(TASK_REJECTED_TOPIC, event)
            producer.flush()
        else:
            logger.error("KafkaProducer mevcut değil, event gönderilemedi.")
    except Exception as e:
        logger.error(f"Kafka task_rejected event could not be sent: {e}")
