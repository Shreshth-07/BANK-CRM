from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class RMQueryRequest(BaseModel):
    query: str = Field(..., example="Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.")

class AgentExecutionLog(BaseModel):
    agent_name: str
    task: str
    thought_process: str
    duration_ms: float
    timestamp: str

class SummaryStatistics(BaseModel):
    total_targets: int
    average_conversion_probability: float
    average_value_score: float
    dominant_product: str

class TargetCustomerResponse(BaseModel):
    customer_id: str
    name: str
    age: int
    occupation: str
    city: str
    annual_income: float
    relationship_years: int
    avg_monthly_balance: float
    active_emi: float
    value_score: float
    conversion_probability: float
    recommended_product: str
    why: str
    whatsapp_message: str
    email_message: str
    campaign_rank_score: float

class CampaignResponse(BaseModel):
    execution_timestamp: str
    summary_statistics: SummaryStatistics
    executive_summary: str
    top_customers: List[TargetCustomerResponse]

class AgentRunResponse(BaseModel):
    query: str
    final_report: CampaignResponse
    agent_logs: List[AgentExecutionLog]

# Customer Details schemas
class CustomerBrief(BaseModel):
    customer_id: str
    name: str
    age: int
    occupation: str
    annual_income: float
    relationship_years: int
    city: str

class TransactionBrief(BaseModel):
    txn_id: str
    amount: float
    txn_type: str
    txn_date: str
    category: str

class LoanBrief(BaseModel):
    loan_id: str
    loan_type: str
    status: str
    amount: float
    monthly_emi: float

class CRMLogBrief(BaseModel):
    interaction_id: str
    interaction_type: str
    notes: str
    timestamp: str

class CustomerDetailResponse(BaseModel):
    profile: CustomerBrief
    financials: Dict[str, Any]
    transactions: List[TransactionBrief]
    loans: List[LoanBrief]
    crm_interactions: List[CRMLogBrief]

# Analytics schemas
class OccupationDist(BaseModel):
    occupation: str
    count: int

class AnalyticsDashboardResponse(BaseModel):
    total_customers: int
    total_loans: int
    active_loans: int
    total_aum: float # estimated total deposit AUM
    occupations: List[OccupationDist]
