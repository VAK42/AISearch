from llama_index.core.embeddings import BaseEmbedding
from sentence_transformers import SentenceTransformer
from pydantic import PrivateAttr
from typing import List
import logging
logger = logging.getLogger(__name__)
class GteEmbedding(BaseEmbedding):
  _model: SentenceTransformer = PrivateAttr()
  def __init__(self, **kwargs):
    super().__init__(**kwargs)
    logger.info("Đang Tải Mô Hình Embeddings GTE Multilingual...")
    self._model = SentenceTransformer(
      "Alibaba-NLP/gte-multilingual-base", 
      trust_remote_code=True
    )
    logger.info("Tải Mô Hình Embeddings Thành Công")
  def _get_query_embedding(self, query: str) -> List[float]:
    return self._model.encode(query).tolist()
  def _get_text_embedding(self, text: str) -> List[float]:
    return self._model.encode(text).tolist()
  def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
    return [self._model.encode(t).tolist() for t in texts]
  async def _aget_query_embedding(self, query: str) -> List[float]:
    return self._get_query_embedding(query)
  async def _aget_text_embedding(self, text: str) -> List[float]:
    return self._get_text_embedding(text)
def phoBertEmbedding():
  return GteEmbedding()