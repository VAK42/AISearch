from llama_index.core.tools import FunctionTool
from llama_index.core.agent import ReActAgent
from core.ragTool import buildRagTool
from core.ragPipeline import getLlm
import logging
logger = logging.getLogger(__name__)
def buildMcpWebSearchTool() -> FunctionTool:
  def webSearch(query: str) -> str:
    try:
      from ddgs import DDGS
      results = list(DDGS().text(query, max_results=5))
      if not results:
        return "Không Tìm Thấy Kết Quả Trên Web!"
      parts = [f"{r['title']}\n{r['body']}" for r in results]
      logger.info("MCP Web Search: %d Kết Quả Cho '%s'", len(parts), query)
      return "\n\n---\n\n".join(parts)
    except Exception as e:
      logger.error("Lỗi MCP Web Search: %s", str(e))
      return f"Không Thể Tìm Kiếm Web: {str(e)}"
  return FunctionTool.from_defaults(
    fn=webSearch,
    name="fetch",
    description="Searches The Web For Information Using DuckDuckGo. Use This ONLY When documentSearch Returns No Relevant Information From Uploaded Documents!",
  )
async def buildAgent(sessionId: int) -> ReActAgent:
  llm = getLlm()
  ragTool = buildRagTool(sessionId)
  webSearchTool = buildMcpWebSearchTool()
  tools = [ragTool, webSearchTool]
  logger.info("Khởi Tạo Agent Với %d Công Cụ", len(tools))
  return ReActAgent(
    tools=tools,
    llm=llm,
    verbose=True,
    system_prompt=(
      "You Are An Expert AI Knowledge Assistant. Always Follow This Exact Process:\n"
      "STEP 1: ALWAYS Call documentSearch First To Search Uploaded Documents\n"
      "STEP 2: Evaluate The documentSearch Result. If The Result Does NOT Contain Information That Answers The User Question, IMMEDIATELY Call fetch To Search The Web\n"
      "STEP 3: Synthesize A Clear, Structured Answer From The Information Found\n"
      "IMPORTANT: If Document Content Is Unrelated To The Question, You MUST Use fetch Before Concluding No Information Is Available\n"
      "Respond In The Same Language As The User Question!"
      "FORMATTING RULES - STRICTLY FOLLOW:\n"
      "- All Math MUST Use Standard LaTeX Delimiters ONLY\n"
      "- Inline Math: Wrap In \\( ... \\)\n"
      "- Block/Display Math: Wrap In \\[ ... \\]\n"
      "- NEVER Output Raw LaTeX Without Delimiters\n"
      "- NEVER Use $...$ Or $$...$$\n"
      "- NEVER Duplicate Formulas Or Output Garbled Text\n"
      "- NEVER Output Source Document Artifacts Like Trailing ',;' Or '$$'\n"
      "- Tables MUST Use Proper Markdown Format\n"
    ),
  )