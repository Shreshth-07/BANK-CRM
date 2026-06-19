import os
import chromadb
from app.config import CHROMA_DB_PATH

def setup_chroma():
    print(f"Initializing ChromaDB client at: {CHROMA_DB_PATH}")
    os.makedirs(CHROMA_DB_PATH, exist_ok=True)
    
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    
    # 1. Product Policies Collection
    print("Setting up 'products' collection...")
    # Delete if exists to avoid duplication during development
    try:
        client.delete_collection("products")
    except Exception:
        pass
        
    products_col = client.create_collection("products")
    
    products_data = [
        {
            "id": "prod_personal_loan",
            "document": "Personal Loan Product Sheet. Interest Rate: 8.99% - 13.49% fixed APR. Tenure: 12 to 72 months. Minimum Annual Income: $45,000. Underwriting Criteria: Requires regular salary credits for at least 6 months, no active defaults. Purpose: renovation, debt consolidation, wedding, medical emergencies. Compliance: Must display APR transparently. Standard disclaimer: 'Subject to credit approval.'",
            "metadata": {"category": "loan", "name": "Personal Loan", "min_income": 45000}
        },
        {
            "id": "prod_premium_credit_card",
            "document": "Apex Elite Premium Credit Card. Annual Fee: $495. Target Audience: High-Net-Worth individuals, frequent travelers. Eligibility: Minimum income $120,000, high credit score. Benefits: Unlimited airport VIP lounge access, 5x travel reward points on flight bookings, complimentary concierge service, comprehensive travel insurance coverage. Special criteria: high discretionary spending on entertainment/travel.",
            "metadata": {"category": "card", "name": "Apex Elite Credit Card", "min_income": 120000}
        },
        {
            "id": "prod_wealth_management",
            "document": "Wealth Builder Advisory Portfolio. Minimun Assets Under Management (AUM): $100,000. Target: Customers looking for long-term capital growth, high income earners. Products: Customized Mutual Funds, tax-exempt municipal bonds, private equity access. Advisory fees: 1.0% annual AUM fee. Underwriting: requires high average savings balance or recent large transfer.",
            "metadata": {"category": "wealth", "name": "Wealth Builder Portfolio", "min_income": 100000}
        },
        {
            "id": "prod_savings_max",
            "document": "High Yield Platinum Savings Account. APY: 4.65%. Minimum deposit: $25,000 to waive the $25 monthly maintenance fee. target: conservative investors, high savers. Features: Instant transfers, unlimited ATM fee reimbursements worldwide. Ideal for customers with high monthly average balance.",
            "metadata": {"category": "savings", "name": "Platinum Savings", "min_income": 30000}
        }
    ]
    
    products_col.add(
        ids=[p["id"] for p in products_data],
        documents=[p["document"] for p in products_data],
        metadatas=[p["metadata"] for p in products_data]
    )
    print(f"Indexed {products_col.count()} banking products.")

    # 2. Unstructured CRM Notes Collection
    print("Setting up 'crm_notes' collection...")
    try:
        client.delete_collection("crm_notes")
    except Exception:
        pass
        
    crm_col = client.create_collection("crm_notes")
    
    # We index semantic notes for customers so Customer Intel or Planner Agent can query them.
    from app.database import SessionLocal
    from app.models import CRMInteraction, Customer
    
    db = SessionLocal()
    try:
        special_ids = [f"CUST-{i:04d}" for i in range(1, 76)]
        interactions = db.query(CRMInteraction).join(Customer).filter(CRMInteraction.customer_id.in_(special_ids)).all()
        
        crm_notes_data = []
        for inter in interactions:
            doc_text = f"Customer {inter.customer.name} CRM interaction note: {inter.notes}"
            crm_notes_data.append({
                "id": f"note_{inter.interaction_id}",
                "document": doc_text,
                "metadata": {
                    "customer_id": inter.customer_id,
                    "type": inter.interaction_type.lower() + "_note",
                    "intent": "high" if any(kw in inter.notes.lower() for kw in ["loan", "card", "rewards", "lounge", "interest"]) else "medium"
                }
            })
    finally:
        db.close()
    
    crm_col.add(
        ids=[c["id"] for c in crm_notes_data],
        documents=[c["document"] for c in crm_notes_data],
        metadatas=[c["metadata"] for c in crm_notes_data]
    )
    print(f"Indexed {crm_col.count()} customer CRM interaction notes.")
    print("Vector database setup completed successfully!")

if __name__ == "__main__":
    setup_chroma()
