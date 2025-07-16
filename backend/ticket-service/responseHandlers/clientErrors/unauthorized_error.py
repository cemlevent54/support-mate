from fastapi import status
from fastapi.responses import JSONResponse

def unauthorized_error(message="Unauthorized"):
    return {"success": False, "message": message, "data": None}