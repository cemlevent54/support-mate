from fastapi import status
from fastapi.responses import Response

def no_content_response():
    return Response(status_code=status.HTTP_204_NO_CONTENT)