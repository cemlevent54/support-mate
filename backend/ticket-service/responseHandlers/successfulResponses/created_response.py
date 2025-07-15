from fastapi import status
from fastapi.responses import JSONResponse

def created_response(data=None, message="Created"):
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"success": True, "message": message, "data": data}
    )