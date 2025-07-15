from fastapi import Response, status
from fastapi.responses import JSONResponse

def bad_request_error(message="Bad Request"):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "message": message}
    )