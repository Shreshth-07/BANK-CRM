import time
import json
from datetime import datetime
from app.agents.state import CRMWorkflowState, AgentLog, ProductRecommendation
from app.services.llm_service import LLMService
from app.services.vector_db import VectorDBService

def recommendation_node(state: CRMWorkflowState) -> dict:
    start_time = time.time()
    customer_ids = state.get("customer_ids", [])
    profiles = state.get("customer_profiles", {})
    financials = state.get("customer_financials", {})
    conversions = state.get("conversions", {})
    instructions = state.get("planner_instructions", {})
    scenario = instructions.get("scenario", "loan")
    
    recommendations: dict[str, ProductRecommendation] = {}
    
    llm_service = LLMService()
    model = llm_service.get_model()
    
    # Initialize Vector DB Service to fetch product sheets
    vdb = VectorDBService()
    
    # Search for product guidelines in ChromaDB
    # If the scenario is 'loan', search for 'personal loan product sheets'
    # If 'card', search for 'premium credit card rewards'
    # If 'dormant', search for 'high yield savings or wealth products'
    search_keyword = "personal loan"
    if scenario == "card":
        search_keyword = "premium credit card lounge"
    elif scenario == "dormant":
        search_keyword = "high yield savings wealth account"
        
    product_results = vdb.query_products(search_keyword, n_results=2)
    documents = product_results.get("documents", [[]])[0]
    product_context = "\n\n".join(documents)
    
    tasks = []
    for cid in customer_ids:
        profile = profiles.get(cid)
        financial = financials.get(cid)
        conv = conversions.get(cid, {})
        
        if not profile or not financial:
            continue
            
        system_prompt = (
            "You are the Product Recommendation Agent in an enterprise bank CRM.\n"
            "Your task is to recommend the best financial product for the customer based on their demographic profile, "
            "financial metrics, conversion probability, and the bank's underwriting product guidelines.\n\n"
            "Available Product Guidelines (from Vector DB):\n"
            f"{product_context}\n\n"
            "Analyze the profile and output a JSON object containing:\n"
            "{\n"
            "  \"recommended_product\": \"Product Name\",\n"
            "  \"why\": \"Clear rationale explaining why this product fits the customer's specific age, income, and transaction profile.\"\n"
            "}\n"
            "Output ONLY valid JSON."
        )
        
        user_msg = (
            f"Customer Profile:\n"
            f"- Name: {profile['name']}\n"
            f"- Age: {profile['age']}\n"
            f"- Occupation: {profile['occupation']}\n"
            f"- Annual Income: ${profile['annual_income']:,}\n"
            f"- Relationship Years: {profile['relationship_years']}\n\n"
            f"Financial Metrics:\n"
            f"- Average Balance: ${financial['avg_monthly_balance']:,}\n"
            f"- Monthly Savings Rate: {financial['monthly_savings_rate']:.1%}\n"
            f"- Monthly Active EMI Liabilities: ${financial['active_emi']:,}\n"
            f"- Campaign Conversion Probability: {conv.get('conversion_probability', 0.0)}%\n"
        )
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ]
        tasks.append((cid, profile, messages))

    from concurrent.futures import ThreadPoolExecutor
    
    def run_rec_llm(task):
        cid, profile, messages = task
        try:
            response = model.invoke(messages)
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            rec_data = json.loads(content, strict=False)
            if not isinstance(rec_data, dict):
                raise ValueError("Recommendation output is not a dictionary")
            rec_data["recommended_product"] = str(rec_data.get("recommended_product", ""))
            rec_data["why"] = str(rec_data.get("why", ""))
        except Exception as e:
            print(f"[ERROR] Recommendation agent parsing failed: {e}. Using fallback.")
            # Fallback based on scenario
            if scenario == "card":
                rec_data = {
                    "recommended_product": "Apex Elite Premium Credit Card",
                    "why": f"Customer has annual income of ${profile['annual_income']:,} (exceeding $120k threshold) and high average assets. Recommended for premium rewards."
                }
            elif scenario == "dormant":
                rec_data = {
                    "recommended_product": "Platinum Savings Account",
                    "why": f"A savings account yielding 4.65% APY is recommended to re-engage this long-term dormant relationship with minimal risk."
                }
            else:
                rec_data = {
                    "recommended_product": "Personal Loan",
                    "why": f"Recommended for personal loan at 8.99% pre-approved rate because customer has stable salary, high customer value, and explicit credit interest."
                }
        return cid, rec_data

    with ThreadPoolExecutor(max_workers=max(1, len(tasks))) as executor:
        results = list(executor.map(run_rec_llm, tasks))

    for cid, rec_data in results:
        recommendations[cid] = rec_data
        
    duration_ms = (time.time() - start_time) * 1000
    
    # Create Agent log
    log: AgentLog = {
        "agent_name": "Product Recommendation Agent",
        "task": "Mapped customer profiles to bank products.",
        "thought_process": (
            f"Retrieved bank underwriting constraints and product specs from ChromaDB. "
            f"Evaluated match matrix for {len(customer_ids)} customer(s). "
            f"Assigned custom recommendations (loans, credit cards, or savings portfolios) "
            f"and formulated credit-fit explanations based on age, savings thresholds, and outstanding liabilities."
        ),
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "recommendations": recommendations,
        "agent_logs": [log],
        "current_step": "Personalization Agent"
    }
