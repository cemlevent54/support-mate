import platform
import os
import time
from datetime import datetime
from config.database import get_db_status
from config.redis import get_redis_status
from config.kafka import get_kafka_status
try:
    import psutil
except ImportError:
    psutil = None

START_TIME = time.time()

# Ortam değişkeninden env al
ENV = os.getenv('ENV', 'development')

def get_memory():
    if psutil:
        process = psutil.Process(os.getpid())
        mem = process.memory_info()
        return {
            "rss": mem.rss,
            "heapTotal": mem.vms,
            "heapUsed": mem.rss,  # Python'da heap ayrımı yok, rss kullanılabilir
            "external": getattr(mem, 'shared', 0)
        }
    else:
        return {
            "rss": 0,
            "heapTotal": 0,
            "heapUsed": 0,
            "external": 0
        }

def health_check():
    now = datetime.utcnow().isoformat() + 'Z'
    uptime = time.time() - START_TIME
    return {
        "status": "up",
        "timestamp": now,
        "app": {
            "node": platform.python_version(),
            "env": ENV
        },
        "database": get_db_status(),
        "redis": get_redis_status(),
        "kafka": get_kafka_status(),
        "memory": get_memory(),
        "uptimeSeconds": uptime
    }
