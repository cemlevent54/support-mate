from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Ticket Service API çalışıyor"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8086, reload=True)
