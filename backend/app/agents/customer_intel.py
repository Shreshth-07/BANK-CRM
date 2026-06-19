import time
from datetime import datetime
from app.agents.state import CRMWorkflowState, AgentLog, CustomerProfile, CustomerFinancials
from app.database import SessionLocal
from app.services.vector_db import VectorDBService
from app.tools.db_tools import (
    get_customer_by_id,
    search_customers,
    compute_financial_analytics,
    get_customer_crm_interactions
)

def calculate_value_score(income: float, balance: float, relationship_years: int) -> float:
    """
    Compute customer value score (0 - 100):
    - Income (40% weight): Max score reached at $250,000+ income
    - Balance (35% weight): Max score reached at $100,000+ average balance
    - Relationship (25% weight): Max score reached at 10+ years
    """
    inc_score = min(income / 250000.0, 1.0) * 40.0
    bal_score = min(balance / 100000.0, 1.0) * 35.0
    rel_score = min(relationship_years / 10.0, 1.0) * 25.0
    return round(inc_score + bal_score + rel_score, 1)

def customer_intel_node(state: CRMWorkflowState) -> dict:
    start_time = time.time()
    instructions = state.get("planner_instructions", {})
    scenario = instructions.get("scenario", "loan")
    target_income = instructions.get("target_income", 45000)
    min_years = instructions.get("min_relationship_years", 1)
    vector_query = instructions.get("vector_search_query", "")
    
    # 1. Retrieve candidates
    # We first search using ChromaDB to retrieve customers with semantically matching interaction notes.
    vdb = VectorDBService()
    notes_results = vdb.query_crm_notes(vector_query, n_results=8)
    
    vector_customer_ids = []
    # Extract customer IDs from vector search metadata
    metadatas = notes_results.get("metadatas", [[]])[0]
    for meta in metadatas:
        if meta and "customer_id" in meta:
            vector_customer_ids.append(meta["customer_id"])
            
    # Connect to database
    db = SessionLocal()
    try:
        # Also retrieve customers matching hard database criteria
        db_customer_ids = search_customers(
            db, 
            min_income=target_income, 
            min_years=min_years
        )
        
        # Combine lists, keeping vector-matched customers at the top of the search
        combined_ids = []
        # Add vector results first (if they match our demographic filters or if they are explicitly seeded targets)
        for cid in vector_customer_ids:
            if cid in db_customer_ids and cid not in combined_ids:
                combined_ids.append(cid)
                
        # Fill rest from DB search results until we have up to 5 customers to review
        for cid in db_customer_ids:
            if cid not in combined_ids:
                combined_ids.append(cid)
                if len(combined_ids) >= 5:
                    break
                    
        # If no combined results, fall back to default customer records
        if not combined_ids:
            combined_ids = db_customer_ids[:5]
            
        # 2. Query detailed profile and calculate analytics
        profiles: dict[str, CustomerProfile] = {}
        financials: dict[str, CustomerFinancials] = {}
        
        for cid in combined_ids:
            profile_data = get_customer_by_id(db, cid)
            if not profile_data:
                continue
                
            profiles[cid] = profile_data
            
            # Compute financials
            analytics = compute_financial_analytics(db, cid)
            
            # Compute value score
            val_score = calculate_value_score(
                profile_data["annual_income"],
                analytics["avg_monthly_balance"],
                profile_data["relationship_years"]
            )
            
            financials[cid] = {
                "avg_monthly_balance": analytics["avg_monthly_balance"],
                "salary_credit_regular": analytics["salary_credit_regular"],
                "monthly_savings_rate": analytics["monthly_savings_rate"],
                "active_emi": analytics["active_emi"],
                "engagement_score": analytics["engagement_score"],
                "value_score": val_score
            }
            
    finally:
        db.close()
        
    duration_ms = (time.time() - start_time) * 1000
    
    # Create Agent log
    selected_names = [profiles[cid]["name"] for cid in combined_ids if cid in profiles]
    log: AgentLog = {
        "agent_name": "Customer Intelligence Agent",
        "task": f"Analyzed candidate profiles for query filters.",
        "thought_process": (
            f"Executed vector query against unstructured CRM notes and matched {len(vector_customer_ids)} customer(s). "
            f"Executed demographic database search. Merged and prioritized candidates. "
            f"Evaluated financial telemetry (salary credit regularity, average balance, monthly savings, outstanding EMIs) for top 5 candidates: {', '.join(selected_names)}. "
            f"Calculated individual customer value scores based on income, assets, and relationship duration."
        ),
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "customer_ids": combined_ids,
        "customer_profiles": profiles,
        "customer_financials": financials,
        "agent_logs": [log],
        "current_step": "Conversion Prediction Agent"
    }
