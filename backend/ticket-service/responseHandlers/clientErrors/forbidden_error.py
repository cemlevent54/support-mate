from fastapi import status
from fastapi.responses import JSONResponse

def forbidden_error(message="Forbidden"):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"success": False, "message": message, "data": None}
    )