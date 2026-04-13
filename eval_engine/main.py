from dotenv import load_dotenv
import uvicorn
load_dotenv()

from fastapi import FastAPI
from routers.evaluate import router as evaluate_router
from routers.agent import router as agent_router
from routers.suite_generate import router as suite_generate_router
from routers.red_team import router as red_team_router
from provider_pool import provider_health

app = FastAPI(title="Veridian Eval Engine")
app.include_router(evaluate_router)
app.include_router(agent_router)
app.include_router(suite_generate_router)
app.include_router(red_team_router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "providers": provider_health(),
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
