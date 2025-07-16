from fastapi import Response, status
from fastapi.responses import JSONResponse

def bad_request_error(message="Bad Request"):
    return {"success": False, "message": message, "data": None}