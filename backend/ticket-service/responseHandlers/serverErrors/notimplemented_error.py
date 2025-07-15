from fastapi import status
from fastapi.responses import JSONResponse

def not_implemented_error(message="Not Implemented"):
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"success": False, "message": message, "data": None}
    )