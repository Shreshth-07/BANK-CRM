from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models import Customer, Transaction, CRMInteraction, LoanHistory
from app.schemas import CustomerBrief, CustomerDetailResponse
from app.tools.db_tools import (
    get_customer_by_id, 
    get_customer_transactions, 
    get_customer_crm_interactions, 
    get_customer_loans, 
    compute_financial_analytics
)

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerBrief])
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    occupation: str = Query(None),
    city: str = Query(None),
    db: Session = Depends(get_db)
):
    """Fetch paginated customer records. Filterable by occupation or city."""
    query = db.query(Customer)
    if occupation:
        query = query.filter(Customer.occupation == occupation)
    if city:
        query = query.filter(Customer.city == city)
        
    customers = query.offset(skip).limit(limit).all()
    
    return [
        CustomerBrief(
            customer_id=c.customer_id,
            name=c.name,
            age=c.age,
            occupation=c.occupation,
            annual_income=c.annual_income,
            relationship_years=c.relationship_years,
            city=c.city
        )
        for c in customers
    ]

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer_details(customer_id: str, db: Session = Depends(get_db)):
    """Fetch detailed customer telemetry: demographic, transactions, loan list, CRM logs, and computed financials."""
    profile = get_customer_by_id(db, customer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    transactions = get_customer_transactions(db, customer_id, months=12)
    loans = get_customer_loans(db, customer_id)
    crm_interactions = get_customer_crm_interactions(db, customer_id)
    financials = compute_financial_analytics(db, customer_id)
    
    return CustomerDetailResponse(
        profile=CustomerBrief(**profile),
        financials=financials,
        transactions=transactions,
        loans=loans,
        crm_interactions=crm_interactions
    )
