import json
import time
from datetime import datetime
from app.agents.state import CRMWorkflowState, AgentLog
from app.services.llm_service import LLMService

def planner_node(state: CRMWorkflowState) -> dict:
    start_time = time.time()
    query = state.get("query", "")
    
    # Initialize LLM
    llm_service = LLMService()
    model = llm_service.get_model()
    
    system_prompt = (
        "You are the Planner Agent in an enterprise banking CRM. "
        "Your task is to analyze the Relationship Manager's query and output a JSON object representing the search strategy. "
        "The JSON MUST have the following structure:\n"
        "{\n"
        "  \"scenario\": \"loan\" | \"card\" | \"dormant\",\n"
        "  \"target_income\": int,\n"
        "  \"occupation\": string or null,\n"
        "  \"min_relationship_years\": int,\n"
        "  \"vector_search_query\": string,\n"
        "  \"description\": string\n"
        "}\n"
        "Analyze the query carefully. If it mentions 'loan', set scenario to 'loan' and define target parameters. "
        "If it mentions 'credit card' or 'premium card', set scenario to 'card'. "
        "If it mentions 'dormant' or 'inactive' or 're-engage', set scenario to 'dormant'. "
        "Make sure to output ONLY valid JSON, with no markdown formatting."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"RM Query: {query}"}
    ]
    
    # Call the model
    try:
        response = model.invoke(messages)
        content = response.content.strip()
        # Clean markdown codeblocks if LLM returned them
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        plan_data = json.loads(content, strict=False)
        # Ensure correct types and defaults to prevent formatting crashes
        plan_data["scenario"] = plan_data.get("scenario", "loan")
        try:
            plan_data["target_income"] = int(plan_data.get("target_income") or 0)
        except (ValueError, TypeError):
            plan_data["target_income"] = 0
        try:
            plan_data["min_relationship_years"] = int(plan_data.get("min_relationship_years") or 0)
        except (ValueError, TypeError):
            plan_data["min_relationship_years"] = 0
        plan_data["occupation"] = plan_data.get("occupation")
        plan_data["vector_search_query"] = plan_data.get("vector_search_query", "")
        plan_data["description"] = plan_data.get("description", "")
    except Exception as e:
        print(f"[ERROR] Planner parsing failed: {e}. Using heuristics fallback.")
        # Heuristics fallback
        q_lower = query.lower()
        if "card" in q_lower:
            plan_data = {
                "scenario": "card",
                "target_income": 120000,
                "occupation": None,
                "min_relationship_years": 2,
                "vector_search_query": "interested in credit card benefits or airport lounges",
                "description": "Target high-value customers suitable for premium credit card."
            }
        elif "dormant" in q_lower or "inactive" in q_lower or "re-engage" in q_lower:
            plan_data = {
                "scenario": "dormant",
                "target_income": 0,
                "occupation": None,
                "min_relationship_years": 5,
                "vector_search_query": "dormant account or low engagement or inactive relationship",
                "description": "Identify dormant accounts needing low-risk re-engagement offers."
            }
        else:
            plan_data = {
                "scenario": "loan",
                "target_income": 45000,
                "occupation": None,
                "min_relationship_years": 1,
                "vector_search_query": "inquired about personal loan interest rates or renovation financing",
                "description": "Identify high-value customers likely to convert for a personal loan."
            }

    duration_ms = (time.time() - start_time) * 1000
    
    # Create Agent log
    log: AgentLog = {
        "agent_name": "Planner Agent",
        "task": f"Decomposed query: '{query}'",
        "thought_process": (
            f"Parsed RM query. Determined scenario '{plan_data['scenario']}' is the best match. "
            f"Configured search filter constraints: Min Income >= ${plan_data['target_income']:,}, "
            f"Min Relationship Years >= {plan_data['min_relationship_years']}. "
            f"Set up vector query: '{plan_data['vector_search_query']}' to query unstructured interaction records."
        ),
        "duration_ms": round(duration_ms, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "planner_instructions": plan_data,
        "agent_logs": [log],
        "current_step": "Customer Intelligence Agent"
    }
