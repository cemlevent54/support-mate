import json
import time
import threading
import asyncio
from services.TicketService import TicketService
import logging
from config.kafka import get_kafka_consumer

logger = logging.getLogger(__name__)

ticket_service = TicketService()

def agent_online_consumer_loop():
    while True:
        try:
            consumer = get_kafka_consumer()
            logger.info('[KAFKA] agent-events consumer started')
            for message in consumer:
                try:
                    logger.info(f'[KAFKA] Raw message received: {message.value}')
                    event = json.loads(message.value)
                    logger.info(f'[KAFKA] Parsed event: {event}')
                    
                    if (
                        event.get('type') == 'agent-online'
                        or event.get('event') == 'agent_online'
                    ):
                        agent_id = event.get('agentId')
                        agent_token = event.get('agentToken')  # agentToken'ı al
                        logger.info(f'[KAFKA] agent_online event received for agentId={agent_id}, token={agent_token}')
                        
                        # Token kontrolü
                        if not agent_token:
                            logger.warning(f'[KAFKA] agent_online event received but agentToken is None for agentId={agent_id}')
                            continue
                        
                        # Async fonksiyonu await et
                        logger.info(f'[KAFKA] Calling assign_agent_to_pending_ticket for agentId={agent_id} with token')
                        try:
                            asyncio.run(ticket_service.assign_agent_to_pending_ticket(agent_id, agent_token))
                            logger.info(f'[KAFKA] assign_agent_to_pending_ticket completed successfully for agentId={agent_id}')
                        except Exception as e:
                            logger.error(f'[KAFKA] Error in assign_agent_to_pending_ticket for agentId={agent_id}: {e}')
                    else:
                        logger.info(f'[KAFKA] Unknown event type: {event.get("type") or event.get("event")}')
                except Exception as e:
                    logger.error(f'[KAFKA] Error processing message: {e}', exc_info=True)
        except Exception as e:
            logger.error(f'[KAFKA] Consumer crashed, retrying in 5s: {e}', exc_info=True)
            time.sleep(5)

def start_agent_online_consumer():
    t = threading.Thread(target=agent_online_consumer_loop, daemon=True)
    t.start()
    logger.info('[KAFKA] agent-online consumer thread started') 