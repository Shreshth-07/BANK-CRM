from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    city = Column(String, nullable=False)
    occupation = Column(String, nullable=False)
    annual_income = Column(Float, nullable=False)
    relationship_years = Column(Integer, nullable=False)

    # Relationships
    transactions = relationship("Transaction", back_populates="customer", cascade="all, delete-orphan")
    crm_interactions = relationship("CRMInteraction", back_populates="customer", cascade="all, delete-orphan")
    loans = relationship("LoanHistory", back_populates="customer", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    txn_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    txn_type = Column(String, nullable=False)  # 'CREDIT' or 'DEBIT'
    txn_date = Column(DateTime, nullable=False)
    category = Column(String, nullable=False)  # 'Salary', 'Groceries', 'Utilities', 'Rent', 'Loan Repayment', 'Transfer', 'Entertainment', etc.

    # Relationships
    customer = relationship("Customer", back_populates="transactions")


class CRMInteraction(Base):
    __tablename__ = "crm_interactions"

    interaction_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False)
    interaction_type = Column(String, nullable=False)  # 'Call', 'Email', 'In-Person', 'Web Chat', 'Support Ticket'
    notes = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="crm_interactions")


class LoanHistory(Base):
    __tablename__ = "loan_history"

    loan_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False)
    loan_type = Column(String, nullable=False)  # 'Personal', 'Home', 'Auto', 'Education', 'Credit Card'
    status = Column(String, nullable=False)  # 'Active', 'Closed', 'Applied', 'Rejected'
    amount = Column(Float, nullable=False)
    monthly_emi = Column(Float, default=0.0)

    # Relationships
    customer = relationship("Customer", back_populates="loans")
