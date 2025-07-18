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
from starlette.middleware.cors import CORSMiddleware
import uvicorn
from kafka_files.kafkaConsumer import start_agent_online_consumer

# CORS ayarlarını FastAPI app'ine uygula
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_CONFIG["allow_origins"],
    allow_credentials=CORS_CONFIG["allow_credentials"],
    allow_methods=CORS_CONFIG["allow_methods"],
    allow_headers=CORS_CONFIG["allow_headers"],
)

if __name__ == "__main__":
    start_agent_online_consumer()
    uvicorn.run("server:socket_app", host="0.0.0.0", port=8086, reload=True)
