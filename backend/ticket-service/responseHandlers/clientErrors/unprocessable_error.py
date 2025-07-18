from fastapi import status
from fastapi.responses import JSONResponse

def unprocessable_error(message="Unprocessable Entity"):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": message, "data": None}
    )