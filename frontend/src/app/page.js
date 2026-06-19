"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Award,
  Layers,
  Settings,
  Code,
  Sparkles,
  Sliders,
  Terminal,
  Pause,
  Clock,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import { SIMULATOR_DATA } from "./simulatorData";

export default function Dashboard() {
  // Navigation View Mode
  const [viewMode, setViewMode] = useState("dashboard"); // "dashboard" or "simulator"

  // Live Dashboard State
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

  // Simulator State
  const [simScenario, setSimScenario] = useState(1);
  const [simIsRunning, setSimIsRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simSelectedNode, setSimSelectedNode] = useState(0);
  const [simSpeed, setSimSpeed] = useState(3000); // ms per step
  const [activeSimTab, setActiveSimTab] = useState("tools"); // "prompt", "tools", "state"
  const [simLogs, setSimLogs] = useState([
    "[SYSTEM] Agent Flow Simulator initialized.",
    "[SYSTEM] Select a Campaign Scenario and click 'Play Simulation' to start."
  ]);
  const [simCopiedText, setSimCopiedText] = useState(null);
  const [simOutreachSent, setSimOutreachSent] = useState({});
  const [simSelectedCustomerId, setSimSelectedCustomerId] = useState(null);

  const terminalEndRef = useRef(null);

  // Fetch db stats on load for live dashboard
  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-scroll simulation terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [simLogs]);

  // Simulation Steps Controller (Auto-Play)
  useEffect(() => {
    let timer = null;
    if (simIsRunning) {
      timer = setTimeout(() => {
        if (simStep < 5) {
          const nextStep = simStep + 1;
          setSimStep(nextStep);
          setSimSelectedNode(nextStep);
          
          const nextAgent = SIMULATOR_DATA[simScenario].steps[nextStep].id;
          const newLogs = [];
          
          if (nextStep === 1) {
            newLogs.push(
              `[${new Date().toLocaleTimeString()}] [DB] Connecting to core SQL database pool...`,
              `[${new Date().toLocaleTimeString()}] [SQL] Executing customer demographic tables scan.`,
              `[${new Date().toLocaleTimeString()}] [AGENT] ${nextAgent} active: Demographic analysis complete.`
            );
          } else if (nextStep === 2) {
            newLogs.push(
              `[${new Date().toLocaleTimeString()}] [DB] Querying transaction ledger logs from relational database...`,
              `[${new Date().toLocaleTimeString()}] [ALGO] Computing credit score & transaction frequency heuristics.`,
              `[${new Date().toLocaleTimeString()}] [AGENT] ${nextAgent} active: Score computed successfully.`
            );
          } else if (nextStep === 3) {
            newLogs.push(
              `[${new Date().toLocaleTimeString()}] [CHROMADB] Connecting to vector client collection "products"...`,
              `[${new Date().toLocaleTimeString()}] [VECTOR] Querying policy embeddings with cosine similarity.`,
              `[${new Date().toLocaleTimeString()}] [AGENT] ${nextAgent} active: Policy matched and verified.`
            );
          } else if (nextStep === 4) {
            newLogs.push(
              `[${new Date().toLocaleTimeString()}] [LLM] Sending system prompt & customer dossier to LLM...`,
              `[${new Date().toLocaleTimeString()}] [LLM] Completed token generation for marketing outreach copies.`,
              `[${new Date().toLocaleTimeString()}] [AGENT] ${nextAgent} active: Compliant templates generated.`
            );
          } else if (nextStep === 5) {
            newLogs.push(
              `[${new Date().toLocaleTimeString()}] [CRM] Compiling campaign parameters into RM dossier...`,
              `[${new Date().toLocaleTimeString()}] [SQL] Logging campaign metadata metrics to Relational DB.`,
              `[${new Date().toLocaleTimeString()}] [AGENT] ${nextAgent} active: Campaign Dossier completed and logged.`
            );
          }
          setSimLogs((prev) => [...prev, ...newLogs]);
        } else {
          setSimIsRunning(false);
          setSimLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] [SYSTEM] Simulation complete. Campaign dossier recorded.`
          ]);
          
          // Auto-select primary customer in report
          const report = SIMULATOR_DATA[simScenario].steps[5].state;
          try {
            const parsedReport = JSON.parse(report);
            if (parsedReport.final_report?.top_customers?.length > 0) {
              setSimSelectedCustomerId(parsedReport.final_report.top_customers[0].customer_id);
            }
          } catch(e) {}
        }
      }, simSpeed);
    }
    return () => clearTimeout(timer);
  }, [simIsRunning, simStep, simSpeed, simScenario]);

  // Handle Scenario Change in Simulator
  const handleSimScenarioChange = (scenarioNum) => {
    setSimScenario(scenarioNum);
    setSimIsRunning(false);
    setSimStep(0);
    setSimSelectedNode(0);
    setSimSelectedCustomerId(null);
    setSimLogs([
      `[SYSTEM] Switched to ${SIMULATOR_DATA[scenarioNum].title}`,
      `[SYSTEM] Ready. Press 'Play Simulation' to watch the LangGraph nodes run.`
    ]);
  };

  // Run Simulation Control
  const startSimulation = () => {
    if (simStep >= 5) {
      // restart
      setSimStep(0);
      setSimSelectedNode(0);
      setSimLogs([
        `[SYSTEM] Restarting ${SIMULATOR_DATA[simScenario].title}...`,
        `[${new Date().toLocaleTimeString()}] [AGENT] Planner Agent activated.`
      ]);
      setSimSelectedCustomerId(null);
    } else if (simStep === 0 && !simIsRunning) {
      setSimLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SYSTEM] Starting campaign workflow simulation...`,
        `[${new Date().toLocaleTimeString()}] [AGENT] Planner Agent activated.`
      ]);
    }
    setSimIsRunning(true);
  };

  const pauseSimulation = () => {
    setSimIsRunning(false);
    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [SYSTEM] Simulation paused.`]);
  };

  const stepSimulation = () => {
    if (simStep < 5) {
      setSimIsRunning(false);
      const nextStep = simStep + 1;
      setSimStep(nextStep);
      setSimSelectedNode(nextStep);
      setSimLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SYSTEM] Stepped forward to ${SIMULATOR_DATA[simScenario].steps[nextStep].id}.`
      ]);
    }
  };

  const resetSimulation = () => {
    setSimIsRunning(false);
    setSimStep(0);
    setSimSelectedNode(0);
    setSimSelectedCustomerId(null);
    setSimLogs([
      `[SYSTEM] Simulation reset.`,
      `[SYSTEM] Ready to run: ${SIMULATOR_DATA[simScenario].title}`
    ]);
  };

  // Fetch db stats for live dashboard
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

  // Run actual LangGraph API
  const executeWorkflow = async () => {
    if (!query.trim()) return;
    
    setIsRunning(true);
    setCampaignReport(null);
    setAgentLogs([]);
    setSelectedCustomerId(null);
    setCustomLogs(["Initializing LangGraph execution context..."]);
    
    // Simulate steps in UI for quick responsiveness
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
          fetchStats(); 
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

  const copySimToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setSimCopiedText(key);
    setTimeout(() => setSimCopiedText(null), 2000);
  };

  const sendOutreach = (customerId, channel) => {
    setOutreachSent((prev) => ({ ...prev, [`${customerId}-${channel}`]: true }));
    setCustomLogs((prev) => [
      ...prev,
      `[CRM ACTION] Dispatched personalized ${channel} outreach to customer ${customerId}. Logged in CRM interactions.`
    ]);
  };

  const sendSimOutreach = (customerId, channel) => {
    setSimOutreachSent((prev) => ({ ...prev, [`${customerId}-${channel}`]: true }));
    setSimLogs((prev) => [
      ...prev,
      `[CRM ACTION] [11:58:20] Dispatched personalized ${channel} message to customer ID ${customerId}. CRM Interaction logged.`
    ]);
  };

  const activeCustomer = campaignReport?.top_customers?.find(
    (c) => c.customer_id === selectedCustomerId
  );

  // Parse simulated report outputs at the end of simulation
  const getSimulatedReport = () => {
    try {
      const finalReportRaw = SIMULATOR_DATA[simScenario].steps[5].state;
      return JSON.parse(finalReportRaw).final_report;
    } catch (e) {
      return null;
    }
  };

  const simReport = getSimulatedReport();
  const activeSimCustomer = simReport?.top_customers?.find(
    (c) => c.customer_id === simSelectedCustomerId
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

        {/* Tab Selection */}
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode("dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === "dashboard" 
                ? "bg-indigo-600 text-white shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            Live Dashboard
          </button>
          <button 
            onClick={() => setViewMode("simulator")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === "simulator" 
                ? "bg-indigo-600 text-white shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            Agent Flow Simulator
          </button>
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
      {viewMode === "dashboard" ? (
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                LangGraph Process Execution Visualizer
              </h3>
              <button 
                onClick={() => setViewMode("simulator")}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                Open Flow Simulator For Full Animation & Code Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
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
      ) : (
        /* INTERACTIVE AGENT FLOW SIMULATOR VIEW */
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Simulator Info Header & Presets */}
          <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 uppercase">
                    Interactive Walkthrough Mode
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  LangGraph Agent Flow Simulator
                </h2>
                <p className="text-xs text-slate-400 max-w-xl font-medium">
                  Run a self-contained, step-by-step visual scan showing exactly how the multi-agent state-machine connects to the relational SQL tables and ChromaDB vector embeddings.
                </p>
              </div>

              {/* Scenario selector */}
              <div className="flex flex-wrap gap-2 text-xs self-start md:self-center">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSimScenarioChange(num)}
                    className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer border ${
                      simScenario === num 
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20" 
                        : "bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750"
                    }`}
                  >
                    Scenario {num}: {num === 1 ? "Personal Loans" : num === 2 ? "Premium Cards" : "Dormant Savings"}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt View */}
            <div className="mt-4 p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Search className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-300 italic font-mono truncate">
                  "{SIMULATOR_DATA[simScenario].query}"
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 select-none">
                SIMULATED ENTRY PROMPT
              </span>
            </div>
          </section>

          {/* Interactive Topology Graph and Sidebar details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Topography Visualiser (8/12 Columns) */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              
              {/* Canvas Card */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col flex-1 relative overflow-hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Agent Network execution path
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono">
                    Node: {simStep + 1} / 6
                  </span>
                </h3>

                {/* SVG Connections Overlay (Glow Lines) */}
                <div className="relative flex-1 min-h-[360px] flex items-center justify-center p-4 border border-slate-850 bg-slate-950/20 rounded-xl">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>
                  
                  {/* Vertical Flow Diagram of Cards */}
                  <div className="relative z-10 w-full max-w-lg space-y-4">
                    {SIMULATOR_DATA[simScenario].steps.map((step, idx) => {
                      const isActive = simStep === idx;
                      const isSelected = simSelectedNode === idx;
                      const isProcessed = idx < simStep;
                      
                      return (
                        <React.Fragment key={idx}>
                          {/* Node Card */}
                          <div 
                            onClick={() => {
                              setSimSelectedNode(idx);
                              setSimIsRunning(false);
                            }}
                            className={`p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer relative hover:scale-[1.01] ${
                              isActive 
                                ? "border-amber-500 bg-amber-950/25 shadow-lg shadow-amber-500/10" 
                                : isSelected
                                  ? "border-indigo-500 bg-indigo-950/15"
                                  : isProcessed 
                                    ? "border-emerald-500/50 bg-emerald-950/5" 
                                    : "border-slate-800 bg-slate-900/40 opacity-70"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Number Indicator */}
                                <div className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                                  isActive 
                                    ? "bg-amber-500 text-slate-950" 
                                    : isProcessed 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                                      : "bg-slate-800 text-slate-400"
                                }`}>
                                  {idx + 1}
                                </div>
                                
                                <div>
                                  <h4 className="text-xs font-bold text-slate-200">{step.id}</h4>
                                  <p className="text-[10px] text-slate-500 font-semibold">{step.role}</p>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center gap-2">
                                {isActive ? (
                                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    PROCESSING
                                  </span>
                                ) : isProcessed ? (
                                  <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                    COMPLETED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-800 rounded-full border border-slate-700">
                                    PENDING
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Connecting Arrow */}
                          {idx < 5 && (
                            <div className="flex justify-center select-none py-0.5">
                              <div className="h-6 w-0.5 relative bg-slate-850">
                                {isActive && (
                                  <div className="absolute inset-0 bg-amber-500 animate-bounce blur-sm"></div>
                                )}
                                {isProcessed && (
                                  <div className="absolute inset-0 bg-emerald-500"></div>
                                )}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Control Panel Bar */}
                <div className="mt-4 p-4 border border-slate-800 bg-slate-900/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Controls */}
                  <div className="flex items-center gap-2.5">
                    {simIsRunning ? (
                      <button 
                        onClick={pauseSimulation}
                        className="p-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                    ) : (
                      <button 
                        onClick={startSimulation}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold shadow-md shadow-indigo-600/20"
                      >
                        <Play className="w-4 h-4 fill-current text-white" />
                        {simStep >= 5 ? "Restart Demo" : "Play Simulation"}
                      </button>
                    )}
                    
                    <button 
                      onClick={stepSimulation}
                      disabled={simStep >= 5 || simIsRunning}
                      className="p-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-all text-xs font-bold"
                      title="Step one agent forward"
                    >
                      Step Next
                    </button>
                    
                    <button 
                      onClick={resetSimulation}
                      className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg cursor-pointer transition-all text-xs font-bold"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Playback Speed selector */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      Step Delay:
                    </span>
                    <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded-lg">
                      {[1500, 3000, 5000].map((val) => (
                        <button
                          key={val}
                          onClick={() => setSimSpeed(val)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            simSpeed === val ? "bg-slate-800 text-indigo-400" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {val / 1000}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Code / State Inspector Sidebar (4/12 Columns) */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              
              {/* Tab Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col flex-1 shadow-lg relative">
                
                {/* Active step indicator header */}
                <div className="border-b border-slate-850 pb-4 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Selected Agent Details</span>
                  </div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4.5 h-4.5 text-indigo-400" />
                    {SIMULATOR_DATA[simScenario].steps[simSelectedNode].id}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                    {SIMULATOR_DATA[simScenario].steps[simSelectedNode].description}
                  </p>
                </div>

                {/* Info Tabs */}
                <div className="flex border-b border-slate-850 pb-2.5 gap-4 text-xs font-semibold mb-4">
                  <button 
                    onClick={() => setActiveSimTab("tools")}
                    className={`pb-1 border-b-2 cursor-pointer transition-all ${
                      activeSimTab === "tools" 
                        ? "text-indigo-400 border-indigo-500" 
                        : "text-slate-500 hover:text-slate-300 border-transparent"
                    }`}
                  >
                    🛠 Code & DB Queries
                  </button>
                  <button 
                    onClick={() => setActiveSimTab("prompt")}
                    className={`pb-1 border-b-2 cursor-pointer transition-all ${
                      activeSimTab === "prompt" 
                        ? "text-indigo-400 border-indigo-500" 
                        : "text-slate-500 hover:text-slate-300 border-transparent"
                    }`}
                  >
                    🤖 Internal Logic
                  </button>
                  <button 
                    onClick={() => setActiveSimTab("state")}
                    className={`pb-1 border-b-2 cursor-pointer transition-all ${
                      activeSimTab === "state" 
                        ? "text-indigo-400 border-indigo-500" 
                        : "text-slate-500 hover:text-slate-300 border-transparent"
                    }`}
                  >
                    📦 State Output
                  </button>
                </div>

                {/* Tab content screens */}
                <div className="flex-1 min-h-[280px] bg-slate-950 border border-slate-850 rounded-xl p-4 overflow-auto font-mono text-[10.5px] leading-relaxed relative">
                  
                  {/* Code & Database Tab */}
                  {activeSimTab === "tools" && (
                    <div className="space-y-4 text-slate-300">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">PYTHON TOOL CALL</span>
                        <div className="bg-slate-900 border border-slate-850 p-2 rounded text-indigo-400 font-bold font-mono">
                          {SIMULATOR_DATA[simScenario].steps[simSelectedNode].tool}
                        </div>
                      </div>
                      
                      {SIMULATOR_DATA[simScenario].steps[simSelectedNode].sql && 
                       SIMULATOR_DATA[simScenario].steps[simSelectedNode].sql !== "/* No SQL queries. */" && 
                       SIMULATOR_DATA[simScenario].steps[simSelectedNode].sql !== "/* No SQL queries executed. */" && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">RELATIONAL SQL QUERY</span>
                          <pre className="text-emerald-500 whitespace-pre-wrap leading-relaxed select-all">
                            {SIMULATOR_DATA[simScenario].steps[simSelectedNode].sql}
                          </pre>
                        </div>
                      )}

                      {SIMULATOR_DATA[simScenario].steps[simSelectedNode].vector && 
                       SIMULATOR_DATA[simScenario].steps[simSelectedNode].vector !== "/* No vector queries. */" && 
                       SIMULATOR_DATA[simScenario].steps[simSelectedNode].vector !== "/* No vector database calls. */" && 
                       SIMULATOR_DATA[simScenario].steps[simSelectedNode].vector !== "/* No vector database calls executed in this step. */" && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-400 block mb-1">VECTOR CHROMADB QUERY</span>
                          <pre className="text-indigo-400 whitespace-pre-wrap leading-relaxed select-all">
                            {SIMULATOR_DATA[simScenario].steps[simSelectedNode].vector}
                          </pre>
                        </div>
                      )}

                      {SIMULATOR_DATA[simScenario].steps[simSelectedNode].code && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">CORE LOGIC MODULE</span>
                          <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                            {SIMULATOR_DATA[simScenario].steps[simSelectedNode].code}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Internal prompts and thoughts Tab */}
                  {activeSimTab === "prompt" && (
                    <div className="space-y-4 text-slate-300">
                      {SIMULATOR_DATA[simScenario].steps[simSelectedNode].prompt && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">AGENT PROMPT PATTERN</span>
                          <pre className="text-slate-400 whitespace-pre-wrap border border-slate-900 bg-slate-900/40 p-2.5 rounded max-h-48 overflow-y-auto">
                            {SIMULATOR_DATA[simScenario].steps[simSelectedNode].prompt}
                          </pre>
                        </div>
                      )}

                      {SIMULATOR_DATA[simScenario].steps[simSelectedNode].thought && (
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-400 block mb-1">AGENT INTERNAL LOGIC & THOUGHTS</span>
                          <p className="text-amber-300 font-semibold italic leading-relaxed whitespace-pre-wrap">
                            "{SIMULATOR_DATA[simScenario].steps[simSelectedNode].thought}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Output State JSON payload */}
                  {activeSimTab === "state" && (
                    <div className="space-y-2 text-slate-300">
                      <span className="text-[9px] uppercase font-bold text-indigo-400 block mb-1">UPDATED STATE PAYLOAD</span>
                      <pre className="text-indigo-300 whitespace-pre-wrap select-all max-h-96 overflow-y-auto font-bold font-mono">
                        {SIMULATOR_DATA[simScenario].steps[simSelectedNode].state}
                      </pre>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>

          {/* Simulated Campaign Result dossier Panel (Visible after node 6 is reached) */}
          {simStep === 5 && simReport ? (
            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-900">
              
              {/* Target List Panel (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Campaign Metrics Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Targets Identified</span>
                    <span className="text-2xl font-bold tracking-tight text-white">{simReport.summary_statistics.total_targets}</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Avg Conversion Likelihood</span>
                    <span className="text-2xl font-bold tracking-tight text-emerald-400">{simReport.summary_statistics.average_conversion_probability}%</span>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Primary Product Offer</span>
                    <span className="text-sm font-bold truncate text-indigo-400 mt-2">{simReport.summary_statistics.dominant_product}</span>
                  </div>
                </div>

                {/* Ranks Customer List Table */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      Simulated Campaign Candidates
                    </h4>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold border border-indigo-500/10 animate-pulse">
                      Graph Completed
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
                        {simReport.top_customers.map((cust) => {
                          const isSelected = simSelectedCustomerId === cust.customer_id;
                          return (
                            <tr 
                              key={cust.customer_id}
                              onClick={() => setSimSelectedCustomerId(cust.customer_id)}
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
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{simReport.executive_summary}</p>
                  </div>
                </div>

              </div>

              {/* Inspect Panel (1/3 width) */}
              <div className="lg:col-span-1 space-y-6">
                {activeSimCustomer ? (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-6 shadow-lg relative">
                    
                    {/* Customer Header */}
                    <div className="flex items-start justify-between border-b border-slate-850 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {activeSimCustomer.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{activeSimCustomer.occupation} | ID: {activeSimCustomer.customer_id}</p>
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
                            strokeDasharray={`${activeSimCustomer.conversion_probability}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                          {activeSimCustomer.conversion_probability}%
                        </div>
                      </div>
                    </div>

                    {/* Financial Overview stats */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                        <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Annual Income</span>
                        <span className="text-slate-200">${activeSimCustomer.annual_income.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                        <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Average Balance</span>
                        <span className="text-slate-200">${activeSimCustomer.avg_monthly_balance.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                        <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Outstanding EMIs</span>
                        <span className="text-slate-200">${activeSimCustomer.active_emi.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/30 p-2.5 rounded border border-slate-850">
                        <span className="text-[9px] uppercase text-slate-500 block mb-0.5">Value Score</span>
                        <span className="text-slate-200 text-indigo-400">{activeSimCustomer.value_score} / 100</span>
                      </div>
                    </div>

                    {/* Recommendation Details */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] uppercase font-bold text-slate-400">Target Offer fit</h5>
                      <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-xl p-3.5 space-y-1">
                        <p className="text-xs font-bold text-indigo-300">{activeSimCustomer.recommended_product}</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{activeSimCustomer.why}</p>
                      </div>
                    </div>

                    {/* Reasons log */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] uppercase font-bold text-slate-400">Scoring Rationale</h5>
                      <ul className="text-[11px] text-slate-400 space-y-1 font-medium pl-1">
                        {(activeSimCustomer.reasons || []).slice(0, -1).map((r, i) => (
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
                              onClick={() => copySimToClipboard(activeSimCustomer.whatsapp_message, 'wa')}
                              className="hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                            >
                              {simCopiedText === 'wa' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {simCopiedText === 'wa' ? 'Copied' : 'Copy'}
                            </button>
                            <button 
                              onClick={() => sendSimOutreach(activeSimCustomer.customer_id, 'whatsapp')}
                              className="hover:text-emerald-300 flex items-center gap-1 cursor-pointer ml-1"
                            >
                              <Send className="w-3 h-3" />
                              Send
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10.5px] font-mono text-slate-300 leading-relaxed break-words whitespace-pre-wrap select-all">
                          {activeSimCustomer.whatsapp_message}
                        </div>
                        {simOutreachSent[`${activeSimCustomer.customer_id}-whatsapp`] && (
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
                              onClick={() => copySimToClipboard(activeSimCustomer.email_message, 'email')}
                              className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                            >
                              {simCopiedText === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {simCopiedText === 'email' ? 'Copied' : 'Copy'}
                            </button>
                            <button 
                              onClick={() => sendSimOutreach(activeSimCustomer.customer_id, 'email')}
                              className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer ml-1"
                            >
                              <Send className="w-3 h-3" />
                              Send
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10.5px] font-mono text-slate-300 leading-relaxed max-h-40 overflow-y-auto break-words whitespace-pre-wrap select-all">
                          {activeSimCustomer.email_message}
                        </div>
                        {simOutreachSent[`${activeSimCustomer.customer_id}-email`] && (
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
          ) : null}

          {/* Simulator Terminal (Always Displayed in Simulator mode) */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30 select-none">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Under the Hood: Engine Terminal Console
              </h4>
              <div className="flex gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-850">
                  SYSTEM TELEMETRY: SIMULATED
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-emerald-400 space-y-2 max-h-48 overflow-y-auto">
              {simLogs.map((logStr, idx) => (
                <div key={idx} className="break-words select-text">
                  {logStr}
                </div>
              ))}
              {simIsRunning && (
                <div className="text-amber-500 font-bold animate-pulse pt-1">
                  ⌛ Running active node: {SIMULATOR_DATA[simScenario].steps[simStep].id}. Working...
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </section>

        </main>
      )}
    </div>
  );
}
