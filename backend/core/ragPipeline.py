from llama_index.core.vector_stores.types import MetadataFilters, MetadataFilter, FilterOperator
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from core.vectorStore import buildQdrantClient, collectionName
from llama_index.core.node_parser import SentenceSplitter
from core.embeddings import phoBertEmbedding
from core.llm import buildLlm
import logging
import os
logger = logging.getLogger(__name__)
_embedModel = None
_llmModel = None
_qdrantClient = None
def getEmbedModel():
  global _embedModel
  if _embedModel is None:
    _embedModel = phoBertEmbedding()
  return _embedModel
def getLlm():
  global _llmModel
  if _llmModel is None:
    _llmModel = buildLlm()
  return _llmModel
def getQdrantClient():
  global _qdrantClient
  if _qdrantClient is None:
    _qdrantClient = buildQdrantClient()
  return _qdrantClient
def buildIndex():
  Settings.embed_model = getEmbedModel()
  Settings.llm = getLlm()
  Settings.context_window = 128000
  qdrantClient = getQdrantClient()
  vectorStore = QdrantVectorStore(client=qdrantClient, collection_name=collectionName)
  storageContext = StorageContext.from_defaults(vector_store=vectorStore)
  index = VectorStoreIndex.from_vector_store(vector_store=vectorStore, storage_context=storageContext)
  return index
def ingestDocument(filePath: str, docId: int, sessionId: int):
  logger.info("Bắt Đầu Xử Lý Tài Liệu: %s", filePath)
  Settings.embed_model = getEmbedModel()
  Settings.llm = getLlm()
  qdrantClient = getQdrantClient()
  vectorStore = QdrantVectorStore(client=qdrantClient, collection_name=collectionName)
  storageContext = StorageContext.from_defaults(vector_store=vectorStore)
  nodeParser = SentenceSplitter(chunk_size=512, chunk_overlap=64)
  reader = SimpleDirectoryReader(input_files=[filePath])
  documents = reader.load_data()
  for doc in documents:
    doc.metadata["docId"] = str(docId)
    doc.metadata["sessionId"] = str(sessionId)
    doc.metadata["fileName"] = os.path.basename(filePath)
  nodes = nodeParser.get_nodes_from_documents(documents)
  VectorStoreIndex(nodes, storage_context=storageContext)
  logger.info("Hoàn Tất Lập Chỉ Mục: %s Đoạn Văn Bản", len(nodes))