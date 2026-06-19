from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models import Customer, Transaction, CRMInteraction, LoanHistory

def get_customer_by_id(db: Session, customer_id: str) -> dict:
    """Fetch customer details by ID."""
    cust = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not cust:
        return {}
    return {
        "customer_id": cust.customer_id,
        "name": cust.name,
        "age": cust.age,
        "city": cust.city,
        "occupation": cust.occupation,
        "annual_income": cust.annual_income,
        "relationship_years": cust.relationship_years
    }

def search_customers(db: Session, min_income: float = 0, occupation: str = None, min_years: int = 0) -> list[str]:
    """Search customer IDs based on filters."""
    query = db.query(Customer.customer_id)
    if min_income > 0:
        query = query.filter(Customer.annual_income >= min_income)
    if occupation:
        query = query.filter(Customer.occupation == occupation)
    if min_years > 0:
        query = query.filter(Customer.relationship_years >= min_years)
    
    results = query.all()
    return [r[0] for r in results]

def get_customer_transactions(db: Session, customer_id: str, months: int = 12) -> list[dict]:
    """Fetch transaction history for a customer."""
    cutoff_date = datetime.now() - timedelta(days=months * 30.5)
    txns = db.query(Transaction).filter(
        Transaction.customer_id == customer_id,
        Transaction.txn_date >= cutoff_date
    ).order_by(Transaction.txn_date.desc()).all()
    
    return [
        {
            "txn_id": t.txn_id,
            "amount": t.amount,
            "txn_type": t.txn_type,
            "txn_date": t.txn_date.isoformat(),
            "category": t.category
        }
        for t in txns
    ]

def get_customer_crm_interactions(db: Session, customer_id: str) -> list[dict]:
    """Fetch CRM interactions history."""
    interactions = db.query(CRMInteraction).filter(
        CRMInteraction.customer_id == customer_id
    ).order_by(CRMInteraction.timestamp.desc()).all()
    
    return [
        {
            "interaction_id": i.interaction_id,
            "interaction_type": i.interaction_type,
            "notes": i.notes,
            "timestamp": i.timestamp.isoformat()
        }
        for i in interactions
    ]

def get_customer_loans(db: Session, customer_id: str) -> list[dict]:
    """Fetch loan records for a customer."""
    loans = db.query(LoanHistory).filter(
        LoanHistory.customer_id == customer_id
    ).all()
    
    return [
        {
            "loan_id": l.loan_id,
            "loan_type": l.loan_type,
            "status": l.status,
            "amount": l.amount,
            "monthly_emi": l.monthly_emi
        }
        for l in loans
    ]

def compute_financial_analytics(db: Session, customer_id: str) -> dict:
    """
    Compute customer metrics:
    - Average monthly balance
    - Salary credited regularly (bool)
    - Monthly savings rate
    - Total monthly debt obligations (EMI)
    - Engagement score (interactions count in last 6 months)
    """
    # 1. Transactions
    txns = db.query(Transaction).filter(Transaction.customer_id == customer_id).order_by(Transaction.txn_date.asc()).all()
    
    if not txns:
        return {
            "avg_monthly_balance": 0.0,
            "salary_credit_regular": False,
            "monthly_savings_rate": 0.0,
            "active_emi": 0.0,
            "engagement_score": 0
        }

    # Group transactions by month to compute balance trend
    monthly_flows = {}
    for t in txns:
        year_month = f"{t.txn_date.year}-{t.txn_date.month:02d}"
        if year_month not in monthly_flows:
            monthly_flows[year_month] = {"credit": 0.0, "debit": 0.0, "has_salary": False}
        
        if t.txn_type == "CREDIT":
            monthly_flows[year_month]["credit"] += t.amount
            if t.category == "Salary":
                monthly_flows[year_month]["has_salary"] = True
        else:
            monthly_flows[year_month]["debit"] += t.amount
            
    # Calculate monthly average balances
    # We assume a start balance of $10,000 for simplified calculation, and track the cumulative end balance of each month
    running_balance = 10000.0
    monthly_balances = []
    
    salary_months = 0
    total_months = len(monthly_flows)
    
    for month, flows in sorted(monthly_flows.items()):
        month_net = flows["credit"] - flows["debit"]
        running_balance += month_net
        monthly_balances.append(running_balance)
        if flows["has_salary"]:
            salary_months += 1
            
    avg_monthly_balance = sum(monthly_balances) / len(monthly_balances) if monthly_balances else 0.0
    salary_credit_regular = (salary_months >= 10) or (salary_months / total_months >= 0.8 if total_months > 0 else False)

    # Compute average savings rate: (Credit - Debit) / Credit
    credits = sum(f["credit"] for f in monthly_flows.values())
    debits = sum(f["debit"] for f in monthly_flows.values())
    savings_rate = (credits - debits) / credits if credits > 0 else 0.0

    # 2. Loan EMIs
    active_loans = db.query(LoanHistory).filter(
        LoanHistory.customer_id == customer_id,
        LoanHistory.status == "Active"
    ).all()
    active_emi = sum(l.monthly_emi for l in active_loans)

    # 3. CRM Engagement Score
    six_months_ago = datetime.now() - timedelta(days=180)
    engagement_count = db.query(CRMInteraction).filter(
        CRMInteraction.customer_id == customer_id,
        CRMInteraction.timestamp >= six_months_ago
    ).count()

    return {
        "avg_monthly_balance": round(avg_monthly_balance, 2),
        "salary_credit_regular": salary_credit_regular,
        "monthly_savings_rate": round(savings_rate, 4),
        "active_emi": round(active_emi, 2),
        "engagement_score": engagement_count
    }
