import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Customer, Transaction, CRMInteraction, LoanHistory

# Set random seed for deterministic generation if needed
random.seed(42)

def clear_db(db: Session):
    print("Clearing existing database tables...")
    # Order matters due to foreign key constraints
    db.query(Transaction).delete()
    db.query(CRMInteraction).delete()
    db.query(LoanHistory).delete()
    db.query(Customer).delete()
    db.commit()

def generate_random_date(start_date: datetime, end_date: datetime) -> datetime:
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    random_seconds = random.randint(0, 86400)
    return start_date + timedelta(days=random_days, seconds=random_seconds)

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        clear_db(db)
        print("Starting database seeding...")

        # Setup standard lists for generators
        cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", 
                  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"]
        
        occupations_config = {
            "Software Engineer": {"min_inc": 90000, "max_inc": 190000},
            "Doctor": {"min_inc": 160000, "max_inc": 380000},
            "Teacher": {"min_inc": 45000, "max_inc": 80000},
            "Business Owner": {"min_inc": 120000, "max_inc": 450000},
            "Consultant": {"min_inc": 80000, "max_inc": 170000},
            "Accountant": {"min_inc": 65000, "max_inc": 110000},
            "Nurse": {"min_inc": 60000, "max_inc": 115000},
            "Sales Manager": {"min_inc": 75000, "max_inc": 140000},
            "Retired": {"min_inc": 30000, "max_inc": 65000},
            "Student": {"min_inc": 5000, "max_inc": 20000}
        }
        
        # We need to generate 1000 customers.
        # Let's pre-generate the specific profiles for the 3 demo scenarios to ensure they match exactly!
        
        special_customers = [
            # Scenario 1: High value customer likely to convert for a Personal Loan
            {
                "id": "CUST-0001",
                "name": "Sarah Jenkins",
                "age": 34,
                "city": "San Francisco",
                "occupation": "Software Engineer",
                "annual_income": 165000,
                "relationship_years": 4,
                "target_scenario": 1,
                "note": "Customer called the service center inquiring about current interest rates for personal loans. Asked about the processing time and documents required for pre-approval."
            },
            # Scenario 2: Customer suitable for Premium Credit Card
            {
                "id": "CUST-0002",
                "name": "David Vance",
                "age": 45,
                "city": "New York",
                "occupation": "Business Owner",
                "annual_income": 320000,
                "relationship_years": 8,
                "target_scenario": 2,
                "note": "Inquired about premium credit card rewards during an in-branch visit. Specifically asked about travel rewards, international lounge access, and concierge benefits."
            },
            # Scenario 3: Dormant customer needing re-engagement
            {
                "id": "CUST-0003",
                "name": "Robert Miller",
                "age": 68,
                "city": "Chicago",
                "occupation": "Retired",
                "annual_income": 38000,
                "relationship_years": 12,
                "target_scenario": 3,
                "note": "Customer account flag indicates high inactivity. Last CRM contact was a routine address update inquiry 9 months ago. No recent complaints or deposits."
            }
        ]

        # Let's seed more special customers for statistical richness in searches
        for i in range(4, 76):
            scenario_type = random.choice([1, 2, 3])
            cid = f"CUST-{i:04d}"
            
            if scenario_type == 1:
                # High-value, loan inquiries
                occ = random.choice(["Software Engineer", "Consultant", "Doctor"])
                inc = random.randint(110000, 220000)
                special_customers.append({
                    "id": cid,
                    "name": f"Loan Target {i}",
                    "age": random.randint(28, 48),
                    "city": random.choice(cities),
                    "occupation": occ,
                    "annual_income": inc,
                    "relationship_years": random.randint(2, 6),
                    "target_scenario": 1,
                    "note": f"Emailed seeking loan calculation spreadsheet. Mentioned planning a home renovation project next month."
                })
            elif scenario_type == 2:
                # Premium card targets
                occ = random.choice(["Doctor", "Business Owner"])
                inc = random.randint(200000, 400000)
                special_customers.append({
                    "id": cid,
                    "name": f"Premium Card Target {i}",
                    "age": random.randint(35, 55),
                    "city": random.choice(cities),
                    "occupation": occ,
                    "annual_income": inc,
                    "relationship_years": random.randint(4, 15),
                    "target_scenario": 2,
                    "note": f"Inquired about premium cards. Spends heavily on international flights and upscale dining."
                })
            else:
                # Dormant profiles
                occ = random.choice(["Retired", "Student", "Teacher"])
                inc = random.randint(15000, 50000)
                special_customers.append({
                    "id": cid,
                    "name": f"Dormant Target {i}",
                    "age": random.randint(20, 75),
                    "city": random.choice(cities),
                    "occupation": occ,
                    "annual_income": inc,
                    "relationship_years": random.randint(5, 12),
                    "target_scenario": 3,
                    "note": f"Account shows zero active interaction. Last automated notification sent in January."
                })

        # Pre-populate list of customer DB objects to save in bulk
        customers_to_save = []
        loans_to_save = []
        transactions_to_save = []
        interactions_to_save = []

        total_customers_count = 1000
        special_ids = {c["id"] for c in special_customers}

        # Build regular customer list
        all_customers_data = []
        for c in special_customers:
            all_customers_data.append(c)

        first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
                       "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
                       "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                      "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                      "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

        # Generate the remaining customers to reach 1,000
        for i in range(len(special_customers) + 1, total_customers_count + 1):
            cid = f"CUST-{i:04d}"
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            occ = random.choice(list(occupations_config.keys()))
            limits = occupations_config[occ]
            inc = random.randint(limits["min_inc"], limits["max_inc"])
            age = random.randint(18, 75) if occ != "Retired" else random.randint(62, 85)
            if occ == "Student":
                age = random.randint(18, 25)
            
            all_customers_data.append({
                "id": cid,
                "name": name,
                "age": age,
                "city": random.choice(cities),
                "occupation": occ,
                "annual_income": inc,
                "relationship_years": random.randint(1, 15),
                "target_scenario": None,
                "note": None
            })

        # 12 Months time window
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        for c_data in all_customers_data:
            customer = Customer(
                customer_id=c_data["id"],
                name=c_data["name"],
                age=c_data["age"],
                city=c_data["city"],
                occupation=c_data["occupation"],
                annual_income=c_data["annual_income"],
                relationship_years=c_data["relationship_years"]
            )
            customers_to_save.append(customer)

            # Determine existing loans
            # High-income/high-value customers might have mortgage/home loans.
            # Normal customers might have auto loans or none.
            # Special Scenario 3 (dormant) might have an auto loan but closed or rejected loans.
            # Let's seed loans.
            has_loan = random.random() < 0.45
            if c_data["target_scenario"] == 1:
                # No active loans, makes them better loan conversion targets
                has_loan = False
            
            if has_loan:
                l_type = random.choice(["Home", "Auto", "Credit Card"])
                status = random.choice(["Active", "Closed"])
                if status == "Active":
                    l_amount = random.randint(20000, 300000) if l_type == "Home" else random.randint(15000, 45000)
                    monthly_emi = (l_amount / 120) * 1.1 # Rough estimation
                    loan = LoanHistory(
                        loan_id=f"LN-{uuid.uuid4().hex[:12].upper()}",
                        customer_id=customer.customer_id,
                        loan_type=l_type,
                        status=status,
                        amount=l_amount,
                        monthly_emi=round(monthly_emi, 2)
                    )
                    loans_to_save.append(loan)
                else:
                    # Closed loan
                    loan = LoanHistory(
                        loan_id=f"LN-{uuid.uuid4().hex[:12].upper()}",
                        customer_id=customer.customer_id,
                        loan_type=random.choice(["Personal", "Auto"]),
                        status="Closed",
                        amount=random.randint(10000, 30000),
                        monthly_emi=0.0
                    )
                    loans_to_save.append(loan)

            # Let's seed some CRM interactions
            # Seed the explicit notes for target candidates
            if c_data["note"]:
                interaction = CRMInteraction(
                    interaction_id=f"CRM-{uuid.uuid4().hex[:12].upper()}",
                    customer_id=customer.customer_id,
                    interaction_type=random.choice(["Call", "Email", "In-Person"]),
                    notes=c_data["note"],
                    timestamp=datetime.now() - timedelta(days=random.randint(1, 10))
                )
                interactions_to_save.append(interaction)
            
            # Seed generic CRM interactions
            num_interactions = random.randint(1, 6)
            if c_data["target_scenario"] == 3: # Dormant
                num_interactions = 1
            
            for k in range(num_interactions):
                # Ensure date is older if dormant
                if c_data["target_scenario"] == 3:
                    days_ago = random.randint(150, 300)
                else:
                    days_ago = random.randint(5, 350)
                
                # Check if note already exists
                if k == 0 and c_data["note"]:
                    continue
                
                notes_pool = [
                    "Discussed savings account interest options.",
                    "Inquired about credit card renewal fees.",
                    "Updated account mailing address and phone number.",
                    "Called regarding a minor mobile banking app login error. Resolved.",
                    "Received confirmation of quarterly account statement.",
                    "Visited branch to withdraw cashier's check.",
                    "Inquired about fixed deposit interest rate tier requirements."
                ]
                interaction = CRMInteraction(
                    interaction_id=f"CRM-{uuid.uuid4().hex[:12].upper()}",
                    customer_id=customer.customer_id,
                    interaction_type=random.choice(["Call", "Email", "In-Person", "Web Chat"]),
                    notes=random.choice(notes_pool),
                    timestamp=datetime.now() - timedelta(days=days_ago)
                )
                interactions_to_save.append(interaction)

        # Generate transactions (at least 10,000 total)
        # Average transactions per customer = 10,000 / 1,000 = 10 per customer
        for customer in customers_to_save:
            c_data = next(c for c in all_customers_data if c["id"] == customer.customer_id)
            monthly_sal = customer.annual_income / 12
            
            # Scenario 3: Dormant customers (no transactions in the last 4 months)
            is_dormant = (c_data["target_scenario"] == 3)
            
            # We seed a year's transactions
            for month_offset in range(12):
                month_date = start_date + timedelta(days=month_offset * 30.5)
                
                # If dormant, skip transactions in the last 4 months (month_offset >= 8)
                if is_dormant and month_offset >= 8:
                    continue
                
                # 1. Salary Credit
                sal_date = month_date + timedelta(days=random.randint(1, 4))
                transactions_to_save.append(Transaction(
                    txn_id=f"TXN-{uuid.uuid4().hex.upper()}",
                    customer_id=customer.customer_id,
                    amount=round(monthly_sal, 2),
                    txn_type="CREDIT",
                    txn_date=sal_date,
                    category="Salary"
                ))

                # 2. Rent/Mortgage debit
                rent_date = month_date + timedelta(days=5)
                rent_amount = monthly_sal * random.uniform(0.20, 0.30)
                transactions_to_save.append(Transaction(
                    txn_id=f"TXN-{uuid.uuid4().hex.upper()}",
                    customer_id=customer.customer_id,
                    amount=round(rent_amount, 2),
                    txn_type="DEBIT",
                    txn_date=rent_date,
                    category="Rent"
                ))

                # 3. Groceries
                for _ in range(random.randint(2, 4)):
                    g_date = month_date + timedelta(days=random.randint(1, 28))
                    transactions_to_save.append(Transaction(
                        txn_id=f"TXN-{uuid.uuid4().hex.upper()}",
                        customer_id=customer.customer_id,
                        amount=round(random.uniform(50, 250), 2),
                        txn_type="DEBIT",
                        txn_date=g_date,
                        category="Groceries"
                    ))

                # 4. Utilities
                u_date = month_date + timedelta(days=random.randint(10, 15))
                transactions_to_save.append(Transaction(
                    txn_id=f"TXN-{uuid.uuid4().hex.upper()}",
                    customer_id=customer.customer_id,
                    amount=round(random.uniform(70, 180), 2),
                    txn_type="DEBIT",
                    txn_date=u_date,
                    category="Utilities"
                ))

                # 5. Entertainment
                for _ in range(random.randint(1, 3)):
                    e_date = month_date + timedelta(days=random.randint(1, 28))
                    # Let's seed higher entertainment spending for Premium Card candidates (Scenario 2)
                    if c_data["target_scenario"] == 2:
                        e_amount = random.uniform(200, 800)
                    else:
                        e_amount = random.uniform(30, 150)
                    
                    transactions_to_save.append(Transaction(
                        txn_id=f"TXN-{uuid.uuid4().hex.upper()}",
                        customer_id=customer.customer_id,
                        amount=round(e_amount, 2),
                        txn_type="DEBIT",
                        txn_date=e_date,
                        category="Entertainment"
                    ))

                # 6. Active Loan Payments (If any)
                c_active_loans = [l for l in loans_to_save if l.customer_id == customer.customer_id and l.status == "Active"]
                for active_loan in c_active_loans:
                    loan_date = month_date + timedelta(days=10)
                    transactions_to_save.append(Transaction(
                        txn_id=f"TXN-{uuid.uuid4().hex.upper()}",
                        customer_id=customer.customer_id,
                        amount=active_loan.monthly_emi,
                        txn_type="DEBIT",
                        txn_date=loan_date,
                        category="Loan Repayment"
                    ))

        # Save all objects in batches for extreme speed and robustness
        print(f"Adding {len(customers_to_save)} customers...")
        db.add_all(customers_to_save)
        db.commit()

        print(f"Adding {len(loans_to_save)} loan records...")
        db.add_all(loans_to_save)
        db.commit()

        print(f"Adding {len(interactions_to_save)} CRM interaction logs...")
        db.add_all(interactions_to_save)
        db.commit()

        print(f"Adding {len(transactions_to_save)} transaction entries...")
        # Break transaction writes into batches of 2000 items to avoid DB locks
        batch_size = 2000
        for offset in range(0, len(transactions_to_save), batch_size):
            db.add_all(transactions_to_save[offset:offset+batch_size])
            db.commit()
            print(f"  Inserted {min(offset+batch_size, len(transactions_to_save))}/{len(transactions_to_save)} transactions")

        print("Seeding process completed successfully!")
        
        # Verify seeding numbers
        cust_cnt = db.query(Customer).count()
        txn_cnt = db.query(Transaction).count()
        loan_cnt = db.query(LoanHistory).count()
        crm_cnt = db.query(CRMInteraction).count()
        
        print(f"--- Verification Report ---")
        print(f"Total Customers in DB: {cust_cnt}")
        print(f"Total Transactions in DB: {txn_cnt}")
        print(f"Total Loans in DB: {loan_cnt}")
        print(f"Total CRM Logs in DB: {crm_cnt}")
        print(f"---------------------------")
        
    except Exception as e:
        db.rollback()
        print(f"Seeding failed due to exception: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
