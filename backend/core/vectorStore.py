from qdrant_client.models import Distance, VectorParams
from qdrant_client import QdrantClient
import logging
import os
logger = logging.getLogger(__name__)
qdrantPath = os.path.join(os.path.dirname(__file__), "..", "qdrantStorage")
collectionName = "ragDocuments"
vectorDimension = 768
def buildQdrantClient() -> QdrantClient:
  client = QdrantClient(path=os.path.abspath(qdrantPath))
  existing = [c.name for c in client.get_collections().collections]
  if collectionName not in existing:
    client.create_collection(
      collection_name=collectionName,
      vectors_config=VectorParams(size=vectorDimension, distance=Distance.COSINE),
    )
    logger.info("Tạo Bộ Sưu Tập Qdrant Thành Công: %s", collectionName)
  return client