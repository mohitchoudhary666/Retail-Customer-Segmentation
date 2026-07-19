import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Code, 
  FileSpreadsheet, 
  Play, 
  Plus, 
  Search, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Layers,
  ChevronRight,
  Info,
  Server,
  Terminal,
  BookOpen,
  PieChart as PieIcon,
  BarChart2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ScatterChart, 
  Scatter, 
  ZAxis 
} from "recharts";

import { Transaction, RfmResult, StarSchemaTable } from "./types";
import { STAR_SCHEMA_TABLES, PYTHON_CODE_TEMPLATE, POSTGRESQL_CODE_TEMPLATE, POWERBI_DAX_MEASURES } from "./data";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"rfm" | "schema" | "analytics" | "pipeline">("rfm");

  // Ingestion & Segmentation State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rfmResults, setRfmResults] = useState<RfmResult[]>([]);
  const [snapshotDate, setSnapshotDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Search and Filter States
  const [txnSearch, setTxnSearch] = useState<string>("");
  const [rfmSearch, setRfmSearch] = useState<string>("");
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>("All");

  // Manual Transaction Input Form
  const [newCustId, setNewCustId] = useState<string>("");
  const [newTxnDate, setNewTxnDate] = useState<string>("2026-07-19");
  const [newAmount, setNewAmount] = useState<string>("150.00");
  const [formError, setFormError] = useState<string>("");

  // Star Schema Explorer State
  const [selectedTable, setSelectedTable] = useState<StarSchemaTable>(STAR_SCHEMA_TABLES[0]);
  const [hoveredRelationship, setHoveredRelationship] = useState<string | null>(null);

  // Pipeline Code Viewer State
  const [selectedCodeTab, setSelectedCodeTab] = useState<"python" | "sql" | "dax">("python");
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Load initial transaction logs from server
  const fetchTransactions = async (resetToDefault = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      
      let finalTxns = data;
      if (!resetToDefault) {
        const stored = localStorage.getItem("custom_transactions");
        if (stored) {
          finalTxns = JSON.parse(stored);
        }
      } else {
        localStorage.removeItem("custom_transactions");
      }
      
      setTransactions(finalTxns);
      calculateRfmOnBackend(finalTxns);
    } catch (err) {
      console.error("Failed to load e-commerce transaction logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Send transaction logs to server to compute R/F/M quantiles and segments
  const calculateRfmOnBackend = async (dataList: Transaction[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/segmentation/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: dataList })
      });
      const result = await res.json();
      if (res.ok) {
        setRfmResults(result.rfm);
        setSnapshotDate(result.snapshot_date);
        setSuccessMsg("RFM behavioral segments processed and updated successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        console.error("Error computing segmentation:", result.error);
      }
    } catch (err) {
      console.error("Server processing exception:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle single transaction manual ingestion
  const handleIngestTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!newCustId.trim()) {
      setFormError("Customer ID is required.");
      return;
    }
    const val = parseFloat(newAmount);
    if (isNaN(val) || val <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }
    if (!newTxnDate) {
      setFormError("Transaction date is required.");
      return;
    }

    const newTxn: Transaction = {
      transaction_id: `TXN-${Date.now().toString().slice(-4)}`,
      customer_id: newCustId.toUpperCase().trim(),
      transaction_date: newTxnDate,
      amount: parseFloat(val.toFixed(2))
    };

    const updated = [newTxn, ...transactions];
    setTransactions(updated);
    localStorage.setItem("custom_transactions", JSON.stringify(updated));
    calculateRfmOnBackend(updated);

    // Reset Form Input
    setNewCustId("");
    setNewAmount("150.00");
  };

  // Reset entire database to defaults
  const handleResetToDefault = () => {
    if (confirm("Are you sure you want to restore the transactional database to default logs?")) {
      fetchTransactions(true);
    }
  };

  // Quick helper to download current segmented data as CSV
  const handleDownloadCsv = () => {
    const headers = ["Customer ID", "Recency (Days)", "Frequency (Orders)", "Monetary (USD)", "R_Score", "F_Score", "M_Score", "Segment"];
    const rows = rfmResults.map(r => [
      r.customer_id,
      r.Recency,
      r.Frequency,
      r.Monetary,
      r.R_Score,
      r.F_Score,
      r.M_Score,
      r.Segment
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rfm_segmented_output.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Transaction logs
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.customer_id.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.transaction_id.toLowerCase().includes(txnSearch.toLowerCase())
    );
  }, [transactions, txnSearch]);

  // Filter RFM customer profile list
  const filteredRfmResults = useMemo(() => {
    return rfmResults.filter(r => {
      const matchesSearch = r.customer_id.toLowerCase().includes(rfmSearch.toLowerCase());
      const matchesSegment = selectedSegmentFilter === "All" || r.Segment === selectedSegmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [rfmResults, rfmSearch, selectedSegmentFilter]);

  // Cohort summaries / stats
  const aggregateStats = useMemo(() => {
    const totalRevenue = rfmResults.reduce((sum, r) => sum + r.Monetary, 0);
    const totalCustomers = rfmResults.length;
    
    const core = rfmResults.filter(r => r.Segment === "Core High Value");
    const atRisk = rfmResults.filter(r => r.Segment === "Churned / At Risk");
    const active = rfmResults.filter(r => r.Segment === "Standard Active");

    const coreRevenue = core.reduce((sum, r) => sum + r.Monetary, 0);
    const atRiskRevenue = atRisk.reduce((sum, r) => sum + r.Monetary, 0);
    const activeRevenue = active.reduce((sum, r) => sum + r.Monetary, 0);

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCustomers,
      coreCount: core.length,
      coreRevenue: parseFloat(coreRevenue.toFixed(2)),
      coreAvgFreq: core.length ? parseFloat((core.reduce((sum, r) => sum + r.Frequency, 0) / core.length).toFixed(1)) : 0,
      
      atRiskCount: atRisk.length,
      atRiskRevenue: parseFloat(atRiskRevenue.toFixed(2)),
      atRiskAvgFreq: atRisk.length ? parseFloat((atRisk.reduce((sum, r) => sum + r.Frequency, 0) / atRisk.length).toFixed(1)) : 0,

      activeCount: active.length,
      activeRevenue: parseFloat(activeRevenue.toFixed(2)),
      activeAvgFreq: active.length ? parseFloat((active.reduce((sum, r) => sum + r.Frequency, 0) / active.length).toFixed(1)) : 0,
    };
  }, [rfmResults]);

  // Helper to copy code block
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Visual Palette for charts
  const COLOR_MAP = {
    "Core High Value": "#10b981",  // Emerald 500
    "Standard Active": "#3b82f6",  // Blue 500
    "Churned / At Risk": "#f43f5e", // Rose 500
  };

  // Format currency
  const formatUSD = (num: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-slate-200">
      
      {/* 1. Global Header Navigation Banner */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-coral-600 rounded-lg text-white shadow-inner shadow-black/30">
              <Database className="h-6 w-6 text-orange-400" id="header-db-icon" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Retail Customer Segmentation
                </h1>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono py-0.5 px-2 rounded-full border border-slate-700">
                  RFM Engine & Star Schema
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Calculate behavioral customer quartiles & explore relational analytics star schemas
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1.5 overflow-x-auto bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setActiveTab("rfm")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === "rfm" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>RFM Segmentor</span>
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === "schema" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Star Schema Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === "analytics" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Cohort Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === "pipeline" 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Pipeline & Guide</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Success Status Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border-y border-emerald-200 text-emerald-800 py-2.5 px-4 text-center text-xs font-medium flex items-center justify-center space-x-2 transition-all duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3. Main Dashboard Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ======================================================== */}
        {/* TAB 1: RFM SEGMENTATION ENGINE */}
        {/* ======================================================== */}
        {activeTab === "rfm" && (
          <div className="space-y-6">
            
            {/* Context Explainer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                  <span>Interactive Ingestion & Segmentation Playground</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Simulate high-performance transactional ingestion. Modify raw lines below or ingest a custom customer event to calculate real-time Recency, Frequency, and Monetary scores.
                </p>
              </div>
              <div className="flex items-center space-x-2 self-start md:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className="text-slate-400">Baseline Checkpoint:</span>
                <span className="text-slate-700 font-semibold">{snapshotDate || "Calculating..."}</span>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600" title="Calculated as maximum transaction date + 1 day to evaluate historical recency metrics." />
              </div>
            </div>

            {/* Split workspace: Form Ingest + Database Records */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Custom Ingestion Form & Metrics Map (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Custom Line Ingestion */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3 flex items-center justify-between">
                    <span>Ingest Customer Transaction</span>
                    <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full lowercase">active pipeline</span>
                  </h3>
                  
                  <form onSubmit={handleIngestTransaction} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Customer Identifier</label>
                      <input 
                        type="text"
                        value={newCustId}
                        onChange={(e) => setNewCustId(e.target.value)}
                        placeholder="e.g. CUST-101 or CUST-121"
                        className="w-full text-xs border border-slate-200 bg-slate-50/50 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition font-mono uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Sales Amount (USD)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono">$</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            placeholder="150.00"
                            className="w-full text-xs border border-slate-200 bg-slate-50/50 rounded-lg py-2.5 pl-6 pr-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Order Date</label>
                        <input 
                          type="date"
                          value={newTxnDate}
                          onChange={(e) => setNewTxnDate(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-slate-50/50 rounded-lg p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition font-mono"
                        />
                      </div>
                    </div>

                    {formError && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{formError}</span>
                      </p>
                    )}

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg py-2.5 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ingest & segment profile</span>
                    </button>
                  </form>
                </div>

                {/* Score Definition Framework */}
                <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-2">
                    <Terminal className="h-3.5 w-3.5 text-orange-400" />
                    <span>RFM Logic Definitions</span>
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="border-l-2 border-orange-500 pl-3">
                      <p className="font-semibold text-slate-100">Recency (R_Score)</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Days elapsed since last purchase. Segmented into quartiles where lowest days get **4** (Outstanding) and highest get **1** (Churn risk).
                      </p>
                    </div>
                    <div className="border-l-2 border-emerald-500 pl-3">
                      <p className="font-semibold text-slate-100">Frequency (F_Score)</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Count of transaction records. Split using stable rank-first partitioning to assign equal customer distribution scores from **1** to **4**.
                      </p>
                    </div>
                    <div className="border-l-2 border-blue-500 pl-3">
                      <p className="font-semibold text-slate-100">Monetary (M_Score)</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Total spent. Consumers are ranked by absolute gross value and assigned scores from **1** (low ticket) to **4** (high revenue).
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 space-y-2 text-[11px]">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Segment Mapping Framework</span>
                    <p className="text-slate-300">
                      🥇 <strong className="text-white">Core High Value</strong>: R_Score = 4, F_Score = 4, M_Score = 4.
                    </p>
                    <p className="text-slate-300">
                      🥀 <strong className="text-white">Churned / At Risk</strong>: R_Score = 1 (Regardless of spend).
                    </p>
                    <p className="text-slate-300">
                      ⚖️ <strong className="text-white">Standard Active</strong>: Any active customer not meeting Core or Churned rules.
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Ingested Transactions + Calculated Segment Profiles (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Calculated Segment Profiles List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <Users className="h-4 w-4 text-emerald-500" />
                        <span>Calculated Behavioral Customer Profiles</span>
                      </h3>
                      <p className="text-xs text-slate-500">Processed profiles based on rank-quartile logic</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={handleDownloadCsv}
                        className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-3 rounded-lg transition font-medium cursor-pointer"
                        title="Download segmented output"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>
                      <button 
                        onClick={handleResetToDefault}
                        className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-3 rounded-lg transition font-medium cursor-pointer"
                        title="Reset transactional data to default template"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reset Baseline</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Segment Filters */}
                  <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-4 w-4 text-slate-400 self-center" />
                      <input 
                        type="text"
                        placeholder="Search Customer ID..."
                        value={rfmSearch}
                        onChange={(e) => setRfmSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Filter Segment:</span>
                      <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                        {["All", "Core High Value", "Standard Active", "Churned / At Risk"].map(seg => (
                          <button
                            key={seg}
                            onClick={() => setSelectedSegmentFilter(seg)}
                            className={`text-[10px] px-2.5 py-1 rounded transition font-medium cursor-pointer ${
                              selectedSegmentFilter === seg 
                                ? "bg-white text-slate-900 shadow-sm" 
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {seg === "Core High Value" ? "🏆 Core" : seg === "Churned / At Risk" ? "🥀 Churned" : seg === "Standard Active" ? "⚖️ Active" : "All"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 text-slate-500 font-mono text-[10px] tracking-wider uppercase border-b border-slate-200">
                          <th className="px-5 py-3">Customer ID</th>
                          <th className="px-4 py-3 text-right">Recency (Days)</th>
                          <th className="px-4 py-3 text-right">Frequency</th>
                          <th className="px-4 py-3 text-right">Monetary Sum</th>
                          <th className="px-4 py-3 text-center">R - F - M Scores</th>
                          <th className="px-5 py-3">Behavioral Segment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400 font-mono">
                              Calculating segmentation matrices...
                            </td>
                          </tr>
                        ) : filteredRfmResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400 font-mono">
                              No customer profiles match this search filter
                            </td>
                          </tr>
                        ) : (
                          filteredRfmResults.map(profile => (
                            <tr key={profile.customer_id} className="hover:bg-slate-50/80 transition-all font-mono">
                              <td className="px-5 py-3 font-semibold text-slate-900">{profile.customer_id}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{profile.Recency} days</td>
                              <td className="px-4 py-3 text-right text-slate-600">{profile.Frequency} orders</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-800">{formatUSD(profile.Monetary)}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="inline-flex space-x-1">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    profile.R_Score >= 3 ? "bg-emerald-50 text-emerald-700" : profile.R_Score === 2 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                  }`} title={`Recency Score: ${profile.R_Score}`}>
                                    R{profile.R_Score}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    profile.F_Score >= 3 ? "bg-emerald-50 text-emerald-700" : profile.F_Score === 2 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                  }`} title={`Frequency Score: ${profile.F_Score}`}>
                                    F{profile.F_Score}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    profile.M_Score >= 3 ? "bg-emerald-50 text-emerald-700" : profile.M_Score === 2 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                  }`} title={`Monetary Score: ${profile.M_Score}`}>
                                    M{profile.M_Score}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  profile.Segment === "Core High Value" 
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                    : profile.Segment === "Churned / At Risk"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}>
                                  <span>{profile.Segment === "Core High Value" ? "🏆" : profile.Segment === "Churned / At Risk" ? "🥀" : "⚖️"}</span>
                                  <span>{profile.Segment}</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Raw Database Logs Grid */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <Database className="h-4 w-4 text-orange-500" />
                        <span>Source Transaction logs (CSV Ledger)</span>
                      </h3>
                      <p className="text-xs text-slate-500">Live, pre-aggregated database of individual shopping records</p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-4 w-4 text-slate-400 self-center" />
                      <input 
                        type="text"
                        placeholder="Filter database rows..."
                        value={txnSearch}
                        onChange={(e) => setTxnSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 text-slate-500 font-mono text-[10px] tracking-wider uppercase border-b border-slate-200 sticky top-0 bg-white">
                          <th className="px-5 py-3">Transaction ID</th>
                          <th className="px-4 py-3">Customer ID</th>
                          <th className="px-4 py-3">Transaction Date</th>
                          <th className="px-5 py-3 text-right">Invoiced Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-mono">
                        {filteredTransactions.map(txn => (
                          <tr key={txn.transaction_id} className="hover:bg-slate-50/50 transition">
                            <td className="px-5 py-2.5 font-semibold text-slate-600">{txn.transaction_id}</td>
                            <td className="px-4 py-2.5 text-slate-900 font-bold">{txn.customer_id}</td>
                            <td className="px-4 py-2.5 text-slate-500">{txn.transaction_date}</td>
                            <td className="px-5 py-2.5 text-right font-medium text-slate-800">{formatUSD(txn.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                    Total Row Ledger Count: {transactions.length} sales events registered in dataset
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: INTERACTIVE STAR SCHEMA EXPLORER */}
        {/* ======================================================== */}
        {activeTab === "schema" && (
          <div className="space-y-6">
            
            {/* Context Explainer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-1.5">
                <Layers className="h-4 w-4 text-orange-500" />
                <span>Dimensional Data Modeling Star Schema Layout (Power BI Built-in)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                A visually mapped enterprise Star Schema warehouse structure. Slicing transactional records in <strong>Fact_Sales</strong> across four surrounding dimension models. Click any table to inspect fields and key joins.
              </p>
            </div>

            {/* Split Screen: Star Canvas on left, Table details on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Star Schema Interactive Interactive Canvas (8 columns) */}
              <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between shadow-lg min-h-[500px] relative overflow-hidden">
                
                {/* Canvas grid background decor */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25 pointer-events-none"></div>

                {/* Header detail info */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest font-mono">Data Warehouse Layer</span>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                      <span>Enterprise Schema</span>
                      <span className="text-slate-500 text-[11px] font-normal">(Power BI Direct Import Join Models)</span>
                    </h3>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-2 bg-slate-950 px-2 py-1 rounded">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                    <span>1:N Joins Configured</span>
                  </div>
                </div>

                {/* Central Star Layout */}
                <div className="relative z-10 flex flex-col items-center justify-center my-8 h-[380px]">
                  
                  {/* Outer Dimensions Layout Grid */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 h-full w-full pointer-events-none">
                    
                    {/* Top Left: Dim_Customers */}
                    <div className="flex items-start justify-start p-4">
                      <button 
                        onClick={() => setSelectedTable(STAR_SCHEMA_TABLES[1])}
                        onMouseEnter={() => setHoveredRelationship("customer_id")}
                        onMouseLeave={() => setHoveredRelationship(null)}
                        className={`pointer-events-auto p-4 rounded-xl border text-left w-[190px] transition-all hover:scale-105 cursor-pointer ${
                          selectedTable.name === "Dim_Customers"
                            ? "bg-slate-950 border-orange-500 shadow-lg shadow-orange-500/10"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2 text-orange-400 font-mono text-xs font-bold mb-1">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span>Dim_Customers</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">Master file of demographics & tenure dates.</p>
                        <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1 flex justify-between items-center">
                          <span>PK: customer_id</span>
                          <span className="text-orange-400 font-bold">1 : 🔑</span>
                        </div>
                      </button>
                    </div>

                    {/* Top Right: Dim_Products */}
                    <div className="flex items-start justify-end p-4">
                      <button 
                        onClick={() => setSelectedTable(STAR_SCHEMA_TABLES[2])}
                        onMouseEnter={() => setHoveredRelationship("product_id")}
                        onMouseLeave={() => setHoveredRelationship(null)}
                        className={`pointer-events-auto p-4 rounded-xl border text-left w-[190px] transition-all hover:scale-105 cursor-pointer ${
                          selectedTable.name === "Dim_Products"
                            ? "bg-slate-950 border-orange-500 shadow-lg shadow-orange-500/10"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2 text-orange-400 font-mono text-xs font-bold mb-1">
                          <Layers className="h-3.5 w-3.5 shrink-0" />
                          <span>Dim_Products</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">Full item inventory categorizations & pricing catalog.</p>
                        <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1 flex justify-between items-center">
                          <span>PK: product_id</span>
                          <span className="text-orange-400 font-bold">1 : 🔑</span>
                        </div>
                      </button>
                    </div>

                    {/* Bottom Left: Dim_Calendar */}
                    <div className="flex items-end justify-start p-4">
                      <button 
                        onClick={() => setSelectedTable(STAR_SCHEMA_TABLES[3])}
                        onMouseEnter={() => setHoveredRelationship("date_key")}
                        onMouseLeave={() => setHoveredRelationship(null)}
                        className={`pointer-events-auto p-4 rounded-xl border text-left w-[190px] transition-all hover:scale-105 cursor-pointer ${
                          selectedTable.name === "Dim_Calendar"
                            ? "bg-slate-950 border-orange-500 shadow-lg shadow-orange-500/10"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2 text-orange-400 font-mono text-xs font-bold mb-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>Dim_Calendar</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">Corporative dates temporal lookup hierarchies.</p>
                        <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1 flex justify-between items-center">
                          <span>PK: date_key</span>
                          <span className="text-orange-400 font-bold">1 : 🔑</span>
                        </div>
                      </button>
                    </div>

                    {/* Bottom Right: Dim_RFM_Segments */}
                    <div className="flex items-end justify-end p-4">
                      <button 
                        onClick={() => setSelectedTable(STAR_SCHEMA_TABLES[4])}
                        onMouseEnter={() => setHoveredRelationship("customer_id")}
                        onMouseLeave={() => setHoveredRelationship(null)}
                        className={`pointer-events-auto p-4 rounded-xl border text-left w-[190px] transition-all hover:scale-105 cursor-pointer ${
                          selectedTable.name === "Dim_RFM_Segments"
                            ? "bg-slate-950 border-orange-500 shadow-lg shadow-orange-500/10"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2 text-orange-400 font-mono text-xs font-bold mb-1">
                          <Database className="h-3.5 w-3.5 shrink-0" />
                          <span>Dim_RFM_Segments</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">Periodically calculated behavioral clusters & scores.</p>
                        <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1 flex justify-between items-center">
                          <span>PK: customer_id</span>
                          <span className="text-orange-400 font-bold">1 : 🔑</span>
                        </div>
                      </button>
                    </div>

                  </div>

                  {/* Connective Relationship Join Lines Overlay (Visual representation of joins) */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none z-0">
                    {/* Connections to center Fact Table */}
                    {/* Top Left connection */}
                    <line x1="25%" y1="25%" x2="50%" y2="50%" stroke={hoveredRelationship === "customer_id" ? "#f97316" : "#334155"} strokeWidth={hoveredRelationship === "customer_id" ? "3" : "1.5"} className="transition-all" />
                    {/* Top Right connection */}
                    <line x1="75%" y1="25%" x2="50%" y2="50%" stroke={hoveredRelationship === "product_id" ? "#f97316" : "#334155"} strokeWidth={hoveredRelationship === "product_id" ? "3" : "1.5"} className="transition-all" />
                    {/* Bottom Left connection */}
                    <line x1="25%" y1="75%" x2="50%" y2="50%" stroke={hoveredRelationship === "date_key" ? "#f97316" : "#334155"} strokeWidth={hoveredRelationship === "date_key" ? "3" : "1.5"} className="transition-all" />
                    {/* Bottom Right connection */}
                    <line x1="75%" y1="75%" x2="50%" y2="50%" stroke={hoveredRelationship === "customer_id" ? "#f97316" : "#334155"} strokeWidth={hoveredRelationship === "customer_id" ? "3" : "1.5"} className="transition-all" />
                  </svg>

                  {/* Center: Fact_Sales Card */}
                  <button 
                    onClick={() => setSelectedTable(STAR_SCHEMA_TABLES[0])}
                    className={`relative z-10 p-5 rounded-2xl border text-center w-[230px] transition shadow-2xl hover:scale-105 cursor-pointer ${
                      selectedTable.name === "Fact_Sales"
                        ? "bg-slate-950 border-orange-500 shadow-orange-500/20"
                        : "bg-slate-950 border-slate-750 hover:border-slate-600"
                    }`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-slate-950 font-mono text-[9px] font-extrabold tracking-wider uppercase px-3 py-0.5 rounded-full shadow">
                      Central Fact
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-orange-400 font-mono text-sm font-bold mb-1.5 mt-1">
                      <TrendingUp className="h-4.5 w-4.5" />
                      <span>Fact_Sales</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Sales ledger containing granular measures and keys.</p>
                    <div className="mt-3 text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5 flex justify-between items-center">
                      <span>FK Keys Included</span>
                      <span className="text-orange-400 font-bold">N : 🛒</span>
                    </div>
                  </button>

                </div>

                {/* Footer interactive tips */}
                <div className="relative z-10 text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <span>💡 Pro-Tip: Hover over dimension cards to emphasize transactional join keys.</span>
                  <span>Power BI DirectImport Core Model</span>
                </div>

              </div>

              {/* Table Schema Inspector Panel (4 columns) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Selected Table details */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full justify-between">
                  
                  {/* Panel Header */}
                  <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <div className="text-[10px] font-bold text-orange-500 font-mono uppercase tracking-wider mb-1">
                      {selectedTable.type === "fact" ? "⚡ FACT TABLE" : "💎 DIMENSION TABLE"}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base font-mono">
                      {selectedTable.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                      {selectedTable.alias}
                    </p>
                  </div>

                  {/* Schema Description */}
                  <div className="p-5 border-b border-slate-200">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Table Description</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedTable.description}
                    </p>
                  </div>

                  {/* Schema Field Detail List */}
                  <div className="p-5 flex-1 max-h-[350px] overflow-y-auto">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-3">Columns & PostgreSQL Data Types</h4>
                    
                    <div className="space-y-2.5">
                      {selectedTable.fields.map(f => (
                        <div key={f.name} className="flex flex-col p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-mono text-slate-900 flex items-center space-x-1.5">
                              {f.keyType === "PK" && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-black" title="Primary Key Unique Constraint">PK</span>
                              )}
                              {f.keyType === "FK" && (
                                <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded font-mono font-black" title="Foreign Key Join Relation">FK</span>
                              )}
                              <span>{f.name}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">{f.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {f.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PostgreSQL DDL Generator */}
                  <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs text-center font-mono">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Generated Ingestion Query</span>
                    <code className="text-slate-700 bg-slate-200/60 p-1.5 rounded block text-[10px] truncate">
                      SELECT * FROM {selectedTable.name};
                    </code>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: VISUAL COHORT ANALYTICS */}
        {/* ======================================================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            
            {/* Business KPI Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Total customers */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Segmented Customers</span>
                  <p className="text-2xl font-black text-slate-900 font-mono">{aggregateStats.totalCustomers}</p>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">Distinct consumer ledger keys</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <Users className="h-6 w-6 text-slate-500" />
                </div>
              </div>

              {/* Total Sales Revenue */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Transaction Volume</span>
                  <p className="text-2xl font-black text-slate-900 font-mono text-emerald-600">{formatUSD(aggregateStats.totalRevenue)}</p>
                  <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded text-emerald-600 font-medium">Aggregated Fact_Sales records</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>

              {/* Core High Value count */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Core High Value (🏆)</span>
                  <p className="text-2xl font-black text-slate-900 font-mono text-emerald-700">{aggregateStats.coreCount}</p>
                  <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded text-emerald-700 font-medium">
                    {aggregateStats.totalCustomers ? ((aggregateStats.coreCount / aggregateStats.totalCustomers) * 100).toFixed(0) : 0}% customer penetrations
                  </span>
                </div>
                <div className="p-3 bg-emerald-100/50 border border-emerald-200 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-700" />
                </div>
              </div>

              {/* At Risk count */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Churned / At Risk (🥀)</span>
                  <p className="text-2xl font-black text-slate-900 font-mono text-rose-600">{aggregateStats.atRiskCount}</p>
                  <span className="text-[10px] bg-rose-50 px-2 py-0.5 rounded text-rose-600 font-medium">
                    {aggregateStats.totalCustomers ? ((aggregateStats.atRiskCount / aggregateStats.totalCustomers) * 100).toFixed(0) : 0}% dormant base count
                  </span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                </div>
              </div>

            </div>

            {/* Dashboard Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Pie: Segment breakdown + Bar: revenue contribution */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
                
                {/* Segment breakdown */}
                <div>
                  <div className="flex items-center space-x-1.5 mb-3">
                    <PieIcon className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer Volume by Segment</h3>
                  </div>
                  
                  <div className="h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Core High Value", value: aggregateStats.coreCount },
                            { name: "Standard Active", value: aggregateStats.activeCount },
                            { name: "Churned / At Risk", value: aggregateStats.atRiskCount },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill={COLOR_MAP["Core High Value"]} />
                          <Cell fill={COLOR_MAP["Standard Active"]} />
                          <Cell fill={COLOR_MAP["Churned / At Risk"]} />
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} Customers`, "Volume"]}
                          contentStyle={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-1.5 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        <span>🏆 Core High Value</span>
                      </span>
                      <span className="font-bold font-mono">{aggregateStats.coreCount} ({aggregateStats.totalCustomers ? ((aggregateStats.coreCount/aggregateStats.totalCustomers)*100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-1.5 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                        <span>⚖️ Standard Active</span>
                      </span>
                      <span className="font-bold font-mono">{aggregateStats.activeCount} ({aggregateStats.totalCustomers ? ((aggregateStats.activeCount/aggregateStats.totalCustomers)*100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-1.5 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                        <span>🥀 Churned / At Risk</span>
                      </span>
                      <span className="font-bold font-mono">{aggregateStats.atRiskCount} ({aggregateStats.totalCustomers ? ((aggregateStats.atRiskCount/aggregateStats.totalCustomers)*100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                </div>

                {/* Average order frequency per customer */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center space-x-1.5 mb-3">
                    <Users className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Average orders per customer</h3>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1 text-slate-500">
                        <span>🏆 Core High Value</span>
                        <span className="font-semibold text-slate-900">{aggregateStats.coreAvgFreq} orders / customer</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (aggregateStats.coreAvgFreq / 5) * 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1 text-slate-500">
                        <span>⚖️ Standard Active</span>
                        <span className="font-semibold text-slate-900">{aggregateStats.activeAvgFreq} orders / customer</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (aggregateStats.activeAvgFreq / 5) * 100)}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1 text-slate-500">
                        <span>🥀 Churned / At Risk</span>
                        <span className="font-semibold text-slate-900">{aggregateStats.atRiskAvgFreq} orders / customer</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (aggregateStats.atRiskAvgFreq / 5) * 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bar & Scatter Charts space (8 columns) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 3D Multi-dimensional Scatter Plot */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <span>3D RFM Cluster Distribution Map</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">X-Axis: Recency (lower days is better) | Y-Axis: Frequency | Size (Z): Monetary value</p>
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span>Core</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        <span>Active</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                        <span>Churned</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                        <XAxis 
                          type="number" 
                          dataKey="Recency" 
                          name="Recency" 
                          unit=" days" 
                          reversed 
                          label={{ value: "Days Since Last Purchase (Reversed)", position: "bottom", offset: 5, fontSize: 10, fontFamily: "var(--font-sans)", fill: "#64748b" }}
                          tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="Frequency" 
                          name="Frequency" 
                          unit=" orders" 
                          label={{ value: "Total Order Count", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fontFamily: "var(--font-sans)", fill: "#64748b" }}
                          tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                        />
                        <ZAxis 
                          type="number" 
                          dataKey="Monetary" 
                          range={[60, 450]} 
                          name="Monetary Value" 
                          unit=" USD" 
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: "3 3" }} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 shadow-xl font-mono text-[10px] space-y-1">
                                  <p className="font-bold text-orange-400 text-xs border-b border-slate-800 pb-1 mb-1">Customer: {data.customer_id}</p>
                                  <p>📅 Recency: {data.Recency} days</p>
                                  <p>🛒 Frequency: {data.Frequency} orders</p>
                                  <p>💰 Monetary: {formatUSD(data.Monetary)}</p>
                                  <p className="pt-1 mt-1 border-t border-slate-800 font-sans text-[9px] uppercase font-bold tracking-wider" style={{ color: COLOR_MAP[data.Segment] }}>
                                    Cohort: {data.Segment}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Render three separate scatter series to control color */}
                        <Scatter 
                          name="Core High Value" 
                          data={rfmResults.filter(r => r.Segment === "Core High Value")} 
                          fill={COLOR_MAP["Core High Value"]} 
                        />
                        <Scatter 
                          name="Standard Active" 
                          data={rfmResults.filter(r => r.Segment === "Standard Active")} 
                          fill={COLOR_MAP["Standard Active"]} 
                        />
                        <Scatter 
                          name="Churned / At Risk" 
                          data={rfmResults.filter(r => r.Segment === "Churned / At Risk")} 
                          fill={COLOR_MAP["Churned / At Risk"]} 
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue contribution bar */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center space-x-1.5 mb-4">
                    <BarChart2 className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gross Spend contribution by Segment</h3>
                  </div>

                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "🏆 Core High Value", "Spend (USD)": aggregateStats.coreRevenue, fill: COLOR_MAP["Core High Value"] },
                          { name: "⚖️ Standard Active", "Spend (USD)": aggregateStats.activeRevenue, fill: COLOR_MAP["Standard Active"] },
                          { name: "🥀 Churned / At Risk", "Spend (USD)": aggregateStats.atRiskRevenue, fill: COLOR_MAP["Churned / At Risk"] },
                        ]}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "var(--font-sans)" }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
                        <Tooltip 
                          formatter={(value) => [formatUSD(value as number), "Spent Value"]}
                          contentStyle={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}
                        />
                        <Bar dataKey="Spend (USD)" radius={[4, 4, 0, 0]}>
                          {
                            [
                              COLOR_MAP["Core High Value"],
                              COLOR_MAP["Standard Active"],
                              COLOR_MAP["Churned / At Risk"]
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[11px] text-slate-500 font-sans mt-2 flex items-center justify-between flex-wrap gap-2">
                    <span>📢 <strong>Spend Penetration Note:</strong> Core High Value represents <strong>{aggregateStats.totalRevenue ? ((aggregateStats.coreRevenue / aggregateStats.totalRevenue) * 100).toFixed(0) : 0}%</strong> of store sales despite being only a fraction of the base.</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: PIPELINE & INGESTION CODE GUIDE */}
        {/* ======================================================== */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            
            {/* Context Explainer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-1.5">
                <Code className="h-4 w-4 text-orange-500" />
                <span>ETL Data Pipeline & Code Integration Repository</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Implement production-ready calculations. Compare standard Python scripts, advanced PostgreSQL window functions, and Power BI DAX calculations side-by-side.
              </p>
            </div>

            {/* Split Screen code view */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Selector panel (4 columns) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Quick Info card */}
                <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 shadow-sm">
                  <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase font-mono">Infrastructure Overview</span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 mt-1">Calculating scores at scale</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    In enterprise setups, RFM metrics are computed in weekly batch data pipelines using PostgreSQL or Python, writing segments into the <strong>Dim_RFM_Segments</strong> table which Power BI imports directly for analytics dashboards.
                  </p>

                  <div className="space-y-3 border-t border-slate-800 pt-3 text-[11px] font-mono">
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-400">⚡</span>
                      <span><strong>Python:</strong> Best for scheduled scripts & cron jobs on CSV files.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-400">⚡</span>
                      <span><strong>PostgreSQL:</strong> Highly efficient directly in databases via window NTILE functions.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-orange-400">⚡</span>
                      <span><strong>Power BI DAX:</strong> Perfect for localized real-time dashboard calculations.</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Tabs Selector */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Integration Framework</span>
                  
                  <button
                    onClick={() => setSelectedCodeTab("python")}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between cursor-pointer ${
                      selectedCodeTab === "python"
                        ? "bg-slate-900 border-slate-900 text-white font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4 shrink-0 text-orange-400" />
                      <span>Python Pandas Script</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setSelectedCodeTab("sql")}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between cursor-pointer ${
                      selectedCodeTab === "sql"
                        ? "bg-slate-900 border-slate-900 text-white font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 shrink-0 text-orange-400" />
                      <span>PostgreSQL Window Query</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setSelectedCodeTab("dax")}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex items-center justify-between cursor-pointer ${
                      selectedCodeTab === "dax"
                        ? "bg-slate-900 border-slate-900 text-white font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 shrink-0 text-orange-400" />
                      <span>Power BI / DAX Measures</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>

                </div>

              </div>

              {/* Right Column: Code block display (8 columns) */}
              <div className="lg:col-span-8 bg-slate-950 text-slate-200 rounded-xl border border-slate-850 overflow-hidden shadow-xl flex flex-col justify-between min-h-[500px]">
                
                {/* Code header */}
                <div className="p-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-mono text-xs text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    <span className="pl-2">
                      {selectedCodeTab === "python" ? "rfm_data_pipeline.py" : selectedCodeTab === "sql" ? "postgres_rfm_calculation.sql" : "Power_BI_Measures.dax"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyCode(
                      selectedCodeTab === "python" ? PYTHON_CODE_TEMPLATE : selectedCodeTab === "sql" ? POSTGRESQL_CODE_TEMPLATE : POWERBI_DAX_MEASURES
                    )}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono px-3 py-1.5 rounded border border-slate-700 transition cursor-pointer"
                  >
                    {copiedText ? "Copied!" : "Copy Code"}
                  </button>
                </div>

                {/* Code viewport */}
                <div className="p-5 flex-1 font-mono text-[11px] leading-relaxed overflow-auto max-h-[460px] select-all">
                  <pre className="text-slate-300">
                    {selectedCodeTab === "python" && PYTHON_CODE_TEMPLATE}
                    {selectedCodeTab === "sql" && POSTGRESQL_CODE_TEMPLATE}
                    {selectedCodeTab === "dax" && POWERBI_DAX_MEASURES}
                  </pre>
                </div>

                {/* Code footer comments */}
                <div className="p-4 bg-slate-900 border-t border-slate-850 text-[10px] text-slate-500 font-mono text-center">
                  {selectedCodeTab === "python" && "# Requires pandas and numpy. Output segments mapped to local CSV."}
                  {selectedCodeTab === "sql" && "-- Built for PostgreSQL 11+. NTILE calculates quantiles at scale."}
                  {selectedCodeTab === "dax" && "-- Direct measures to drop inside Power BI desktop modeling panels."}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Retail Customer Segmentation Playground. Built with Express, Vite & Gemini models.</p>
          <div className="mt-1 flex justify-center space-x-3 text-slate-300">
            <span>Enterprise Data Pipeline Architecture</span>
            <span>•</span>
            <span>Star Schema Integration Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
