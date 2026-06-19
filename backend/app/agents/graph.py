from langgraph.graph import StateGraph, END
from app.agents.state import CRMWorkflowState
from app.agents.planner import planner_node
from app.agents.customer_intel import customer_intel_node
from app.agents.conversion import conversion_node
from app.agents.recommendation import recommendation_node
from app.agents.personalization import personalization_node
from app.agents.summary import summary_node

# Initialize graph with state schema
workflow = StateGraph(CRMWorkflowState)

# Register agent nodes
workflow.add_node("planner", planner_node)
workflow.add_node("customer_intel", customer_intel_node)
workflow.add_node("conversion", conversion_node)
workflow.add_node("recommendation", recommendation_node)
workflow.add_node("personalization", personalization_node)
workflow.add_node("summary", summary_node)

# Set execution entry node
workflow.set_entry_point("planner")

# Draw sequential edges representing orchestration pipeline
workflow.add_edge("planner", "customer_intel")
workflow.add_edge("customer_intel", "conversion")
workflow.add_edge("conversion", "recommendation")
workflow.add_edge("recommendation", "personalization")
workflow.add_edge("personalization", "summary")
workflow.add_edge("summary", END)

# Compile LangGraph application
app_graph = workflow.compile()
print("[INFO] LangGraph workflow compiled successfully.")
