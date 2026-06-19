import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import PORT
from app.database import engine, Base, SessionLocal
from app.models import Customer
from app.database.db_setup import seed_data
from app.database.chroma_setup import setup_chroma
from app.routes import agent, customers, analytics

app = FastAPI(
    title="BFSI Agentic CRM Platform API",
    description="Production-grade agentic workflow API utilizing LangGraph, ChromaDB, and a configurable Gemini API.",
    version="1.0.0"
)

# Configure CORS for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(agent.router)
app.include_router(customers.router)
app.include_router(analytics.router)

@app.on_event("startup")
def on_startup():
    print("[STARTUP] Checking database state...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if DB has customer records; if not, trigger automatic seed
        customer_count = db.query(Customer).count()
        if customer_count == 0:
            print("[STARTUP] Database is empty. Triggering automated seeding of 1000 customers & 10000 transactions...")
            seed_data()
        else:
            print(f"[STARTUP] Database contains {customer_count} customers. Skipping seeding.")
    except Exception as e:
        print(f"[STARTUP ERROR] Database initialization failed: {e}")
    finally:
        db.close()
        
    print("[STARTUP] Checking Vector DB (ChromaDB) state...")
    try:
        # Check collections status or trigger initial vector seed
        # Simply running setup_chroma will build products and template guidelines
        setup_chroma()
    except Exception as e:
        print(f"[STARTUP ERROR] Vector database initialization failed: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "BFSI Agentic CRM Backend",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
