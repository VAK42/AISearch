from fastapi.middleware.cors import CORSMiddleware
from api.documentRouter import documentRouter
from api.chatRouter import chatRouter
from dotenv import load_dotenv
from db.models import initDb
from fastapi import FastAPI
import logging
import sys
import io
logStream = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)
logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s - %(levelname)s - %(message)s",
  handlers=[logging.StreamHandler(logStream)],
)
load_dotenv()
initDb()
app = FastAPI(title="RAG", version="1.0.0")
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
app.include_router(documentRouter)
app.include_router(chatRouter)
@app.get("/")
def root():
  return {"message": "RAG"}