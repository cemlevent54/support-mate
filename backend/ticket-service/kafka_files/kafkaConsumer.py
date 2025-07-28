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
                        logger.info(f'[KAFKA] agent_online event received for agentId={agent_id}')
                        
                        # Async fonksiyonu await et
                        logger.info(f'[KAFKA] Calling assign_agent_to_pending_ticket for agentId={agent_id}')
                        try:
                            asyncio.run(ticket_service.assign_agent_to_pending_ticket(agent_id))
                            logger.info(f'[KAFKA] assign_agent_to_pending_ticket completed successfully')
                        except Exception as assign_error:
                            logger.error(f'[KAFKA] assign_agent_to_pending_ticket failed: {assign_error}', exc_info=True)
                except Exception as e:
                    logger.error(f'[KAFKA] Error processing message: {e}', exc_info=True)
        except Exception as e:
            logger.error(f'[KAFKA] Consumer crashed, retrying in 5s: {e}', exc_info=True)
            time.sleep(5)

def start_agent_online_consumer():
    t = threading.Thread(target=agent_online_consumer_loop, daemon=True)
    t.start()
    logger.info('[KAFKA] agent-online consumer thread started') 