import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI
import uvicorn
from config.index import logger, set_language, _, get_default_language, router as config_router, socket_manager
from responseHandlers.successfulResponses.ok_response import ok_response
from fastapi import Depends
from middlewares.auth import get_current_user
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response
from starlette.requests import Request
from starlette.routing import Mount
from routes import api_router

app = FastAPI()
app.include_router(api_router)

# CORS ayarları (gerekirse)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO uygulamasını mount et
app.mount("/ws", socket_manager.app)
logger.info("Socket.IO app mounted at /ws")

def get_lang_param(lang: str = None):
    return lang or get_default_language()

@app.get("/")
def read_root(lang: str = None):
    set_language(get_lang_param(lang))
    logger.info(_("api_started"), extra={"endpoint": "/"})
    data = {"service": "ticket", "status": "running"}
    return ok_response(data=data, message=_("api_running"))



if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8086, reload=True)
