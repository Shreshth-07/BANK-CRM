import time
from datetime import datetime
from app.agents.state import CRMWorkflowState, AgentLog
from app.services.llm_service import LLMService

def summary_node(state: CRMWorkflowState) -> dict:
    start_time = time.time()
    customer_ids = state.get("customer_ids", [])
    profiles = state.get("customer_profiles", {})
    financials = state.get("customer_financials", {})
    conversions = state.get("conversions", {})
    recommendations = state.get("recommendations", {})
    outreach = state.get("outreach", {})
    
    # 1. Rank customers based on a combined score
    # combined_score = (conversion_probability * 0.6) + (value_score * 0.4)
    ranked_customers = []
    
    for cid in customer_ids:
        profile = profiles.get(cid)
        financial = financials.get(cid)
        conv = conversions.get(cid, {})
        rec = recommendations.get(cid, {})
        msg = outreach.get(cid, {})
        
        if not profile or not financial:
            continue
            
        conv_prob = conv.get("conversion_probability", 0.0)
        val_score = financial.get("value_score", 0.0)
        combined_score = round((conv_prob * 0.6) + (val_score * 0.4), 1)
        
        ranked_customers.append({
            "customer_id": cid,
            "name": profile["name"],
            "age": profile["age"],
            "occupation": profile["occupation"],
            "city": profile["city"],
            "annual_income": profile["annual_income"],
            "relationship_years": profile["relationship_years"],
            "avg_monthly_balance": financial["avg_monthly_balance"],
            "active_emi": financial["active_emi"],
            "salary_credit_regular": financial["salary_credit_regular"],
            "engagement_score": financial["engagement_score"],
            "value_score": val_score,
            "conversion_probability": conv_prob,
            "reasons": conv.get("reasons", []),
            "recommended_product": rec.get("recommended_product", "N/A"),
            "why": rec.get("why", "N/A"),
            "whatsapp_message": msg.get("whatsapp_message", ""),
            "email_message": msg.get("email_message", ""),
            "campaign_rank_score": combined_score
        })
        
    # Sort by campaign score descending
    ranked_customers.sort(key=lambda x: x["campaign_rank_score"], reverse=True)
    
    # Compute summary stats
    total_targets = len(ranked_customers)
    avg_conversion = sum(c["conversion_probability"] for c in ranked_customers) / total_targets if total_targets > 0 else 0.0
    avg_value = sum(c["value_score"] for c in ranked_customers) / total_targets if total_targets > 0 else 0.0
    
    product_counts = {}
    for c in ranked_customers:
        p = c["recommended_product"]
        product_counts[p] = product_counts.get(p, 0) + 1
    
    dominant_product = max(product_counts, key=product_counts.get) if product_counts else "None"
    
    # Use LLM to write a professional executive summary for the Relationship Manager
    llm_service = LLMService()
    model = llm_service.get_model()
    
    system_prompt = (
        "You are the RM Summary Agent in an AI-first banking CRM.\n"
        "Generate a professional, encouraging executive summary (3-4 sentences) for the Relationship Manager "
        "describing the campaign parameters, key findings, and recommended strategy based on the stats provided."
    )
    
    user_msg = (
        f"Campaign Run Summary Statistics:\n"
        f"- Total Customers Evaluated: {total_targets}\n"
        f"- Average Conversion Likelihood: {avg_conversion:.1f}%\n"
        f"- Average Customer Value Score: {avg_value:.1f}/100\n"
        f"- Top Recommended Product: {dominant_product}\n"
        f"- Ranked Customer List: " + ", ".join([f"{c['name']} ({c['conversion_probability']}%)" for c in ranked_customers])
    )
    
    try:
        response = model.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ])
        exec_summary = response.content.strip()
    except Exception:
        exec_summary = (
            f"Successfully compiled the campaign list. Evaluated {total_targets} customers with an average conversion probability "
            f"of {avg_conversion:.1f}% and value score of {avg_value:.1f}. The primary recommended product is {dominant_product}. "
            f"WhatsApp and Email outreach copy is prepared and compliant for delivery."
        )
        
    final_report = {
        "execution_timestamp": datetime.now().isoformat(),
        "summary_statistics": {
            "total_targets": total_targets,
            "average_conversion_probability": round(avg_conversion, 1),
            "average_value_score": round(avg_value, 1),
            "dominant_product": dominant_product
        },
        "executive_summary": exec_summary,
        "top_customers": ranked_customers
    }
    
    duration_ms = (time.time() - start_time) * 1000
    
    # Create Agent log
    log: AgentLog = {
        "agent_name": "RM Summary Agent",
        "task": "Aggregated and compiled final RM campaign dossier.",
        "thought_process": (
            f"Ranked {total_targets} customer(s) using composite campaign matrices. "
            f"Synthesized statistics for conversion and assets. "
            f"Drafted executive report overview for Relationship Manager and finalized state."
        ),
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "final_report": final_report,
        "agent_logs": [log],
        "current_step": "Final Response"
    }
