from fastapi.responses import JSONResponse

def api_error(error=None, message="Error", status=500):
    return JSONResponse(
        status_code=status,
        content={"success": False, "message": message, "error": error}
    )