from fastapi import status
from fastapi.responses import JSONResponse

def ok_response(data=None, message="OK"):
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"success": True, "message": message, "data": data}
    )