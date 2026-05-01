from sentence_transformers import CrossEncoder
import logging
logger = logging.getLogger(__name__)
class GteReranker:
  _instance = None
  def __new__(cls):
    if cls._instance is None:
      logger.info("Đang Tải Mô Hình Reranker GTE Multilingual...")
      cls._instance = CrossEncoder(
        "Alibaba-NLP/gte-multilingual-reranker-base", 
        trust_remote_code=True
      )
      logger.info("Tải Mô Hình Reranker Thành Công")
    return cls._instance
def getReranker():
  return GteReranker()