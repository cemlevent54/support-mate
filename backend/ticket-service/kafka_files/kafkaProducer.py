import json
import logging
from kafka import KafkaProducer
from config.kafka import get_kafka_brokers
from string import Template
from utils.fileGenerator import create_file_content, read_mail_template
from datetime import datetime

logger = logging.getLogger(__name__)

TICKET_CREATED_TOPIC = "ticket-created"
AGENT_ASSIGNED_TOPIC = "agent-assigned"
TASK_ASSIGNED_TOPIC = "task-assigned"
TASK_DONE_TOPIC = "task-done"
TASK_APPROVED_TOPIC = "task-approved"
TASK_REJECTED_TOPIC = "task-rejected"
DASHBOARD_STATISTICS_TOPIC = "dashboard-statistics"

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
        # Dil kontrolü - geçersiz değerler için varsayılan 'tr' kullan
        if not language or language not in ['tr', 'en']:
            language = 'tr'
        logger.info(f"Final language for Kafka event: {language}")
        
        # HTML şablonunu oku ve değişkenleri doldur
        html_content = ""
        if html_path:
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_template = Template(f.read())
                html_content = html_template.safe_substitute(
                    firstName=user.get("firstName", ""),
                    ticketTitle=ticket.get("title", ""),
                    ticketId=ticket.get("id", "")
                )
            except Exception as e:
                logger.error(f"HTML şablonu okunamadı: {e}")
                html_content = ""
        event = {
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "language": language,
            "ticketId": ticket.get("id", ""),
            "ticketTitle": ticket.get("title", ""),
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
        logger.info(f"[KAFKA][AGENT-ASSIGNED] Starting event processing...")
        logger.info(f"[KAFKA][AGENT-ASSIGNED] event_data type: {type(event_data)}")
        logger.info(f"[KAFKA][AGENT-ASSIGNED] event_data content: {event_data}")
        
        # event_data'yı JSON serializable hale getir
        import json
        logger.info(f"[KAFKA][AGENT-ASSIGNED] Attempting JSON serialization...")
        try:
            json_str = json.dumps(event_data, default=str)
            logger.info(f"[KAFKA][AGENT-ASSIGNED] JSON serialization successful: {json_str}")
            serializable_event = json.loads(json_str)
            logger.info(f"[KAFKA][AGENT-ASSIGNED] JSON deserialization successful")
        except Exception as json_error:
            logger.error(f"[KAFKA][AGENT-ASSIGNED] JSON serialization failed: {json_error}")
            raise json_error
            
        logger.info(f"[KAFKA][AGENT-ASSIGNED] Sending to Kafka: {serializable_event}")
        producer = get_producer()
        if producer:
            logger.info(f"[KAFKA][AGENT-ASSIGNED] Producer found, sending event...")
            producer.send(AGENT_ASSIGNED_TOPIC, serializable_event)
            producer.flush()
            logger.info(f"[KAFKA][AGENT-ASSIGNED] Event sent successfully: {serializable_event.get('ticket', {}).get('id')}")
        else:
            logger.error("[KAFKA][AGENT-ASSIGNED] KafkaProducer mevcut değil, agent_assigned event gönderilemedi.")
    except Exception as e:
        logger.error(f"[KAFKA][AGENT-ASSIGNED] Event processing failed: {e}", exc_info=True)

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

def send_task_done_event(task, user, html_path=None, language='tr', role='customer'):
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
            "html": html_content,
            "role": role
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

def send_dashboard_statistics_event(email, export_data, language='tr', file_type='json', file_name=None):
    try:
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Starting event processing...")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Email: {email}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Language: {language}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] File type: {file_type}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Export data keys: {list(export_data.keys()) if export_data else 'None'}")
        
        # Tarih ve saat bilgisiyle dosya ismi oluştur
        if not file_name:
            now = datetime.now()
            if file_type == "excel":
                ext = "xlsx"
            else:
                ext = file_type
            file_name = f"{now.strftime('%d_%m_%Y_%H_%M_%S')}_dashboard_export.{ext}"
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Generated file name: {file_name}")
        
        # Mail template'ini oku
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Reading mail template for language: {language}")
        html_content = read_mail_template(language)
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Mail template length: {len(html_content) if html_content else 0}")
        
        # Dosya içeriğini oluştur
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Creating file content for type: {file_type} with language: {language}")
        file_base64 = create_file_content(export_data, file_type, language)
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] File content length: {len(file_base64) if file_base64 else 0}")
        
        event = {
            "email": email,
            "language": language,
            "fileName": file_name,
            "fileType": file_type,
            "exportData": export_data,
            "html": html_content,
            "fileBase64": file_base64
        }
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event prepared successfully")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event email: {event['email']}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event file name: {event['fileName']}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event file type: {event['fileType']}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event html length: {len(event['html']) if event['html'] else 0}")
        logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event file base64 length: {len(event['fileBase64']) if event['fileBase64'] else 0}")
        
        producer = get_producer()
        if producer:
            logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Producer found, sending event to topic: {DASHBOARD_STATISTICS_TOPIC}")
            producer.send(DASHBOARD_STATISTICS_TOPIC, event)
            producer.flush()
            logger.info(f"[KAFKA][DASHBOARD-STATISTICS] Event sent successfully to Kafka")
        else:
            logger.error("[KAFKA][DASHBOARD-STATISTICS] KafkaProducer mevcut değil, event gönderilemedi.")
    except Exception as e:
        logger.error(f"[KAFKA][DASHBOARD-STATISTICS] Event could not be sent: {e}")
        logger.error(f"[KAFKA][DASHBOARD-STATISTICS] Exception type: {type(e)}")
        import traceback
        logger.error(f"[KAFKA][DASHBOARD-STATISTICS] Traceback: {traceback.format_exc()}")
