from fastapi import status
from fastapi.responses import JSONResponse

def conflict_error(message="Conflict"):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"success": False, "message": message, "data": None}
    )