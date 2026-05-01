from llama_index.llms.groq import Groq
import os
def buildLlm():
  return Groq(
    model="openai/gpt-oss-120b",
    temperature=0.1,
    max_tokens=2048,
    api_key=os.environ["groqApiKey"],
  )