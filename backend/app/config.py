import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./banking.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
PORT = int(os.getenv("PORT", "8000"))
USE_HF_API = os.getenv("USE_HF_API", "false").lower() == "true"
HF_API_KEY = os.getenv("HF_API_KEY", "")
HF_MODEL = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")

USE_GROQ_API = os.getenv("USE_GROQ_API", "false").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


# Verify key configuration
if not GEMINI_API_KEY and not USE_HF_API and not USE_GROQ_API:
    print(f"[WARNING] GEMINI_API_KEY is not set and external APIs (HF, Groq) are not active. Agent workflow may fall back to local or mock.")
elif USE_GROQ_API and not GROQ_API_KEY:
    print(f"[WARNING] USE_GROQ_API is true but GROQ_API_KEY is empty!")

