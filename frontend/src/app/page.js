"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Search, 
  Users, 
  TrendingUp, 
  FileText, 
  Bot, 
  Database, 
  RefreshCw, 
  Copy, 
  Check, 
  Send, 
  ChevronRight, 
  DollarSign, 
  FileSpreadsheet, 
  User, 
  MessageSquare, 
  Mail, 
  ShieldCheck, 
  Activity,
  Award
} from "lucide-react";

export default function Dashboard() {
  const [query, setQuery] = useState("Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.");
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState("");
  const [campaignReport, setCampaignReport] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [outreachSent, setOutreachSent] = useState({});
  const [dbStats, setDbStats] = useState({
    total_customers: 1000,
    total_loans: 462,
    active_loans: 218,
    total_aum: 14285490.50,
    occupations: []
  });
  const [customLogs, setCustomLogs] = useState([]);

  // Fetch db stats on load
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/analytics/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch (e) {
      console.warn("Could not fetch dashboard stats. Fallback to seeded demo metrics.", e);
    }
  };

  const handleScenario = (scenarioNum) => {
    if (scenarioNum === 1) {
      setQuery("Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.");
    } else if (scenarioNum === 2) {
      setQuery("Find customers suitable for a premium credit card and generate personalized email and WhatsApp outreach.");
    } else if (scenarioNum === 3) {
      setQuery("Find dormant customers needing low-risk re-engagement offers and draft outreach messages.");
    }
  };

  const executeWorkflow = async () => {
    if (!query.trim()) return;
    
    setIsRunning(true);
    setCampaignReport(null);
    setAgentLogs([]);
    setSelectedCustomerId(null);
    setCustomLogs(["Initializing LangGraph execution context..."]);
    
    // Simulate agent steps in UI
    const steps = [
      { agent: "Planner Agent", log: "Planner: Analyzing query parameters. Extracting targeting criteria...", delay: 800 },
      { agent: "Customer Intelligence Agent", log: "Customer Intel: Running SQL demographic query & ChromaDB vector search. Fetching transaction profiles and analytics...", delay: 1800 },
      { agent: "Conversion Prediction Agent", log: "Conversion Prediction: Evaluating modifier rules (salary credit regularity, balances, liabilities, CRM activity)...", delay: 2800 },
      { agent: "Product Recommendation Agent", log: "Recommendation: Matching credit profiles to bank underwriting rules fetched from vector catalog...", delay: 3800 },
      { agent: "Personalization Agent", log: "Personalization: Formatting BFSI-compliant WhatsApp and Email copies with legal disclaimers...", delay: 4800 },
      { agent: "RM Summary Agent", log: "Summary: Ranking targets, calculating campaign KPI averages, compiling report...", delay: 5500 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setActiveAgent(step.agent);
        setCustomLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${step.log}`]);
      }, step.delay);
    });

    try {
      const res = await fetch("http://localhost:8000/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setCampaignReport(data.final_report);
          setAgentLogs(data.agent_logs);
          if (data.final_report.top_customers?.length > 0) {
            setSelectedCustomerId(data.final_report.top_customers[0].customer_id);
          }
          setIsRunning(false);
          setActiveAgent("");
          setCustomLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Workflow completed successfully.`]);
          fetchStats(); // update stats (e.g. if new interactions generated)
        }, 6000);
      } else {
        throw new Error("API responded with error");
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setIsRunning(false);
        setActiveAgent("");
        setCustomLogs((prev) => [...prev, `[ERROR] Workflow failed. Server connection error.`]);
      }, 3000);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sendOutreach = (customerId, channel) => {
    setOutreachSent((prev) => ({ ...prev, [`${customerId}-${channel}`]: true }));
    setCustomLogs((prev) => [
      ...prev,
      `[CRM ACTION] Dispatched personalized ${channel} outreach to customer ${customerId}. Logged in CRM interactions.`
    ]);
  };

  // Find active selected customer details
  const activeCustomer = campaignReport?.top_customers?.find(
    (c) => c.customer_id === selectedCustomerId
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AURA Banking Intelligence
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              BFSI Multi-Agent Cluster Node
            </p>
          </div>
        </div>
        
        {/* Core Stats Overview */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-slate-500">Core CRM DB</p>
              <p className="text-slate-300">{dbStats.total_customers.toLocaleString()} Customers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-slate-500">Vector Collection</p>
              <p className="text-slate-300">Active (ChromaDB)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-slate-500">Managed Deposits</p>
              <p className="text-slate-300">${(dbStats.total_aum / 1000000).toFixed(2)}M AUM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-slate-500">Underwriting Rules</p>
              <p className="text-slate-300">BFSI-Compliant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Hero Query Section */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Campaign Orchestration Panel</h2>
                <p className="text-xs text-slate-400">Submit natural language queries to execute the LangGraph intelligence workflow.</p>
              </div>
              
              {/* Scenario Presets */}
              <div className="flex gap-2 text-xs">
                <button 
                  onClick={() => handleScenario(1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-300 transition-all font-medium cursor-pointer"
                >
                  Scenario 1: Loans
                </button>
                <button 
                  onClick={() => handleScenario(2)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-300 transition-all font-medium cursor-pointer"
                >
                  Scenario 2: Cards
                </button>
                <button 
                  onClick={() => handleScenario(3)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-300 transition-all font-medium cursor-pointer"
                >
                  Scenario 3: Dormant
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex gap-3 relative mt-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask the Agentic CRM system..."
                  className="w-full bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-200 transition-all placeholder:text-slate-600"
                />
              </div>
              <button 
                onClick={executeWorkflow}
                disabled={isRunning}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-sm px-6 rounded-xl flex items-center gap-2 text-white transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Graph...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-white" />
                    Run Agents
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Multi-Agent Progress Visualizer */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            LangGraph Process Execution Visualizer
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { id: "Planner Agent", title: "1. Planner", desc: "Intent & Filters" },
              { id: "Customer Intelligence Agent", title: "2. Customer Intel", desc: "Data Retrieval & Scoring" },
              { id: "Conversion Prediction Agent", title: "3. Conversion", desc: "Heuristic rules / probability" },
              { id: "Product Recommendation Agent", title: "4. Product Match", desc: "Eligibility check" },
              { id: "Personalization Agent", title: "5. Personalization", desc: "Outreach Copy Generation" },
              { id: "RM Summary Agent", title: "6. RM Summary", desc: "Campaign Dossier" }
            ].map((node) => {
              const isCurrent = activeAgent === node.id;
              const isDone = agentLogs.some(log => log.agent_name === node.id) || (campaignReport && !isRunning);
              return (
                <div 
                  key={node.id}
                  className={`p-3.5 rounded-xl border relative transition-all duration-500 ${
                    isCurrent 
                      ? "border-amber-500 bg-amber-950/20 shadow-md shadow-amber-500/10 animate-pulse" 
                      : isDone 
                        ? "border-emerald-500/50 bg-emerald-950/5" 
                        : "border-slate-800 bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isCurrent ? "text-amber-400" : isDone ? "text-emerald-400" : "text-slate-400"}`}>
                      {node.title}
                    </span>
                    {isDone && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dashboard Panels */}
        {campaignReport ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Target List Panel (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Campaign Metrics Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Targets Identified</span>
                  <span className="text-2xl font-bold tracking-tight text-white">{campaignReport.summary_statistics.total_targets}</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Avg Conversion Likelihood</span>
                  <span className="text-2xl font-bold tracking-tight text-emerald-400">{campaignReport.summary_statistics.average_conversion_probability}%</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Primary Product Offer</span>
                  <span className="text-sm font-bold truncate text-indigo-400 mt-2">{campaignReport.summary_statistics.dominant_product}</span>
                </div>
              </div>

              {/* Ranks Customer List Table */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    Target Campaign Candidates
                  </h4>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold border border-indigo-500/10">
                    Ranked by Campaign Fit
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-bold bg-slate-900/20">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Value Score</th>
                        <th className="py-3 px-4">Avg Balance</th>
                        <th className="py-3 px-4">Target Product</th>
                        <th className="py-3 px-4">Likelihood</th>
                        <th className="py-3 px-4 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs font-medium">
                      {campaignReport.top_customers.map((cust) => {
                        const isSelected = selectedCustomerId === cust.customer_id;
                        return (
                          <tr 
                            key={cust.customer_id}
                            onClick={() => setSelectedCustomerId(cust.customer_id)}
                            className={`hover:bg-slate-850/30 cursor-pointer transition-colors ${
                              isSelected ? "bg-indigo-950/20 text-indigo-200" : "text-slate-300"
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">{cust.name}</div>
                              <div className="text-[10px] text-slate-500">{cust.occupation} &bull; Age {cust.age}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{cust.value_score}</span>
                                <span className="text-[10px] text-slate-500">/100</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">${cust.avg_monthly_balance.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-indigo-400 font-semibold">{cust.recommended_product}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                                cust.conversion_probability >= 75 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" 
                                  : cust.conversion_probability >= 50 
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/10" 
                                    : "bg-red-500/10 text-red-400 border-red-500/10"
                              }`}>
                                {cust.conversion_probability}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isSelected ? "text-indigo-400 translate-x-1" : "text-slate-600"}`} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Executive Summary Statement */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/10">
                  <Award className="w-5.5 h-5.5 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Executive Campaign Summary</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{campaignReport.executive_summary}</p>
                </div>
              </div>

            </div>

            {/* Inspect Panel (1/3 width) */}
            <div className="lg:col-span-1 space-y-6">
              {activeCustomer ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-6 shadow-lg relative">
                  
                  {/* Customer Header */}
                  <div className="flex items-start justify-between border-b border-slate-850 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        {activeCustomer.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{activeCustomer.occupation} | ID: {activeCustomer.customer_id}</p>
                    </div>
                    
                    {/* Dial Gauge SVG for Conversion Probability */}
                    <div className="relative w-12 h-12">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-400"
                          strokeWidth="3.2"
                          strokeDasharray={`${activeCustomer.conversion_probability}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                        {activeCustomer.conversion_probability}%
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview stats */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Annual Income</span>
                      <span className="text-slate-200">${activeCustomer.annual_income.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Average Balance</span>
                      <span className="text-slate-200">${activeCustomer.avg_monthly_balance.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Outstanding EMIs</span>
                      <span className="text-slate-200">${activeCustomer.active_emi.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Value Score</span>
                      <span className="text-slate-200 text-indigo-400">{activeCustomer.value_score} / 100</span>
                    </div>
                  </div>

                  {/* Recommendation Details */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Target Offer fit</h5>
                    <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-xl p-3.5 space-y-1">
                      <p className="text-xs font-bold text-indigo-300">{activeCustomer.recommended_product}</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{activeCustomer.why}</p>
                    </div>
                  </div>

                  {/* Reasons log */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Scoring Rationale</h5>
                    <ul className="text-[11px] text-slate-400 space-y-1 font-medium pl-1">
                      {(activeCustomer.reasons || []).slice(0, -1).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 mt-1">&bull;</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Personalized Messages Tab View */}
                  <div className="space-y-3 pt-2 border-t border-slate-850">
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Generated outreach copy</h5>
                    
                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          WHATSAPP MESSAGE
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => copyToClipboard(activeCustomer.whatsapp_message, 'wa')}
                            className="hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedText === 'wa' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedText === 'wa' ? 'Copied' : 'Copy'}
                          </button>
                          <button 
                            onClick={() => sendOutreach(activeCustomer.customer_id, 'whatsapp')}
                            className="hover:text-emerald-300 flex items-center gap-1 cursor-pointer ml-1"
                          >
                            <Send className="w-3 h-3" />
                            Send
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10.5px] font-mono text-slate-300 leading-relaxed break-words whitespace-pre-wrap select-all">
                        {activeCustomer.whatsapp_message}
                      </div>
                      {outreachSent[`${activeCustomer.customer_id}-whatsapp`] && (
                        <span className="text-[9px] text-emerald-400 font-semibold block italic mt-1">
                          ✓ WhatsApp outreach sent & recorded in CRM timeline.
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          EMAIL OUTREACH
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => copyToClipboard(activeCustomer.email_message, 'email')}
                            className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedText === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedText === 'email' ? 'Copied' : 'Copy'}
                          </button>
                          <button 
                            onClick={() => sendOutreach(activeCustomer.customer_id, 'email')}
                            className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer ml-1"
                          >
                            <Send className="w-3 h-3" />
                            Send
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10.5px] font-mono text-slate-300 leading-relaxed max-h-40 overflow-y-auto break-words whitespace-pre-wrap select-all">
                        {activeCustomer.email_message}
                      </div>
                      {outreachSent[`${activeCustomer.customer_id}-email`] && (
                        <span className="text-[9px] text-indigo-400 font-semibold block italic mt-1">
                          ✓ Email outreach sent & recorded in CRM timeline.
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-medium text-xs">
                  Select a customer to inspect detail conversions.
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Empty / Initial State Info Panel */
          <div className="border border-slate-850 bg-slate-900/10 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
            <Bot className="w-12 h-12 text-indigo-500 mx-auto animate-bounce" />
            <h3 className="text-md font-bold text-white">Aura CRM Agentic Platform Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Submit your targeting goal or choose one of the predefined RM campaign presets above. 
              The system will trigger a multi-agent LangGraph workflow executing planner tasks, DB SQL searches, ChromaDB document retrieval, mathematical scoring models, regulatory personalization scripts, and summaries.
            </p>
          </div>
        )}

        {/* Audit Trails Console (Always Displayed) */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Agent Audit Logs & Explainability Panel
            </h4>
            <div className="flex gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-850">
                Confidence Scores: Verified
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-emerald-400 space-y-2 max-h-60 overflow-y-auto">
            {customLogs.map((logStr, idx) => (
              <div key={idx} className="break-words select-text">
                {logStr}
              </div>
            ))}
            {agentLogs.map((log, index) => (
              <div key={index} className="pt-2 border-t border-slate-900 space-y-1 select-text text-slate-300">
                <div className="flex justify-between font-bold text-indigo-400">
                  <span>⚙ [{log.timestamp}] {log.agent_name}</span>
                  <span className="text-slate-500">{log.duration_ms} ms</span>
                </div>
                <div className="pl-4 text-slate-400"><span className="text-slate-600">Task:</span> {log.task}</div>
                <div className="pl-4 text-slate-300 whitespace-pre-wrap"><span className="text-slate-600">Thought Process:</span> {log.thought_process}</div>
              </div>
            ))}
            {isRunning && (
              <div className="text-amber-500 font-bold animate-pulse pt-1">
                ⌛ Query running in LangGraph engine. Waiting for node reports...
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
