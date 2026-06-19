from typing import TypedDict, List, Dict, Any, Optional, Annotated
import operator

class AgentLog(TypedDict):
    agent_name: str
    task: str
    thought_process: str
    duration_ms: float
    timestamp: str

class CustomerProfile(TypedDict):
    customer_id: str
    name: str
    age: int
    city: str
    occupation: str
    annual_income: float
    relationship_years: int

class CustomerFinancials(TypedDict):
    avg_monthly_balance: float
    salary_credit_regular: bool
    monthly_savings_rate: float
    active_emi: float
    engagement_score: int
    value_score: float

class ConversionDetails(TypedDict):
    conversion_probability: float
    reasons: List[str]

class ProductRecommendation(TypedDict):
    recommended_product: str
    why: str

class OutreachTemplates(TypedDict):
    whatsapp_message: str
    email_message: str

class CRMWorkflowState(TypedDict):
    # Inputs
    query: str
    
    # Internal agent states
    planner_instructions: Dict[str, Any]
    customer_ids: List[str]
    customer_profiles: Dict[str, CustomerProfile]
    customer_financials: Dict[str, CustomerFinancials]
    conversions: Dict[str, ConversionDetails]
    recommendations: Dict[str, ProductRecommendation]
    outreach: Dict[str, OutreachTemplates]
    
    # Final output
    final_report: Dict[str, Any]
    
    # Audit trail & explainability (accumulates across node executions)
    agent_logs: Annotated[List[AgentLog], operator.add]
    
    # Workflow control
    current_step: str
