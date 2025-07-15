from fastapi import status
from fastapi.responses import JSONResponse

def accepted_response(data=None, message="Accepted"):
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"success": True, "message": message, "data": data}
    )