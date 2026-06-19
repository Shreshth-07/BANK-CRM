from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Customer, Transaction, LoanHistory
from app.schemas import AnalyticsDashboardResponse, OccupationDist

router = APIRouter(prefix="/api/analytics", tags=["CRM Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Computes summary metrics for the CRM dashboard home panel."""
    # 1. Counts
    total_customers = db.query(Customer).count()
    
    total_loans = db.query(LoanHistory).count()
    active_loans = db.query(LoanHistory).filter(LoanHistory.status == "Active").count()
    
    # 2. Total AUM (Credits - Debits from transactions + base balance assumption of $10,000 per customer)
    # This represents total deposits held by the bank.
    credit_sum = db.query(func.sum(Transaction.amount)).filter(Transaction.txn_type == "CREDIT").scalar() or 0.0
    debit_sum = db.query(func.sum(Transaction.amount)).filter(Transaction.txn_type == "DEBIT").scalar() or 0.0
    
    base_deposits = total_customers * 10000.0  # Assumed starting deposit per customer
    net_deposits = credit_sum - debit_sum
    total_aum = base_deposits + net_deposits
    
    # 3. Occupations breakdown
    occ_counts = db.query(
        Customer.occupation, 
        func.count(Customer.customer_id)
    ).group_by(Customer.occupation).all()
    
    occupations_dist = [
        OccupationDist(occupation=occ, count=cnt)
        for occ, cnt in occ_counts
    ]
    # Sort by count descending
    occupations_dist.sort(key=lambda x: x.count, reverse=True)
    
    return AnalyticsDashboardResponse(
        total_customers=total_customers,
        total_loans=total_loans,
        active_loans=active_loans,
        total_aum=round(total_aum, 2),
        occupations=occupations_dist
    )
