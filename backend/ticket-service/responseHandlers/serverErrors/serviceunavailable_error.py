from fastapi import status
from fastapi.responses import JSONResponse

def service_unavailable_error(message="Service Unavailable"):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"success": False, "message": message, "data": None}
    )