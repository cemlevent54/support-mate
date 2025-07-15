from fastapi import status
from fastapi.responses import JSONResponse

def internal_server_error(message="Internal Server Error"):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": message, "data": None}
    )