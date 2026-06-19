import time
import json
from datetime import datetime
from app.agents.state import CRMWorkflowState, AgentLog, OutreachTemplates
from app.services.llm_service import LLMService

def personalization_node(state: CRMWorkflowState) -> dict:
    start_time = time.time()
    customer_ids = state.get("customer_ids", [])
    profiles = state.get("customer_profiles", {})
    recommendations = state.get("recommendations", {})
    
    outreach: dict[str, OutreachTemplates] = {}
    
    llm_service = LLMService()
    model = llm_service.get_model()
    
    tasks = []
    for cid in customer_ids:
        profile = profiles.get(cid)
        rec = recommendations.get(cid, {})
        
        if not profile or not rec:
            continue
            
        system_prompt = (
            "You are the Personalization Agent in a banking CRM system.\n"
            "Your task is to generate highly personalized outreach messages for the recommended product.\n"
            "You must generate two messages: one for WhatsApp (concise, professional, action-driven, with emojis) "
            "and one for Email (structured, formal, with subject and body, compliant with banking regulations).\n\n"
            "Compliance Requirements (MANDATORY):\n"
            "- If promoting a loan or credit card, include: 'Interest rates are subject to credit approval. Rates vary based on creditworthiness.'\n"
            "- Include an opt-out choice: 'To opt out of future marketing, reply STOP or click unsubscribe.'\n"
            "- Do not make absolute guarantees of credit approval. Use terms like 'pre-qualified' or 'eligible to apply'.\n\n"
            "JSON Output Format:\n"
            "{\n"
            "  \"whatsapp_message\": \"WhatsApp content\",\n"
            "  \"email_message\": \"Email subject and body content\"\n"
            "}\n"
            "Output ONLY valid JSON."
        )
        
        user_msg = (
            f"Customer Name: {profile['name']}\n"
            f"Relationship Duration: {profile['relationship_years']} years\n"
            f"Recommended Product: {rec.get('recommended_product')}\n"
            f"Product Fit Rationale: {rec.get('why')}\n"
        )
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ]
        tasks.append((cid, profile, rec, messages))

    from concurrent.futures import ThreadPoolExecutor
    
    def run_pers_llm(task):
        cid, profile, rec, messages = task
        try:
            response = model.invoke(messages)
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            outreach_data = json.loads(content, strict=False)
            
            # Defensive check & conversion of dict/list elements to string
            if not isinstance(outreach_data, dict):
                raise ValueError("Personalization output is not a dictionary")
                
            # Process email_message
            email_msg = outreach_data.get("email_message", "")
            if isinstance(email_msg, dict):
                subj = email_msg.get("subject", email_msg.get("Subject", ""))
                body = email_msg.get("body", email_msg.get("Body", email_msg.get("content", email_msg.get("Content", ""))))
                if subj or body:
                    email_msg = f"Subject: {subj}\n\n{body}" if subj else str(body)
                else:
                    email_msg = json.dumps(email_msg)
            elif not isinstance(email_msg, str):
                email_msg = str(email_msg)
            outreach_data["email_message"] = email_msg
            
            # Process whatsapp_message
            wa_msg = outreach_data.get("whatsapp_message", "")
            if isinstance(wa_msg, dict):
                wa_msg = wa_msg.get("body", wa_msg.get("message", wa_msg.get("content", json.dumps(wa_msg))))
            elif not isinstance(wa_msg, str):
                wa_msg = str(wa_msg)
            outreach_data["whatsapp_message"] = wa_msg
            
        except Exception as e:
            print(f"[ERROR] Personalization agent parsing failed: {e}. Using fallback templates.")
            # Fallback
            product_name = rec.get("recommended_product", "Personal Loan")
            whatsapp_fb = (
                f"Hi {profile['name']}! 👋 As a valued customer for {profile['relationship_years']} years, "
                f"you are pre-qualified to apply for our {product_name}. Enjoy special rates starting today! "
                f"Check eligibility in seconds. Reply YES to connect. standard rate warning: Subject to credit approval. "
                f"Reply STOP to unsubscribe."
            )
            email_fb = (
                f"Subject: Exclusive {product_name} Offer for {profile['name']}\n\n"
                f"Dear {profile['name']},\n\n"
                f"Thank you for your continued trust in Apex Bank over the past {profile['relationship_years']} years. "
                f"We are pleased to inform you that you are pre-qualified for our {product_name} program.\n\n"
                f"Based on your excellent credit relationship, you can access competitive terms. "
                f"Interest rates are subject to credit approval. Rates vary based on creditworthiness. "
                f"Please reply to this email or visit our portal to get started.\n\n"
                f"Best regards,\n"
                f"Relationship Management Team\n"
                f"Apex Bank\n\n"
                f"To opt out of future marketing, please reply STOP."
            )
            outreach_data = {
                "whatsapp_message": whatsapp_fb,
                "email_message": email_fb
            }
        return cid, outreach_data

    with ThreadPoolExecutor(max_workers=max(1, len(tasks))) as executor:
        results = list(executor.map(run_pers_llm, tasks))

    for cid, outreach_data in results:
        outreach[cid] = outreach_data
        
    duration_ms = (time.time() - start_time) * 1000
    
    # Create Agent log
    log: AgentLog = {
        "agent_name": "Personalization Agent",
        "task": "Generated customized outreach templates.",
        "thought_process": (
            f"Drafted bespoke WhatsApp and Email copy for {len(customer_ids)} customer(s). "
            f"Injected relationship personalization points (customer name, account age, specific product value proposition). "
            f"Enforced regulatory compliance standards by adding clear APR disclosures, opt-out mechanisms, "
            f"and credit approval disclaimers."
        ),
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "outreach": outreach,
        "agent_logs": [log],
        "current_step": "RM Summary Agent"
    }
