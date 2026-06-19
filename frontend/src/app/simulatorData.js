export const SIMULATOR_DATA = {
  1: {
    title: "Scenario 1: Personal Loan Campaign",
    query: "Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.",
    steps: [
      {
        id: "Planner Agent",
        title: "1. Planner",
        desc: "Intent & Filters",
        role: "Intent Detection & Parameter Parsing",
        description: "Analyzes the Relationship Manager's query to determine the target campaign type, minimum customer value thresholds, and demographic search boundaries.",
        tool: "llm_service.parse_query(prompt)",
        prompt: `System: You are Aura's campaign planner. Parse the RM query into JSON parameters.
RM Query: "Find high-value customers likely to convert for a personal loan this month..."

Output schema:
{
  "product_type": string,
  "min_annual_income": number,
  "age_limit": [min, max]
}`,
        thought: "Analyzing RM prompt. The target product is 'personal loan'. High-value in our banking dictionary defaults to annual income >= $80k. Setting target age limits to 22-60 to adhere to standard underwriting policy constraints.",
        code: `// planner.py - Under the hood LLM parsing
params = llm.parse_query_to_json(
    query="Find high-value customers likely to convert for a personal loan this month..."
)
# Returns:
# {
#   "product_type": "personal_loan",
#   "min_annual_income": 80000,
#   "age_limit": [22, 60]
# }`,
        sql: `/* No direct database queries in Planner Agent. Output state passed to Customer Intel node. */`,
        vector: `/* No vector queries executed in Planner Agent. */`,
        state: `{
  "target_product": "Personal Loan",
  "min_annual_income": 80000,
  "age_range": [22, 60],
  "agent_logs": ["Planner Agent configured demographics: Income >= $80k, Age 22-60."]
}`
      },
      {
        id: "Customer Intelligence Agent",
        title: "2. Customer Intel",
        desc: "Data Retrieval & Scoring",
        role: "Relational Demographics Retrieval",
        description: "Executes targeted SQL queries on the core relational customer database to retrieve demographic records matching the planner's criteria.",
        tool: "db_tools.search_customers(min_income=80000, age_range=[22, 60])",
        prompt: `System: Formulate and execute SQL search based on targeting parameters:
{ "min_income": 80000, "age_range": [22, 60] }`,
        thought: "Querying relational tables for customers earning $80k+ and aged 22-60. I will join core demographic tables to obtain occupation and relationship metrics.",
        code: `# customer_intel.py - Invoking relational search tools
candidates = db_tools.search_customers(
    min_income=state["min_annual_income"],
    min_age=state["age_range"][0],
    max_age=state["age_range"][1]
)`,
        sql: `SELECT 
  customer_id, name, annual_income, age, occupation, relationship_years
FROM customers 
WHERE annual_income >= 80000 
  AND age BETWEEN 22 AND 60;

/* Returns 3 rows:
 * 102 | Sarah Jenkins | 125,000 | 34 | Software Eng | 5 yrs
 * 104 | David Vance   | 145,000 | 45 | Consultant   | 3 yrs
 * 109 | Richard Wu    |  95,000 | 28 | Analyst      | 2 yrs
 */`,
        vector: `/* No vector database calls executed in this step. */`,
        state: `{
  "candidates": [
    { "id": 102, "name": "Sarah Jenkins", "income": 125000, "age": 34, "occupation": "Software Engineer" },
    { "id": 104, "name": "David Vance", "income": 145000, "age": 45, "occupation": "Business Consultant" },
    { "id": 109, "name": "Richard Wu", "income": 95000, "age": 28, "occupation": "Financial Analyst" }
  ],
  "agent_logs": ["Customer Intel retrieved 3 primary candidates via SQL database search."]
}`
      },
      {
        id: "Conversion Prediction Agent",
        title: "3. Conversion",
        desc: "Heuristic rules & prob",
        role: "Transactional Telemetry Analysis",
        description: "Queries transaction ledger and past loans. Computes average balances, savings ratios, and outstanding monthly EMIs to estimate loan conversion probability.",
        tool: "db_tools.get_transactions_and_loans(customer_ids=[102, 104, 109])",
        prompt: `System: Run telemetry mathematical parser to score candidates based on credit inflows and current debit defaults.`,
        thought: "Analyzing transactions over past 90 days. Sarah Jenkins has consistent $10k monthly salary credits and high balance maintenance ($18k avg). No outstanding loan EMIs. Set score: 88%. David Vance has high income but high EMIs ($4k/mo), lowering score to 65%. Richard Wu has lower balances, score: 55%.",
        code: `# conversion.py - Telemetry rules parser
for customer in candidates:
    txns = db_tools.get_transactions(customer.id)
    loans = db_tools.get_loans(customer.id)
    
    avg_bal = sum(t.amount for t in txns if t.type == 'credit') / 3
    active_emi = sum(l.monthly_emi for l in loans if l.status == 'active')
    
    prob = calculate_conversion_probability(avg_bal, active_emi, customer.income)`,
        sql: `SELECT * FROM transactions WHERE customer_id IN (102, 104, 109) AND txn_date >= DATE('now', '-90 days');
SELECT * FROM loan_history WHERE customer_id IN (102, 104, 109) AND status = 'active';

/* Results:
 * Sarah Jenkins: Salary Credits = $10,400/mo, Active Loans = 0, Avg Bal = $18,450
 * David Vance: Salary Credits = $12,080/mo, Active Loans = 2 ($3,200 EMI), Avg Bal = $9,120
 */`,
        vector: `/* No vector search. Telemetry analysis is performed mathematically. */`,
        state: `{
  "candidates": [
    { "id": 102, "name": "Sarah Jenkins", "income": 125000, "conversion_probability": 88, "avg_monthly_balance": 18450, "active_emi": 0 },
    { "id": 104, "name": "David Vance", "income": 145000, "conversion_probability": 65, "avg_monthly_balance": 9120, "active_emi": 3200 },
    { "id": 109, "name": "Richard Wu", "income": 95000, "conversion_probability": 55, "avg_monthly_balance": 4500, "active_emi": 800 }
  ],
  "agent_logs": ["Conversion Predictor estimated Sarah Jenkins at 88% probability due to zero debt liabilities."]
}`
      },
      {
        id: "Product Recommendation Agent",
        title: "4. Product Match",
        desc: "Eligibility Check",
        role: "Vector Policy Catalog Search",
        description: "Queries the ChromaDB vector database containing policy guidelines, credit criteria, and disclaimers to ensure matched candidates satisfy underwriting criteria.",
        tool: "vector_db.search_catalog(query='personal loan eligibility and rules')",
        prompt: `System: Query ChromaDB product catalog to retrieve underwriting criteria for 'Personal Loan'. Map retrieve texts to candidates.`,
        thought: "Querying ChromaDB 'products' collection. Retrieved policy PL_02: 'Unsecured personal loan requires Debt-To-Income (DTI) ratio under 40%'. Checking Sarah Jenkins: DTI is annual EMI ($0) / Income ($125k) = 0%. Approved. David Vance: DTI is $38,400 EMI / $145k Income = 26%. Approved with warnings.",
        code: `# recommendation.py - Semantic search on PDF guidelines
rules = vector_db.similarity_search(
    collection="products",
    query="personal loan underwriting guidelines",
    limit=2
)
# Retrieved Policy document PL_02 details:
# - Max Debt-To-Income (DTI) ratio: 40%
# - Interest Rate range: 9.5% - 14.5% APY`,
        sql: `/* No SQL queries. Running semantic similarity on ChromaDB vector collection. */`,
        vector: `ChromaDB: Querying Collection 'products'
Query Text: "personal loan underwriting guidelines"
Distance Metric: L2 Distance (Cosine Similarity)
Retrieved Document:
{
  "id": "PL_02",
  "content": "Aura Personal Loan Product Guidelines. Unsecured consumer credit line requires verified credit score > 680, Debt-To-Income (DTI) ratio under 40%. Interest rate starts at 9.5% for Platinum relationship customers. Required Disclaimer: 'Subject to credit approval. Terms apply.'"
}`,
        state: `{
  "candidates": [
    { "id": 102, "name": "Sarah Jenkins", "recommended_product": "Aura Premium Personal Loan", "status": "APPROVED", "rate": "9.5% APR", "disclaimer": "Subject to credit approval. Terms apply." }
  ],
  "agent_logs": ["Product Matcher retrieved policy document PL_02 from ChromaDB; confirmed Sarah Jenkins DTI complies."]
}`
      },
      {
        id: "Personalization Agent",
        title: "5. Personalization",
        desc: "Outreach Generation",
        role: "Compliant Outreach Generation",
        description: "Uses the LLM to draft highly customized outreach copies tailored to specific social channels (WhatsApp/Email) while injecting required disclaimers.",
        tool: "llm_service.generate_outreach(customer, product)",
        prompt: `System: Write a personalized WhatsApp text and email for Sarah Jenkins. Integrate name (Sarah), relationship age (5 years), pre-approved product (Aura Premium Personal Loan at 9.5%), and required disclaimer: "Subject to credit approval. Terms apply."`,
        thought: "Drafting copies. I'll make the WhatsApp copy punchy, direct, and emoji-friendly. Email copy will be formal and comprehensive. Both must include the compliance disclaimer at the bottom.",
        code: `# personalization.py - Drafting compliant content via Gemini/Groq
messages = llm.generate(
    system_prompt="You are a compliant financial marketer...",
    user_prompt=f"Draft outreach for {customer.name} matching rules..."
)`,
        sql: `/* No SQL queries executed. */`,
        vector: `/* No vector database calls executed in this step. */`,
        state: `{
  "outreach": {
    "whatsapp": "Hi Sarah! 🌟 As a valued Aura client for 5 years, we have exciting news. You are pre-approved for our Aura Premium Personal Loan at a special rate of 9.5% APR. Zero processing fees. Tap here to apply: crm.aura.bank/pl/102. Subject to credit approval. Terms apply.",
    "email": "Dear Sarah Jenkins,\\n\\nWe appreciate your continued trust in Aura Bank over the past 5 years. Based on your premier profile, you are pre-approved for an Aura Premium Personal Loan of up to $50,000 at a promotional interest rate of 9.5% APR...\\n\\nSincerely,\\nYour Aura RM\\n\\nDisclaimer: Subject to credit approval. Terms and conditions apply."
  },
  "agent_logs": ["Personalization Agent completed drafting BFSI-compliant WhatsApp and Email copies."]
}`
      },
      {
        id: "RM Summary Agent",
        title: "6. RM Summary",
        desc: "Campaign Dossier",
        role: "Campaign Dossier Aggregation",
        description: "Compiles the final analytical statistics, ranks targets, drafts an executive brief for the relationship manager, and logs the campaign run in the database.",
        tool: "llm_service.compile_dossier()",
        prompt: `System: Synthesize all agent logs and metrics into an executive relationship summary.`,
        thought: "Creating campaign dossier. Total targets: 1 (Sarah Jenkins is the primary target). Average conversion probability: 88%. Writing executive brief highlighting why Sarah Jenkins was selected (strong financial history, zero current debt). Logging the campaign results to SQL for RM tracking.",
        code: `# summary.py - Aggregating outputs and writing to history
dossier = {
    "total_targets": 1,
    "average_probability": 88,
    "primary_product": "Personal Loan",
    "executive_summary": "Campaign targets prime customers. Sarah Jenkins stands out...",
    "run_timestamp": "2026-06-19T11:55:00"
}
db.insert_campaign_history(dossier)`,
        sql: `INSERT INTO campaign_history (campaign_name, target_product, candidates_count, avg_probability, timestamp) 
VALUES ('Personal Loan Promo June', 'Personal Loan', 1, 88.0, '2026-06-19 11:55:00');

/* Recorded successfully in CRM Campaign table. */`,
        vector: `/* No vector database calls executed in this step. */`,
        state: `{
  "final_report": {
    "summary_statistics": {
      "total_targets": 1,
      "average_conversion_probability": 88,
      "dominant_product": "Personal Loan"
    },
    "executive_summary": "The multi-agent campaign scan identified Sarah Jenkins (Software Engineer) as the primary target for a Personal Loan. She has been with the bank for 5 years, maintains a healthy average monthly deposit balance of $18,450, and has zero current loan liabilities. Her estimated conversion probability is 88%. Outreach dispatches have been drafted and compliance-verified.",
    "top_customers": [
      {
        "customer_id": 102,
        "name": "Sarah Jenkins",
        "age": 34,
        "occupation": "Software Engineer",
        "annual_income": 125000,
        "avg_monthly_balance": 18450,
        "active_emi": 0,
        "value_score": 92,
        "recommended_product": "Aura Premium Personal Loan",
        "why": "High average balance ($18.4k), regular salary credits, and zero current debt liabilities makes her the ideal candidate for an unsecured credit line.",
        "reasons": [
          "Annual income of $125k exceeds high-value targeting floor of $80k.",
          "Maintains active deposit balances above recommended $10k limit.",
          "Zero active EMIs indicates high repayment capacity.",
          "Meets PL_02 DTI guidelines (<40%)."
        ],
        "whatsapp_message": "Hi Sarah! 🌟 As a valued Aura client for 5 years, we have exciting news. You are pre-approved for our Aura Premium Personal Loan at a special rate of 9.5% APR. Zero processing fees. Tap here to apply: crm.aura.bank/pl/102. Subject to credit approval. Terms apply.",
        "email_message": "Dear Sarah Jenkins,\\n\\nWe appreciate your continued trust in Aura Bank over the past 5 years. Based on your premier profile, you are pre-approved for an Aura Premium Personal Loan of up to $50,000 at a promotional interest rate of 9.5% APR...\\n\\nSincerely,\\nYour Aura RM\\n\\nDisclaimer: Subject to credit approval. Terms and conditions apply."
      }
    ]
  },
  "agent_logs": ["RM Summary Agent successfully logged campaign run 'Personal Loan Promo June' to database. Workflow completed."]
}`
      }
    ]
  },
  2: {
    title: "Scenario 2: Premium Credit Card Campaign",
    query: "Find customers suitable for a premium credit card and generate personalized email and WhatsApp outreach.",
    steps: [
      {
        id: "Planner Agent",
        title: "1. Planner",
        desc: "Intent & Filters",
        role: "Intent Detection & Parameter Parsing",
        description: "Analyzes the Relationship Manager's query to determine the target campaign type, minimum customer value thresholds, and demographic search boundaries.",
        tool: "llm_service.parse_query(prompt)",
        prompt: `System: Parse the RM credit card query. Set income threshold to $120k for premium cards.
RM Query: "Find customers suitable for a premium credit card..."`,
        thought: "Premium cards like Aura Infinite require a minimum income of $120k. Generating targets matching income criteria and flag credit cards.",
        code: `params = llm.parse_query_to_json(
    query="Find customers suitable for a premium credit card..."
)
# Returns: {"product_type": "credit_card", "min_annual_income": 120000}`,
        sql: `/* No SQL queries. */`,
        vector: `/* No vector queries. */`,
        state: `{
  "target_product": "Premium Credit Card",
  "min_annual_income": 120000,
  "agent_logs": ["Planner Agent set min_income threshold to $120k for Aura Infinite Credit Card."]
}`
      },
      {
        id: "Customer Intelligence Agent",
        title: "2. Customer Intel",
        desc: "Data Retrieval & Scoring",
        role: "Relational Demographics Retrieval",
        description: "Executes targeted SQL queries on the core relational customer database to retrieve demographic records matching the planner's criteria.",
        tool: "db_tools.search_customers(min_income=120000)",
        prompt: `System: Query customers with annual_income >= 120000.`,
        thought: "Searching SQL tables for customers earning $120k+. Join will retrieve occupation data.",
        code: `candidates = db_tools.search_customers(min_income=120000)`,
        sql: `SELECT customer_id, name, annual_income, age, occupation, relationship_years 
FROM customers 
WHERE annual_income >= 120000;

/* Returns 2 rows:
 * 104 | David Vance   | 145,000 | 45 | Consultant | 3 yrs
 * 112 | Clara Thorne  | 160,000 | 38 | Architect  | 6 yrs
 */`,
        vector: `/* No vector database calls. */`,
        state: `{
  "candidates": [
    { "id": 104, "name": "David Vance", "income": 145000, "age": 45, "occupation": "Business Consultant" },
    { "id": 112, "name": "Clara Thorne", "income": 160000, "age": 38, "occupation": "Lead Architect" }
  ],
  "agent_logs": ["Customer Intel retrieved 2 candidate records (David Vance, Clara Thorne) with annual income > $120k."]
}`
      },
      {
        id: "Conversion Prediction Agent",
        title: "3. Conversion",
        desc: "Heuristic rules & prob",
        role: "Transactional Telemetry Analysis",
        description: "Scans merchant transaction categories (travel, luxury, restaurants) to detect high discretionary spend patterns.",
        tool: "db_tools.get_transactions(customer_ids=[104, 112])",
        prompt: `System: Scan transactions for luxury category debits (e.g. Travel, Dining) over the last 90 days.`,
        thought: "David Vance spent $4,200 on flights and dining in 90 days. High likelihood for premium card benefits. Set score: 92%. Clara Thorne has high savings but moderate travel, set score: 78%.",
        code: `for customer in candidates:
    txns = db_tools.get_transactions(customer.id)
    travel_spend = sum(t.amount for t in txns if t.category in ['Travel', 'Dining'])
    prob = calculate_card_score(travel_spend, customer.income)`,
        sql: `SELECT category, SUM(amount) as total 
FROM transactions 
WHERE customer_id IN (104, 112) AND category IN ('Travel', 'Dining', 'Shopping') 
GROUP BY customer_id, category;

/* Results:
 * David Vance: Travel = $2,800, Dining = $1,400 (Discretionary: High)
 * Clara Thorne: Travel = $900, Dining = $600 (Discretionary: Medium)
 */`,
        vector: `/* No vector search. Telemetry parsed mathematically. */`,
        state: `{
  "candidates": [
    { "id": 104, "name": "David Vance", "income": 145000, "conversion_probability": 92, "avg_monthly_balance": 9120, "active_emi": 3200, "travel_spend": 4200 },
    { "id": 112, "name": "Clara Thorne", "income": 160000, "conversion_probability": 78, "avg_monthly_balance": 22400, "active_emi": 1500, "travel_spend": 1500 }
  ],
  "agent_logs": ["Conversion Predictor calculated 92% card conversion score for David Vance based on active travel expenses."]
}`
      },
      {
        id: "Product Recommendation Agent",
        title: "4. Product Match",
        desc: "Eligibility Check",
        role: "Vector Policy Catalog Search",
        description: "Queries ChromaDB to locate premium credit card parameters, fee structures, and rewards compliance rules.",
        tool: "vector_db.search_catalog(query='premium credit card terms and benefits')",
        prompt: `System: Query 'products' vector store for premium card eligibility. Check if candidates fulfill minimum income limits.`,
        thought: "Querying ChromaDB. Retrieved Doc CC_09: 'Aura Infinite Credit Card requires $120k min income. Benefits: 3x reward miles, airport lounge access. $495 annual fee. Disclaimer: Subject to credit check.' Both candidates earn > $120k. Status: APPROVED.",
        code: `# recommendation.py
card_rules = vector_db.similarity_search(
    collection="products",
    query="premium credit card terms and benefits",
    limit=1
)`,
        sql: `/* No SQL queries executed. */`,
        vector: `ChromaDB: Querying Collection 'products'
Query: "premium credit card terms and benefits"
Retrieved Document:
{
  "id": "CC_09",
  "content": "Aura Infinite Credit Card. Premium tier product. Minimum underwriting income threshold: $120,000. Features: Unlimited Airport lounge access, 3x Reward Points on Travel/Dining. Annual Fee: $495. Terms: Required credit limit start from $15,000. Disclaimer: 'Subject to credit check. Terms apply.'"
}`,
        state: `{
  "candidates": [
    { "id": 104, "name": "David Vance", "recommended_product": "Aura Infinite Credit Card", "status": "APPROVED", "fee": "$495/yr", "disclaimer": "Subject to credit check. Terms apply." }
  ],
  "agent_logs": ["Product Matcher retrieved card document CC_09; verified David Vance's income meets premium threshold."]
}`
      },
      {
        id: "Personalization Agent",
        title: "5. Personalization",
        desc: "Outreach Generation",
        role: "Compliant Outreach Generation",
        description: "Drafts high-quality outreach communications highlighting premium lounge perks and rewards miles.",
        tool: "llm_service.generate_outreach(customer, product)",
        prompt: `System: Draft email and WhatsApp message for David Vance promoting the Aura Infinite Card. Emphasize travel lounge access and 3x points. Add disclaimer: 'Subject to credit check. Terms apply.'`,
        thought: "Drafting premium outreach copy. Pointing out the customized travel rewards since Vance has active travel transactions in our database.",
        code: `messages = llm.generate_card_outreach(customer_info=David_Vance, card_rules=CC_09)`,
        sql: `/* No SQL queries. */`,
        vector: `/* No vector queries. */`,
        state: `{
  "outreach": {
    "whatsapp": "Hi David! ✈️ Upgrade your travel experience with the Aura Infinite Credit Card. Enjoy unlimited airport lounge access, 3x points on dining & flights, and a dedicated concierge. Tap to active your card: crm.aura.bank/cc/104. Subject to credit check. Terms apply.",
    "email": "Dear David Vance,\\n\\nBased on your exceptional status with Aura, we are delighted to invite you to upgrade to the Aura Infinite Credit Card. Designed for global travelers, it offers unlimited access to over 1,200 airport lounges and 3x points on dining and travel purchases...\\n\\nWarm regards,\\nAura Wealth Management\\n\\nDisclaimer: Subject to credit check. Terms apply."
  },
  "agent_logs": ["Personalization Agent drafted custom travel-focused copies for David Vance."]
}`
      },
      {
        id: "RM Summary Agent",
        title: "6. RM Summary",
        desc: "Campaign Dossier",
        role: "Campaign Dossier Aggregation",
        description: "Piles all agent statistics, registers the campaign in the system history, and summarizes the final proposal.",
        tool: "llm_service.compile_dossier()",
        prompt: `System: Synthesize agent logs and generate the campaign dossier summary.`,
        thought: "Synthesizing dossier. David Vance is the top candidate. Writing summary highlighting travel expenditures.",
        code: `db.insert_campaign_history({ "name": "Premium Card Launch", "targets": 1, "avg_prob": 92 })`,
        sql: `INSERT INTO campaign_history (campaign_name, target_product, candidates_count, avg_probability, timestamp) 
VALUES ('Premium Card Promo June', 'Infinite Credit Card', 1, 92.0, '2026-06-19 11:56:00');`,
        vector: `/* No vector queries. */`,
        state: `{
  "final_report": {
    "summary_statistics": {
      "total_targets": 1,
      "average_conversion_probability": 92,
      "dominant_product": "Aura Infinite Credit Card"
    },
    "executive_summary": "The multi-agent scan identified David Vance (Business Consultant) as the optimal candidate for the Aura Infinite Credit Card. Vance earns $145,000 annually and has logged high travel and dining expenditures ($4,200 in the last 90 days), indicating strong alignment with the product's premium features (lounge access, 3x points). Compliance checking approved the offer. High conversion likelihood is estimated at 92%.",
    "top_customers": [
      {
        "customer_id": 104,
        "name": "David Vance",
        "age": 45,
        "occupation": "Business Consultant",
        "annual_income": 145000,
        "avg_monthly_balance": 9120,
        "active_emi": 3200,
        "value_score": 85,
        "recommended_product": "Aura Infinite Credit Card",
        "why": "High discretionary spend on Travel and Dining ($4,200/90 days) makes him a perfect target for our premium travel rewards card. Meets the $120k minimum income criteria.",
        "reasons": [
          "Annual income of $145k meets the premium card floor ($120k).",
          "High transaction activity in airline, hospitality, and dining sectors.",
          "Consistently high credit card usage and credit history.",
          "Satisfies CC_09 underwriting conditions."
        ],
        "whatsapp_message": "Hi David! ✈️ Upgrade your travel experience with the Aura Infinite Credit Card. Enjoy unlimited airport lounge access, 3x points on dining & flights, and a dedicated concierge. Tap to active your card: crm.aura.bank/cc/104. Subject to credit check. Terms apply.",
        "email_message": "Dear David Vance,\\n\\nBased on your exceptional status with Aura, we are delighted to invite you to upgrade to the Aura Infinite Credit Card. Designed for global travelers, it offers unlimited access to over 1,200 airport lounges and 3x points on dining and travel purchases...\\n\\nWarm regards,\\nAura Wealth Management\\n\\nDisclaimer: Subject to credit check. Terms apply."
      }
    ]
  },
  "agent_logs": ["RM Summary Agent successfully logged campaign 'Premium Card Launch' to SQL. Simulation completed."]
}`
      }
    ]
  },
  3: {
    title: "Scenario 3: Dormant Customer Re-engagement",
    query: "Find dormant customers needing low-risk re-engagement offers and draft outreach messages.",
    steps: [
      {
        id: "Planner Agent",
        title: "1. Planner",
        desc: "Intent & Filters",
        role: "Intent Detection & Parameter Parsing",
        description: "Identifies dormant accounts with high cash balances but very low transaction counts in the last 90 days, targeting low-risk yield products.",
        tool: "llm_service.parse_query(prompt)",
        prompt: `System: Parse re-engagement query. Set dormancy parameters to < 3 transactions per month.`,
        thought: "Dormant customer campaign requires identifying customers with low transaction volume (<3 per month) and highlighting a low-risk product (High-Yield Savings at 4.5% APY) to entice reactivation.",
        code: `params = llm.parse_query_to_json(
    query="Find dormant customers needing low-risk re-engagement..."
)
# Returns: {"product_type": "savings", "max_transactions_30d": 2}`,
        sql: `/* No SQL queries. */`,
        vector: `/* No vector queries. */`,
        state: `{
  "target_product": "High-Yield Savings Account",
  "max_transactions_30d": 2,
  "agent_logs": ["Planner Agent configured dormancy definition: <= 2 transactions per month."]
}`
      },
      {
        id: "Customer Intelligence Agent",
        title: "2. Customer Intel",
        desc: "Data Retrieval & Scoring",
        role: "Relational Demographics Retrieval",
        description: "Executes targeted SQL queries on the core relational customer database to retrieve demographic records matching the planner's criteria.",
        tool: "db_tools.search_dormant_customers(max_txns=2)",
        prompt: `System: Find customers with <= 2 transactions in the past 30 days.`,
        thought: "Running SQL query to aggregate transactions per customer and filter where transaction count <= 2.",
        code: `candidates = db_tools.search_inactive(max_txns=2)`,
        sql: `SELECT 
  c.customer_id, c.name, c.annual_income, c.relationship_years, COUNT(t.txn_id) as txn_count
FROM customers c
LEFT JOIN transactions t ON c.customer_id = t.customer_id AND t.txn_date >= DATE('now', '-30 days')
GROUP BY c.customer_id
HAVING COUNT(t.txn_id) <= 2;

/* Returns 1 row:
 * 107 | Robert Miller | 68,000 | 8 yrs | 1 transaction
 */`,
        vector: `/* No vector database calls. */`,
        state: `{
  "candidates": [
    { "id": 107, "name": "Robert Miller", "income": 68000, "age": 52, "occupation": "Retired Teacher" }
  ],
  "agent_logs": ["Customer Intel retrieved 1 dormant customer (Robert Miller) with only 1 transaction in the last 30 days."]
}`
      },
      {
        id: "Conversion Prediction Agent",
        title: "3. Conversion",
        desc: "Heuristic rules & prob",
        role: "Transactional Telemetry Analysis",
        description: "Scans historical accounts to check balances. Inactive accounts with large idle deposits represent ideal targets for high-yield products.",
        tool: "db_tools.get_account_balance(customer_id=107)",
        prompt: `System: Check total balances of inactive accounts. If balance is > $10,000, mark as high re-engagement likelihood.`,
        thought: "Robert Miller has $25,200 idle in his checking account. High yield interest of 4.5% is an attractive hook. High conversion likelihood set to 85%.",
        code: `for customer in candidates:
    bal = db_tools.get_balance(customer.id)
    prob = calculate_savings_conversion(bal)`,
        sql: `SELECT SUM(amount) as balance FROM transactions WHERE customer_id = 107;
/* Result: Total deposit balance = $25,200. Idle status confirmed. */`,
        vector: `/* No vector queries. */`,
        state: `{
  "candidates": [
    { "id": 107, "name": "Robert Miller", "income": 68000, "conversion_probability": 85, "avg_monthly_balance": 25200, "active_emi": 0 }
  ],
  "agent_logs": ["Conversion Predictor estimated 85% re-engagement probability for Robert Miller due to $25k idle funds."]
}`
      },
      {
        id: "Product Recommendation Agent",
        title: "4. Product Match",
        desc: "Eligibility Check",
        role: "Vector Policy Catalog Search",
        description: "Searches ChromaDB vector catalogs for active savings promotions and yields.",
        tool: "vector_db.search_catalog(query='high yield savings promotions')",
        prompt: `System: Query products store for savings offers.`,
        thought: "Querying ChromaDB savings guidelines. Retrieved Doc SAV_04: 'Aura Yield Maximizer offers 4.5% APY for balances >= $10,000. Underwriting condition: Must be active RM account.' Robert Miller holds $25.2k. APPROVED.",
        code: `# recommendation.py
savings_rules = vector_db.similarity_search(
    collection="products",
    query="high yield savings promotions",
    limit=1
)`,
        sql: `/* No SQL queries. */`,
        vector: `ChromaDB: Querying Collection 'products'
Query: "high yield savings promotions"
Retrieved Document:
{
  "id": "SAV_04",
  "content": "Aura Yield Maximizer Account. Promotional High-Yield Deposit rate: 4.5% APY. Minimum balance requirement: $10,000. Interest paid monthly. Safe and FDIC-insured. Required Disclaimer: 'Rates variable. FDIC-insured up to $250k.'"
}`,
        state: `{
  "candidates": [
    { "id": 107, "name": "Robert Miller", "recommended_product": "Aura Yield Maximizer", "status": "APPROVED", "apy": "4.5%", "disclaimer": "Rates variable. FDIC-insured up to $250k." }
  ],
  "agent_logs": ["Product Matcher matched SAV_04 yield maximizer guidelines to Robert Miller's $25.2k idle balance."]
}`
      },
      {
        id: "Personalization Agent",
        title: "5. Personalization",
        desc: "Outreach Generation",
        role: "Compliant Outreach Generation",
        description: "Drafts WhatsApp re-engagement offer highlighting 4.5% APY and the required FDIC safety disclaimer.",
        tool: "llm_service.generate_outreach(customer, product)",
        prompt: `System: Draft WhatsApp outreach for Robert Miller. Promote Aura Yield Maximizer at 4.5% APY. Add disclaimer: 'Rates variable. FDIC-insured.'`,
        thought: "Drafting friendly, low-stress re-activation copy. Highlighting the 4.5% APY rate to put his idle money to work.",
        code: `messages = llm.generate_savings_outreach(customer_info=Robert_Miller, savings_rules=SAV_04)`,
        sql: `/* No SQL queries. */`,
        vector: `/* No vector queries. */`,
        state: `{
  "outreach": {
    "whatsapp": "Hello Robert! We notice you aren't getting the most out of your cash. Let your money work for you by reactivating your account and unlocking 4.5% APY with the Aura Yield Maximizer. Learn more: crm.aura.bank/yield/107. Rates variable. FDIC-insured.",
    "email": "Dear Robert Miller,\\n\\nWe value your long-term relationship with Aura Bank. We noticed your account has had low activity recently. We would like to help you maximize your returns by introducing the Aura Yield Maximizer, yielding a premium 4.5% APY on deposits over $10,000...\\n\\nWarm regards,\\nAura Relationship Team\\n\\nDisclaimer: Rates variable. FDIC-insured up to $250,000."
  },
  "agent_logs": ["Personalization Agent drafted custom savings activation message for Robert Miller."]
}`
      },
      {
        id: "RM Summary Agent",
        title: "6. RM Summary",
        desc: "Campaign Dossier",
        role: "Campaign Dossier Aggregation",
        description: "Summarizes the campaign run statistics and records the re-engagement campaign to the relational history logs.",
        tool: "llm_service.compile_dossier()",
        prompt: `System: Aggregate logs for re-engagement dossier.`,
        thought: "Compiling campaign dossier. 1 customer flagged (Robert Miller). Average conversion: 85%. Logging campaign run in SQL.",
        code: `db.insert_campaign_history({ "name": "Dormant Reactivation", "targets": 1, "avg_prob": 85 })`,
        sql: `INSERT INTO campaign_history (campaign_name, target_product, candidates_count, avg_probability, timestamp) 
VALUES ('Dormant Reactivation June', 'Yield Maximizer Savings', 1, 85.0, '2026-06-19 11:57:00');`,
        vector: `/* No vector queries. */`,
        state: `{
  "final_report": {
    "summary_statistics": {
      "total_targets": 1,
      "average_conversion_probability": 85,
      "dominant_product": "Aura Yield Maximizer"
    },
    "executive_summary": "The multi-agent scan isolated Robert Miller (Retired Teacher) as highly eligible for a dormant re-engagement offer. Miller maintains an idle balance of $25,200 in his checking account, but has registered only 1 transaction in the last 30 days. To re-engage Miller, the agents recommend offering the Aura Yield Maximizer high-yield savings account (4.5% APY) to put his idle funds to work. Re-activation dispatches have been drafted.",
    "top_customers": [
      {
        "customer_id": 107,
        "name": "Robert Miller",
        "age": 52,
        "occupation": "Retired Teacher",
        "annual_income": 68000,
        "avg_monthly_balance": 25200,
        "active_emi": 0,
        "value_score": 79,
        "recommended_product": "Aura Yield Maximizer",
        "why": "Maintains $25,200 idle checking account deposits while having only 1 transaction in the last 30 days. High-yield savings re-engagement offers a low-risk incentive to reactivate.",
        "reasons": [
          "Transaction count in 30 days (1) complies with dormancy rules (<=2).",
          "Maintains over $10,000 in idle cash ($25,200).",
          "No current loan defaults, qualifying for easy account upgrades.",
          "Satisfies SAV_04 savings catalog conditions."
        ],
        "whatsapp_message": "Hello Robert! We notice you aren't getting the most out of your cash. Let your money work for you by reactivating your account and unlocking 4.5% APY with the Aura Yield Maximizer. Learn more: crm.aura.bank/yield/107. Rates variable. FDIC-insured.",
        "email_message": "Dear Robert Miller,\\n\\nWe value your long-term relationship with Aura Bank. We noticed your account has had low activity recently. We would like to help you maximize your returns by introducing the Aura Yield Maximizer, yielding a premium 4.5% APY on deposits over $10,000...\\n\\nWarm regards,\\nAura Relationship Team\\n\\nDisclaimer: Rates variable. FDIC-insured up to $250,000."
      }
    ]
  },
  "agent_logs": ["RM Summary Agent successfully logged campaign 'Dormant Reactivation' to SQL. Simulation completed."]
}`
      }
    ]
  }
};
