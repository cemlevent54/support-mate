from fastapi import status
from fastapi.responses import JSONResponse

def unauthorized_error(message="Unauthorized"):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"success": False, "message": message, "data": None}
    )