from fastapi import status
from fastapi.responses import JSONResponse

def too_many_requests_error(message="Too Many Requests"):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"success": False, "message": message, "data": None}
    )