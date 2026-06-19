import sys
import os

# Set Python path to backend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("[1] Initializing LLMService...")
from app.services.llm_service import LLMService
llm = LLMService()
model = llm.get_model()
print(f"LLM mode: {llm.mode}")

print("[2] Invoking test query to LLM...")
try:
    res = model.invoke([{"role": "user", "content": "Hello, respond with 'hello back' and nothing else."}])
    print(f"LLM Response: {res.content}")
except Exception as e:
    print(f"LLM Invoke failed: {e}")

print("[3] Invoking LangGraph workflow...")
from app.agents.graph import app_graph
inputs = {
    "query": "Find high-value customers likely to convert for a personal loan this month.",
    "agent_logs": []
}
try:
    output_state = app_graph.invoke(inputs)
    print("Workflow executed successfully!")
    print("Final Report Keys:", output_state.keys())
    if "final_report" in output_state:
        print("Executive Summary:", output_state["final_report"].get("executive_summary"))
except Exception as e:
    print(f"Workflow failed: {e}")
