from fastapi.responses import JSONResponse

def api_success(data=None, message="Success", status=200):
    return JSONResponse(
        status_code=status,
        content={"success": True, "message": message, "data": data}
    )