from llama_index.core.vector_stores.types import MetadataFilters, MetadataFilter, FilterOperator
from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from core.ragPipeline import getEmbedModel, getQdrantClient
from llama_index.core.tools import FunctionTool
from core.vectorStore import collectionName
from core.reranker import getReranker
from difflib import SequenceMatcher
import logging
logger = logging.getLogger(__name__)
def buildRagTool(sessionId: int) -> FunctionTool:
  def documentSearch(query: str) -> str:
    Settings.embed_model = getEmbedModel()
    qdrantClient = getQdrantClient()
    vectorStore = QdrantVectorStore(client=qdrantClient, collection_name=collectionName)
    storageContext = StorageContext.from_defaults(vector_store=vectorStore)
    index = VectorStoreIndex.from_vector_store(
      vector_store=vectorStore,
      storage_context=storageContext,
    )
    filters = MetadataFilters(filters=[
      MetadataFilter(key="sessionId", value=str(sessionId), operator=FilterOperator.EQ)
    ])
    retriever = index.as_retriever(similarity_top_k=15, filters=filters)
    rawNodes = retriever.retrieve(query)
    if not rawNodes:
      logger.info("RAG: Không Tìm Thấy Tài Liệu Phù Hợp")
      return "Không Tìm Thấy Thông Tin Trong Tài Liệu!"
    reranker = getReranker()
    pairs = [[query, n.get_content()] for n in rawNodes]
    scores = reranker.predict(pairs)
    for node, score in zip(rawNodes, scores):
      node.score = float(score)
    rawNodes.sort(key=lambda x: x.score, reverse=True)
    for i, n in enumerate(rawNodes[:10]):
      preview = n.get_content()[:100].replace("\n", " ")
      logger.info("Rerank %d: Score=%.4f: %s...", i, n.score, preview)
    unique = []
    for node in rawNodes:
      text = node.get_content()
      isDuplicate = any(
        SequenceMatcher(None, text[:300], k.get_content()[:300]).ratio() > 0.85
        for k in unique
      )
      if not isDuplicate:
        unique.append(node)
    finalNodes = unique[:5]
    logger.info("RAG: %d Raw -> %d Reranked -> %d Final", len(rawNodes), len(rawNodes), len(finalNodes))
    return "\n\n---\n\n".join(n.get_content() for n in finalNodes)
  logger.info("RAG Tool Đã Khởi Tạo Cho Phiên: %d", sessionId)
  return FunctionTool.from_defaults(
    fn=documentSearch,
    name="documentSearch",
    description="Searches Uploaded Documents Using Semantic Retrieval, Reranking & Deduplication. Always Call This First When The User Asks About Uploaded Files Or Document Content!",
  )