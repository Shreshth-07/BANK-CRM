import time
import json
from datetime import datetime
from app.agents.state import CRMWorkflowState, AgentLog, ConversionDetails
from app.services.llm_service import LLMService
from app.database import SessionLocal
from app.tools.db_tools import get_customer_crm_interactions

def calculate_rules_probability(profile: dict, financials: dict, crm_logs: list[dict], scenario: str) -> tuple[float, list[str]]:
    """
    Calculate conversion probability based on assignment rules.
    Returns: (probability, reasons_list)
    """
    # Base probability
    prob = 40.0
    reasons = []
    
    # 1. Salary credit regularity (+15%)
    if financials["salary_credit_regular"]:
        prob += 15.0
        reasons.append("Salary credited regularly (+15%)")
    
    # 2. Balance maintenance (+20% if high, -20% if low)
    if financials["avg_monthly_balance"] >= 25000:
        prob += 20.0
        reasons.append(f"High balance maintained (${financials['avg_monthly_balance']:,}) (+20%)")
    elif financials["avg_monthly_balance"] < 5000:
        prob -= 20.0
        reasons.append(f"Low balance maintained (${financials['avg_monthly_balance']:,}) (-20%)")
        
    # 3. Previous inquiries in CRM logs (+25%)
    has_inquiry = False
    inquiry_keywords = []
    if scenario == "loan":
        inquiry_keywords = ["loan", "borrow", "renovation financing", "rate"]
    elif scenario == "card":
        inquiry_keywords = ["credit card", "premium card", "airport lounge", "lounge access", "rewards"]
        
    for log in crm_logs:
        notes_lower = log["notes"].lower()
        if any(kw in notes_lower for kw in inquiry_keywords):
            has_inquiry = True
            break
            
    if has_inquiry:
        prob += 25.0
        reasons.append(f"Previous CRM inquiries related to target product ({scenario}) detected (+25%)")
        
    # 4. Active CRM engagement (+10%)
    # engagement_score is count of interactions in last 6 months
    if financials["engagement_score"] >= 3:
        prob += 10.0
        reasons.append(f"Highly engaged relationship: {financials['engagement_score']} interactions in last 6 months (+10%)")
        
    # 5. Existing high liabilities (-20%)
    # active_emi vs monthly income
    monthly_income = profile["annual_income"] / 12.0
    if financials["active_emi"] > 0 and monthly_income > 0:
        debt_ratio = financials["active_emi"] / monthly_income
        if debt_ratio > 0.30:
            prob -= 20.0
            reasons.append(f"High debt liability: monthly EMIs represent {debt_ratio:.1%} of income (-20%)")
            
    # 6. Dormant customer (-30%)
    # Engagement score is 0 or explicitly tagged as dormant
    is_dormant = financials["engagement_score"] == 0
    # Or if the notes mention dormant
    for log in crm_logs:
        if "dormant" in log["notes"].lower() or "inactive" in log["notes"].lower():
            is_dormant = True
            
    if is_dormant:
        prob -= 30.0
        reasons.append("Customer shows signs of relationship dormancy (-30%)")
        
    # Boundary constraints [5%, 95%]
    prob = max(5.0, min(95.0, prob))
    return round(prob, 1), reasons

def conversion_node(state: CRMWorkflowState) -> dict:
    start_time = time.time()
    customer_ids = state.get("customer_ids", [])
    profiles = state.get("customer_profiles", {})
    financials = state.get("customer_financials", {})
    instructions = state.get("planner_instructions", {})
    scenario = instructions.get("scenario", "loan")
    
    conversions: dict[str, ConversionDetails] = {}
    
    llm_service = LLMService()
    model = llm_service.get_model()
    
    # Fetch all data from DB sequentially first (thread-safe and fast)
    tasks = []
    db = SessionLocal()
    try:
        for cid in customer_ids:
            profile = profiles.get(cid)
            financial = financials.get(cid)
            if not profile or not financial:
                continue
                
            crm_logs = get_customer_crm_interactions(db, cid)
            prob, reasons = calculate_rules_probability(profile, financial, crm_logs, scenario)
            
            system_prompt = (
                "You are the Conversion Prediction Agent in a bank CRM system. "
                "Analyze the customer metrics and conversion score, then write a professional, short explanation "
                "summarizing why this customer has this conversion probability. Keep the text concise (2-3 sentences max) "
                "and BFSI domain-specific."
            )
            
            user_msg = (
                f"Customer: {profile['name']} ({profile['occupation']}, Income: ${profile['annual_income']:,})\n"
                f"Calculated Conversion Probability: {prob}%\n"
                f"Rules Applied: {', '.join(reasons)}\n"
                f"CRM Interaction Notes:\n" + 
                "\n".join([f"- {log['notes']}" for log in crm_logs[:3]])
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg}
            ]
            tasks.append((cid, prob, reasons, messages))
    finally:
        db.close()

    # Run LLM calls in parallel using ThreadPoolExecutor
    from concurrent.futures import ThreadPoolExecutor
    
    def run_conversion_llm(task):
        cid, prob, reasons, messages = task
        try:
            response = model.invoke(messages)
            reasons_text = response.content.strip()
        except Exception:
            reasons_text = f"Customer conversion probability is estimated at {prob}% because: " + "; ".join(reasons)
        return cid, prob, reasons + [reasons_text]

    with ThreadPoolExecutor(max_workers=max(1, len(tasks))) as executor:
        results = list(executor.map(run_conversion_llm, tasks))

    for cid, prob, reasons_list in results:
        conversions[cid] = {
            "conversion_probability": prob,
            "reasons": reasons_list
        }
        
    duration_ms = (time.time() - start_time) * 1000
    
    # Create Agent log
    log: AgentLog = {
        "agent_name": "Conversion Prediction Agent",
        "task": "Evaluated conversion likelihoods.",
        "thought_process": (
            f"Evaluated conversion potential for {len(customer_ids)} customer(s) based on business rules. "
            f"Integrated modifiers for salary regularity, transaction asset tiers, past CRM inquiries, active debt levels, "
            f"and overall profile activity. Computed final probability matrices and formatted explanation logs via LLM."
        ),
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "conversions": conversions,
        "agent_logs": [log],
        "current_step": "Product Recommendation Agent"
    }
