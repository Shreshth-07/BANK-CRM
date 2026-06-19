from fastapi import APIRouter, HTTPException
from app.schemas import RMQueryRequest, AgentRunResponse
from app.agents.graph import app_graph

router = APIRouter(prefix="/api/agent", tags=["Agent Operations"])

@router.post("/run", response_model=AgentRunResponse)
def run_agent_workflow(request: RMQueryRequest):
    """
    Executes the LangGraph Agent pipeline based on the Relationship Manager's query.
    Coordinates Planner -> Customer Intel -> Conversion -> Product Recommendation -> Personalization -> Summary.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        print(f"[API] Running agent workflow for query: '{request.query}'")
        
        # Initialize LangGraph starting inputs
        # agent_logs is initialized as an empty list and accumulates logs across nodes
        inputs = {
            "query": request.query,
            "agent_logs": []
        }
        
        # Execute the compiled LangGraph workflow synchronously
        output_state = app_graph.invoke(inputs)
        
        if "final_report" not in output_state:
            raise HTTPException(
                status_code=500, 
                detail="Agent workflow executed but failed to generate a final report."
            )
            
        return AgentRunResponse(
            query=request.query,
            final_report=output_state["final_report"],
            agent_logs=output_state["agent_logs"]
        )
        
    except Exception as e:
        print(f"[API ERROR] Agent workflow execution failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Agent workflow execution failed: {str(e)}"
        )
