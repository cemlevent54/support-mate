import os
from dotenv import load_dotenv
import redis
from config.logger import get_logger
from config.language import _

logger = get_logger()

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

REDIS_ONLINE_QUEUE = 'online_users_queue'

# Bağlantı
#_redis_url = os.getenv('REDIS_URL')
_redis_url = 'redis://127.0.0.1:6379'
r = redis.from_url(_redis_url)

def get_redis_url():
    return _redis_url

def get_redis_status():
    url = get_redis_url()
    try:
        r.ping()
        logger.success(_("config.redis.redis_connection_success"))
        status = "up"
    except Exception as e:
        logger.error(_("config.redis.redis_connection_error", error=str(e)))
        status = "down"
    return {
        "status": status,
        "url": url
    }

# Online temsilci ekle
def add_online_agent(user_id):
    if r:
        r.rpush(REDIS_ONLINE_QUEUE, user_id)
        logger.info(f"[REDIS] Online temsilci eklendi: {user_id}")

# Online temsilci çıkar
# (offline olduğunda tamamen sil)
def remove_online_agent(user_id):
    if r:
        r.lrem(REDIS_ONLINE_QUEUE, 0, user_id)
        logger.info(f"[REDIS] Online temsilci çıkarıldı: {user_id}")

# Tüm online temsilcileri getir
def get_all_online_agents():
    if r:
        return r.lrange(REDIS_ONLINE_QUEUE, 0, -1)
    return []

# Sıradaki agentı çekip sona ekle (round robin)
def select_and_rotate_agent():
    if r:
        agent_id = r.lpop(REDIS_ONLINE_QUEUE)
        logger.info(f"[REDIS] Temsilci seçildi: {agent_id}")
        if agent_id:
            r.rpush(REDIS_ONLINE_QUEUE, agent_id)
            logger.info(f"[REDIS] Temsilci sona eklendi (round robin): {agent_id}")
            return agent_id.decode() if isinstance(agent_id, bytes) else agent_id
    return None
