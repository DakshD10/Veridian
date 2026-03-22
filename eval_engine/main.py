from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from routers.evaluate import router as evaluate_router
from routers.agent import router as agent_router

app = FastAPI(title="Veridian Eval Engine")
app.include_router(evaluate_router)
app.include_router(agent_router)

@app.get("/health")
def health():
    return {"status": "ok"}