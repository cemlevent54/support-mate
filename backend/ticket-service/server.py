import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config.socketio import socket_app, fastapi_app
from config.cors import CORS_CONFIG
import uvicorn
from kafka_files.kafkaConsumer import start_agent_online_consumer
from config.env import get_default_language
from config.language import set_language
from fastapi.staticfiles import StaticFiles

if __name__ == "__main__":
    set_language(get_default_language())
    import logging
    from config.language import _
    logging.info(_(f"config.language.default_language").format(lang=get_default_language()))
    
    start_agent_online_consumer()

    # Statik dosya servisi (uploads klasörü)
    fastapi_app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    uvicorn.run("server:socket_app", host="0.0.0.0", port=8086, reload=True)
