from fastapi import status
from fastapi.responses import JSONResponse

def not_found_error(message="Not Found"):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "message": message, "data": None}
    )