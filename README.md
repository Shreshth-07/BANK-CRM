# AURA: Agentic AI Platform for Banking CRM

Aura is a production-grade, multi-agent AI system designed for BFSI Relationship Managers (RMs). It automates customer profile and transactional analysis, estimates product conversion probability, checks eligibility rules using a vector-embedded product catalog, drafts personalized, regulation-compliant outreach messages, and compiles comprehensive campaign dossiers.

Developed with **LangGraph**, **FastAPI**, **Next.js**, **ChromaDB**, and a configurable LLM provider support featuring **Groq API** (e.g., `llama-3.3-70b-versatile`), **Gemini API**, or **Hugging Face Serverless API** models.

---


## 1. Problem Statement

Modern retail banks process vast amounts of customer data across demographic registers, transaction ledgers, and CRM communication logs. Relationship Managers (RMs) lack automated, semantic tools to instantly identify high-value targets for specific loan or wealth product campaigns. Finding the right customers, predicting their conversion likelihood based on financial behaviors, verifying compliance rules, and drafting customized WhatsApp messages typically takes hours of manual correlation.

**AURA** solves this by introducing a sequential multi-agent workflow that acts as a cognitive pipeline to autonomously analyze customer telemetry, assess value/conversion scores, map bank policies, and personalize outreach compliance-first.

---

## 2. System Architecture

The application comprises three operational layers:
1. **Frontend Dashboard (Next.js & Tailwind CSS)**: Interactive UI featuring query entry, real-time agent execution visualizers, candidates list tables, SVG gauges for analytics, and a terminal console showing audit trails and thought processes.
2. **Backend Server (FastAPI)**: Rest APIs triggering the LangGraph state machine, serving customer dossiers, and executing database calculations.
3. **Agent layer (LangGraph)**: 6 specialized agents coordinating through a unified state and calling database and vector-database tools.

### Agent Workflow
```mermaid
graph LR
    Query[RM Query] --> Planner[1. Planner Agent]
    Planner --> CI[2. Customer Intel]
    CI --> CP[3. Conversion Predictor]
    CP --> PR[4. Product Matcher]
    PR --> PA[5. Personalization Agent]
    PA --> SU[6. RM Summary Agent]
    SU --> Dossier[RM Campaign Dossier]
```

---

## 3. Agent Design

The system implements 6 collaborative agents:

| Agent | Responsibilities | Core Logic |
| :--- | :--- | :--- |
| **1. Planner Agent** | Parsers user query, detects target campaign intent, and sets demographic search filters. | LLM parsing into structured JSON query blocks. |
| **2. Customer Intel** | Queries relational tables and ChromaDB vector logs to build a candidate list. Computes average assets and relationship parameters. | Relational queries + Vector search + Value scoring algorithm. |
| **3. Conversion Agent** | Calculates probability score based on transaction records. | Rule-based scoring modifiers combined with LLM rationale validation. |
| **4. Product Matcher** | Performs similarity search on policy catalogs to map credit/account eligibility. | Vector retrieval of rules (ChromaDB) + LLM criteria mapping. |
| **5. Personalization Agent** | Generates outreach copy tailored for WhatsApp and Email formats. | LLM generation following strict BFSI compliance guidelines. |
| **6. RM Summary Agent** | Aggregates all logs and ranks candidates. Compiles executive reports. | Analytical sorting + LLM campaign summarization. |

---

## 4. Tool Design

The agents utilize specialized Python tools:
* **Customer DB Search Tool**: Filters customer IDs based on age, income thresholds, or city limits.
* **Transaction Analytics Tool**: Computes average monthly balances, confirms monthly salary credits, and evaluates savings rate.
* **CRM Log Retrieval Tool**: Queries customer history to identify previous product inquiries.
* **Vector DB Product Search Tool**: Queries ChromaDB `products` collection to check eligibility sheets.
* **Vector DB CRM Note Search Tool**: Queries ChromaDB `crm_notes` collection to semantically identify customers who expressed interest in credit lines or cards.

---

## 5. Database Schema

AURA maintains two data layers:

### Relational DB Schema (SQLite/PostgreSQL)
* **`customers`**: Demographic details (`customer_id`, `name`, `age`, `city`, `occupation`, `annual_income`, `relationship_years`).
* **`transactions`**: Credit and debit logs (`txn_id`, `customer_id`, `amount`, `txn_type`, `txn_date`, `category` - e.g. Salary, Rent, Groceries, Utilities).
* **`crm_interactions`**: Conversational interaction logs (`interaction_id`, `customer_id`, `interaction_type`, `notes`, `timestamp`).
* **`loan_history`**: Past and active loans (`loan_id`, `customer_id`, `loan_type`, `status`, `amount`, `monthly_emi`).

### Vector DB Collections (ChromaDB)
* **`products`**: Vectorized financial product policies (underwriting conditions, rates, legal warning guidelines).
* **`crm_notes`**: Semantic index of historical CRM logs for semantic query matching.

---

## 6. Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js v20+

### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables. Copy `.env.example` to `.env` and fill in details:
   ```ini
    DATABASE_URL=postgresql://username:password@hostname:5432/database_name
    
    # Option 1: Remote Gemini API
    USE_LOCAL_LLM=false
    GEMINI_API_KEY=your_gemini_api_key_here
    GEMINI_MODEL=gemini-2.5-flash
    
    # Option 2: Hugging Face Serverless API (Free, remote inference)
    USE_HF_API=false
    HF_API_KEY=your_huggingface_api_token_here
    HF_MODEL=Qwen/Qwen2.5-7B-Instruct
    
    # Option 3: Groq API Config (Fast, free hosted models)
    USE_GROQ_API=false
    GROQ_API_KEY=your_groq_api_key_here
    GROQ_MODEL=llama-3.3-70b-versatile

    # Option 4: Local Hugging Face Pipeline (Downloads weights to machine)
    # USE_LOCAL_LLM=true
    
    CHROMA_DB_PATH=./chroma_db
    PORT=8000
    ```
    *Note: AURA supports four LLM modes:*
    1. **Gemini API**: Fast remote inference.
    2. **Hugging Face Serverless API**: Remote inference via Hugging Face serverless endpoints with zero local hardware constraints. Simply generate a free access token on Hugging Face (`hf_...`) and select any supported chat model.
    3. **Groq API**: High-speed remote inference utilizing hosted models on Groq (such as `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`) with a generous free tier.
    4. **Local Pipeline**: Set `USE_LOCAL_LLM=true` to download `Qwen2.5-1.5B-Instruct` and execute fully locally.


5. Run the server (auto-initializes and seeds 1,000 customers & 10,000 transactions on startup if empty):
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run Next.js in development mode:
   ```bash
   npm run dev
   ```
4. Access the dashboard UI at `http://localhost:3000`.

---

## 7. Demo Scenarios

AURA includes three preset buttons on the UI representing core BFSI campaign tasks:

* **Scenario 1: Personal Loan Campaign**
  * *Query*: "Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages."
  * *Expected Result*: Finds high-earning users (like "Sarah Jenkins") who maintain high average balances, have regular salary deposits, no active defaults, and have a CRM log indicating a loan inquiry. Recommends a Personal Loan and drafts compliance-compliant messages.
* **Scenario 2: Premium Credit Card Campaign**
  * *Query*: "Find customers suitable for a premium credit card and generate personalized email and WhatsApp outreach."
  * *Expected Result*: Identifies high-income targets (e.g. "David Vance", Business Owner) with high discretionary entertainment spending and travel lounge inquiries.
* **Scenario 3: Dormant Customer Re-engagement**
  * *Query*: "Find dormant customers needing low-risk re-engagement offers and draft outreach messages."
  * *Expected Result*: Matches accounts showing high inactivity (like "Robert Miller") with low transactions. Recommends high-yield savings to re-initiate trust.

---

## 8. Design Decisions, Trade-offs & Future Enhancements

### Key Design Decisions
* **LangGraph State Machine**: Utilizing a compiled StateGraph enforces a structured pipeline flow that ensures execution predictability, state persistency, and trace logs, which is vital for compliance-focused banking environments.
* **Self-Seeding Application Startup**: Seeding relational data (1k customers, 10k transactions) and vector nodes automatically on start guarantees immediate developer verification without run scripts.
* **Mock LLM Fallback**: If no valid API keys (Gemini, HF, or Groq) are configured and local LLM execution is disabled, a mock LLM mode activates, returning structured JSON plans and recommendations. This guarantees a smooth, error-free UI review out of the box.

### Trade-offs & Limitations
* **Sequential Node Transitions**: The current graph is straight sequential (`Planner` -> `Customer Intel` -> `Conversion` -> `Recommendation` -> `Personalization` -> `Summary`). While logical, a branching or looping graph could run evaluations in parallel to optimize execution speeds.
* **Local Persistent Vector Store**: ChromaDB is run as a local persistent directory (`PersistentClient`). For global setups, a cloud vector database (e.g., Pinecone or pgvector) is preferred.

### Future Enhancements
* **Active CRM Integration webhook**: Expose standard JSON webhook triggers so that when the RM clicks "Send Outreach", the message is immediately pushed to real WhatsApp Twilio endpoints and the SQL DB is updated in real-time.
* **Agent loopback correction**: Add a review node where a Compliance Agent reads generated outreach copies and triggers a loopback to the Personalization Agent if the disclaimer text is missing or incorrect.

---

## 9. Evaluation Mapping

Every feature is designed to showcase engineering excellence:

* **Agentic Thinking**: Illustrated by the `Planner Agent` analyzing prompts to create search filters, and the `Conversion Agent` explaining modifiers.
* **Tool Usage**: Shown by Customer Intel and Product matchers pulling data from SQLite/PostgreSQL relational tables and ChromaDB vector queries respectively.
* **Modularity**: Codebase has strict folder separations (`backend/app/agents/`, `backend/app/tools/`, `backend/app/services/`).
* **Personalization**: Personalization Agent extracts relationship duration and name, generating customized WhatsApp and Email formats.
* **Extensibility**: Configured with SQLAlchemy. Switching from SQLite to PostgreSQL is as simple as modifying the `DATABASE_URL` environment variable.
