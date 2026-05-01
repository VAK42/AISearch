from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from db.models import getDb, Document, SessionLocal
from core.ragPipeline import ingestDocument
from sqlalchemy.orm import Session
import threading
import logging
import shutil
import os
logger = logging.getLogger(__name__)
documentRouter = APIRouter(prefix="/api/v1/documents", tags=["Tài Liệu"])
uploadDir = os.path.join(os.path.dirname(__file__), "..", "uploads")
allowedExtensions = {".pdf", ".docx", ".pptx", ".txt"}
def runIngestion(filePath: str, docId: int, sessionId: int):
  db = SessionLocal()
  try:
    ingestDocument(filePath, docId, sessionId)
    doc = db.query(Document).filter(Document.id == docId).first()
    if doc:
      doc.uploadStatus = "done"
      db.commit()
      logger.info("Lập Chỉ Mục Thành Công: %s", doc.fileName)
  except Exception as e:
    doc = db.query(Document).filter(Document.id == docId).first()
    if doc:
      doc.uploadStatus = "error"
      db.commit()
    logger.error("Lỗi Lập Chỉ Mục: %s", str(e))
  finally:
    db.close()
@documentRouter.post("/uploadFile")
async def uploadFile(
  file: UploadFile = File(...),
  sessionId: int = Form(...),
  db: Session = Depends(getDb)
):
  ext = os.path.splitext(file.filename)[1].lower()
  if ext not in allowedExtensions:
    raise HTTPException(status_code=400, detail="Định Dạng Tệp Không Được Hỗ Trợ")
  os.makedirs(uploadDir, exist_ok=True)
  sessionUploadDir = os.path.join(uploadDir, str(sessionId))
  os.makedirs(sessionUploadDir, exist_ok=True)
  savePath = os.path.join(sessionUploadDir, file.filename)
  with open(savePath, "wb") as buffer:
    shutil.copyfileobj(file.file, buffer)
  doc = Document(fileName=file.filename, fileType=ext.lstrip("."), filePath=savePath, uploadStatus="indexing", sessionId=sessionId)
  db.add(doc)
  db.commit()
  db.refresh(doc)
  logger.info("Tải Lên Tệp Thành Công: %s", file.filename)
  thread = threading.Thread(target=runIngestion, args=(savePath, doc.id, sessionId))
  thread.daemon = True
  thread.start()
  return {"docId": doc.id, "fileName": doc.fileName, "uploadStatus": doc.uploadStatus}
@documentRouter.get("/listAll")
async def listAllDocuments(sessionId: int, db: Session = Depends(getDb)):
  docs = db.query(Document).filter(Document.sessionId == sessionId).all()
  return [
    {"id": d.id, "fileName": d.fileName, "fileType": d.fileType, "uploadStatus": d.uploadStatus, "uploadedAt": d.uploadedAt}
    for d in docs
  ]