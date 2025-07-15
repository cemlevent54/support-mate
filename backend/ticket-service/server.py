import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI
import uvicorn
from config.index import logger, set_language, _, get_default_language, router as config_router
from responseHandlers.successfulResponses.ok_response import ok_response

app = FastAPI()
app.include_router(config_router)

def get_lang_param(lang: str = None):
    return lang or get_default_language()

@app.get("/")
def read_root(lang: str = None):
    set_language(get_lang_param(lang))
    logger.info(_("api_started"), extra={"endpoint": "/"})
    data = {"service": "ticket", "status": "running"}
    return ok_response(data=data, message=_("api_running"))

if __name__ == "__main__":
    set_language(get_default_language())
    logger.info(_("service_starting"), extra={})
    uvicorn.run("server:app", host="127.0.0.1", port=8086, reload=True, log_config=None, log_level="info")
