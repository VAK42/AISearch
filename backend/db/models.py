from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
from sqlalchemy import event
import os
Base = declarative_base()
class ChatSession(Base):
  __tablename__ = "chatSessions"
  id = Column(Integer, primary_key=True, index=True)
  title = Column(String, nullable=False)
  createdAt = Column(DateTime, default=datetime.utcnow)
  documents = relationship("Document", back_populates="session", cascade="all, delete-orphan")
  messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
class Document(Base):
  __tablename__ = "documents"
  id = Column(Integer, primary_key=True, index=True)
  sessionId = Column(Integer, ForeignKey("chatSessions.id", ondelete="CASCADE"), nullable=True)
  fileName = Column(String, nullable=False)
  fileType = Column(String, nullable=False)
  filePath = Column(String, nullable=False)
  uploadStatus = Column(String, default="pending")
  uploadedAt = Column(DateTime, default=datetime.utcnow)
  session = relationship("ChatSession", back_populates="documents")
class Message(Base):
  __tablename__ = "messages"
  id = Column(Integer, primary_key=True, index=True)
  sessionId = Column(Integer, ForeignKey("chatSessions.id", ondelete="CASCADE"), nullable=False)
  role = Column(String, nullable=False)
  content = Column(Text, nullable=False)
  sourceNodes = Column(Text, nullable=True)
  createdAt = Column(DateTime, default=datetime.utcnow)
  session = relationship("ChatSession", back_populates="messages")
dbPath = os.path.join(os.path.dirname(__file__), "..", "ragDatabase.db")
dbUrl = f"sqlite:///{os.path.abspath(dbPath)}"
engine = create_engine(dbUrl, connect_args={"check_same_thread": False})
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
  cursor = dbapi_connection.cursor()
  cursor.execute("PRAGMA foreign_keys=ON")
  cursor.close()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
def initDb():
  Base.metadata.create_all(bind=engine)
def getDb():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()