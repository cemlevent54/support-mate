import os
from dotenv import load_dotenv
import redis
from config.logger import get_logger
from config.language import _

logger = get_logger()

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_redis_url():
    return os.getenv('REDIS_URL')

def get_redis_status():
    url = get_redis_url()
    try:
        r = redis.from_url(url)
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
