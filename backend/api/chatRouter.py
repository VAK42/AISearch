from fastapi import APIRouter, Depends, HTTPException
from db.models import getDb, ChatSession, Message
from sqlalchemy.orm import Session
from core.agent import buildAgent
from pydantic import BaseModel
import logging
import json
logger = logging.getLogger(__name__)
chatRouter = APIRouter(prefix="/api/v1/chat", tags=["Hội Thoại"])
class sendQueryRequest(BaseModel):
  sessionId: int
  messageText: str
class renameSessionRequest(BaseModel):
  title: str
@chatRouter.post("/sendQuery")
async def sendQuery(body: sendQueryRequest, db: Session = Depends(getDb)):
  session = db.query(ChatSession).filter(ChatSession.id == body.sessionId).first()
  if not session:
    raise HTTPException(status_code=404, detail="Không Tìm Thấy Phiên Hội Thoại")
  userMsg = Message(sessionId=body.sessionId, role="user", content=body.messageText)
  db.add(userMsg)
  db.commit()
  logger.info("Nhận Câu Hỏi: %s", body.messageText)
  agent = await buildAgent(body.sessionId)
  handler = agent.run(user_msg=body.messageText)
  agentOutput = await handler
  answer = str(agentOutput.response.content).strip()
  try:
    usedTools = [tc.tool_name for tc in (agentOutput.tool_calls or [])]
  except Exception:
    usedTools = []
  usedMcp = any("fetch" in t for t in usedTools)
  source = "MCP" if usedMcp else "RAG"
  logger.info("Phản Hồi Agent %s: %s", source, answer[:100])
  assistantMsg = Message(
    sessionId=body.sessionId,
    role="assistant",
    content=answer,
    sourceNodes=json.dumps([{"source": source}], ensure_ascii=False),
  )
  db.add(assistantMsg)
  db.commit()
  return {"answer": answer, "source": source, "sourceNodes": []}
@chatRouter.post("/createSession")
async def createSession(db: Session = Depends(getDb)):
  session = ChatSession(title="Phiên Hội Thoại Mới")
  db.add(session)
  db.commit()
  db.refresh(session)
  return {"sessionId": session.id, "title": session.title, "createdAt": session.createdAt}
@chatRouter.get("/listAll")
async def listAllSessions(db: Session = Depends(getDb)):
  sessions = db.query(ChatSession).order_by(ChatSession.createdAt.desc()).all()
  return [{"sessionId": s.id, "title": s.title, "createdAt": s.createdAt} for s in sessions]
@chatRouter.patch("/rename/{sessionId}")
async def renameSession(sessionId: int, body: renameSessionRequest, db: Session = Depends(getDb)):
  session = db.query(ChatSession).filter(ChatSession.id == sessionId).first()
  if not session:
    raise HTTPException(status_code=404, detail="Không Tìm Thấy")
  session.title = body.title
  db.commit()
  return {"sessionId": sessionId, "title": session.title}
@chatRouter.delete("/delete/{sessionId}")
async def deleteSession(sessionId: int, db: Session = Depends(getDb)):
  session = db.query(ChatSession).filter(ChatSession.id == sessionId).first()
  if not session:
    raise HTTPException(status_code=404, detail="Không Tìm Thấy")
  db.delete(session)
  db.commit()
  return {"message": "Xóa Thành Công"}
@chatRouter.get("/history/{sessionId}")
async def getChatHistory(sessionId: int, db: Session = Depends(getDb)):
  messages = db.query(Message).filter(Message.sessionId == sessionId).order_by(Message.createdAt).all()
  return {
    "messages": [
      {"id": m.id, "role": m.role, "content": m.content, "sourceNodes": json.loads(m.sourceNodes or "[]"), "createdAt": m.createdAt}
      for m in messages
    ],
  }