import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  Lock, 
  Download, 
  Search, 
  SlidersHorizontal, 
  Zap, 
  BarChart2, 
  Layers, 
  Power,
  Clock,
  Sparkles,
  Server,
  ArrowRightLeft,
  HeartPulse,
  Gauge,
  TrendingUp,
  TrendingDown,
  Pause,
  AlertOctagon,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';

interface LatencyPoint {
  timestamp: string;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
}

interface AiKeyItem {
  id: string;
  name: string;
  keyHint: string;
  status: 'active' | 'disabled' | 'quota_exceeded' | 'invalid';
  priority: number;
  totalRequests: number;
  successRequests: number;
  errorCount: number;
  successRate: number;
  lastLatencyMs?: number;
  avgLatencyMs?: number;
  latencyHistory?: LatencyPoint[];
  lastUsed: string | null;
  lastError: string | null;
  createdTime: string;
}

interface SummaryMetrics {
  totalKeys: number;
  activeKeys: number;
  quotaExceededKeys: number;
  invalidKeys: number;
  disabledKeys: number;
  totalRequests: number;
  overallSuccessRate: number;
  currentActiveKeyId: string;
  currentActiveKeyName: string;
  currentActiveKeyHint: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  keyName: string;
  keyHint: string;
  user: string;
  details: string;
}

interface AiApiManagerProps {
  xoroRole: 'viewer' | 'editor' | 'manager' | 'super_admin';
  settings?: any;
  adminPassword?: string;
}

export const AiApiManager: React.FC<AiApiManagerProps> = ({ xoroRole, settings, adminPassword }) => {
  const isSuperAdmin = xoroRole === 'super_admin';

  // State Management
  const [keys, setKeys] = useState<AiKeyItem[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'quota_exceeded' | 'invalid' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'requests' | 'successRate' | 'name'>('priority');
  const [logSearch, setLogSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'keys' | 'health_monitor' | 'load_balancing' | 'logs'>('keys');

  // Health Monitor Dashboard State
  const [autoPollInterval, setAutoPollInterval] = useState<number>(0);
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<string>('all');
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  const KEY_COLORS = ['#D4AF37', '#10B981', '#3B82F6', '#A855F7', '#F43F5E', '#06B6D4', '#F59E0B'];

  // Health Monitor Computed Stats & Recharts Data Formatters
  const systemAvgLatency = useMemo(() => {
    if (!keys || keys.length === 0) return 0;
    const activeK = keys.filter(k => k.status === 'active');
    if (activeK.length === 0) return 0;
    const sum = activeK.reduce((acc, k) => acc + (k.avgLatencyMs || k.lastLatencyMs || 220), 0);
    return Math.round(sum / activeK.length);
  }, [keys]);

  const systemErrorRate = useMemo(() => {
    if (!keys || keys.length === 0) return 0;
    const totalReq = keys.reduce((acc, k) => acc + k.totalRequests, 0);
    const totalErr = keys.reduce((acc, k) => acc + k.errorCount, 0);
    if (totalReq === 0) return 0;
    return Math.round((totalErr / totalReq) * 100);
  }, [keys]);

  const activeKeysCount = useMemo(() => {
    return keys.filter(k => k.status === 'active').length;
  }, [keys]);

  const bottleneckKeys = useMemo(() => {
    return keys.filter(k => (k.avgLatencyMs || k.lastLatencyMs || 0) > 400 || k.status === 'quota_exceeded');
  }, [keys]);

  const filteredKeysForChart = useMemo(() => {
    if (selectedKeyFilter === 'all') return keys;
    return keys.filter(k => k.id === selectedKeyFilter);
  }, [keys, selectedKeyFilter]);

  // Time-Series Data for Recharts AreaChart
  const chartTimeSeriesData = useMemo(() => {
    if (!keys || keys.length === 0) return [];
    
    const timeMap: Record<string, any> = {};
    const now = new Date();

    const timeSlots: string[] = [];
    for (let i = 9; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 2 * 60 * 1000);
      const timeStr = `${String(slotTime.getHours()).padStart(2, '0')}:${String(slotTime.getMinutes()).padStart(2, '0')}`;
      timeSlots.push(timeStr);
      timeMap[timeStr] = { time: timeStr };
    }

    keys.forEach((k) => {
      const history = k.latencyHistory || [];
      timeSlots.forEach((slotStr, index) => {
        if (history[index] && history[index].latencyMs > 0) {
          timeMap[slotStr][k.name] = history[index].latencyMs;
        } else {
          timeMap[slotStr][k.name] = (k.avgLatencyMs || k.lastLatencyMs || 220);
        }
      });
    });

    return Object.values(timeMap);
  }, [keys]);

  // Comparison Data for Recharts BarChart
  const chartComparisonData = useMemo(() => {
    return keys.map(k => ({
      name: k.name,
      shortName: k.name.replace('Google AI Studio', 'Key').replace('Style X', '').trim(),
      hint: k.keyHint,
      lastLatency: k.lastLatencyMs || 220,
      avgLatency: k.avgLatencyMs || 240,
      successRate: k.successRate,
      errorRate: k.totalRequests > 0 ? Math.round((k.errorCount / k.totalRequests) * 100) : 0,
      status: k.status
    }));
  }, [keys]);

  // Latency Bucket Distribution
  const chartSpeedBuckets = useMemo(() => {
    let fast = 0;      // <200ms
    let optimal = 0;   // 200-400ms
    let moderate = 0;  // 400-800ms
    let bottleneck = 0;// >800ms or quota_exceeded

    keys.forEach(k => {
      const lat = k.avgLatencyMs || k.lastLatencyMs || 250;
      if (k.status === 'quota_exceeded' || lat > 800) {
        bottleneck++;
      } else if (lat > 400) {
        moderate++;
      } else if (lat >= 200) {
        optimal++;
      } else {
        fast++;
      }
    });

    return [
      { bucket: '< 200ms Ultra Fast', count: fast, color: '#10B981' },
      { bucket: '200-400ms Optimal', count: optimal, color: '#D4AF37' },
      { bucket: '400-800ms Elevated', count: moderate, color: '#F59E0B' },
      { bucket: '> 800ms Bottleneck', count: bottleneck, color: '#EF4444' }
    ];
  }, [keys]);

  // Live Benchmark Handler
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/ai-keys/benchmark', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.keys) {
        setKeys(data.keys);
        setSuccessMsg(`⚡ Live latency benchmark completed across ${data.results?.length || 0} active keys! Real-time charts updated.`);
        fetchAuditLogs();
      } else {
        throw new Error(data.error || 'Benchmark failed');
      }
    } catch (err: any) {
      console.error('Benchmark error:', err);
      setErrorMsg(err.message || 'Failed to execute live latency benchmark');
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Auto Polling Effect for Real-Time Streaming
  useEffect(() => {
    let interval: any = null;
    if (autoPollInterval > 0 && activeSubTab === 'health_monitor') {
      interval = setInterval(() => {
        fetchKeyData();
      }, autoPollInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoPollInterval, activeSubTab]);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySecret, setNewKeySecret] = useState('');
  const [newKeyPriority, setNewKeyPriority] = useState(1);
  const [isSubmittingNewKey, setIsSubmittingNewKey] = useState(false);
  const [addKeyError, setAddKeyError] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AiKeyItem | null>(null);

  // Delete Password Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<AiKeyItem | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Key Testing State
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs?: number; message?: string; error?: string }>>({});

  const getAuthHeaders = () => {
    const email = settings?.adminEmail || sessionStorage.getItem('stylex_admin_email') || "risatadnan4@gmail.com";
    const pass = settings?.adminPassword || sessionStorage.getItem('stylex_admin_password') || "risat123";
    return {
      'Content-Type': 'application/json',
      'x-admin-email': email,
      'x-admin-password': pass,
      'x-csrf-token': 'stylex-csrf-secure-handshake-98322'
    };
  };

  const fetchKeyData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/ai-keys', { headers: getAuthHeaders() });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load AI Key Pool`);
      }
      const data = await res.json();
      setKeys(data.keys || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error("Failed to fetch AI keys:", err);
      setErrorMsg(err.message || 'Failed to connect to AI API Manager server');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/ai-keys/logs', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  useEffect(() => {
    fetchKeyData();
    fetchAuditLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKeyData();
    fetchAuditLogs();
  };

  // Add Key
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanedKey = newKeySecret.trim();
    if (cleanedKey.includes("=")) {
      cleanedKey = cleanedKey.split("=").pop()?.trim() || cleanedKey;
    }
    if ((cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) || (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))) {
      cleanedKey = cleanedKey.slice(1, -1).trim();
    }

    const isUsingDefault = cleanedKey === '' || cleanedKey === 'SERVER_DEFAULT';

    setIsSubmittingNewKey(true);
    setAddKeyError('');

    try {
      const res = await fetch('/api/admin/ai-keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newKeyName.trim() || (isUsingDefault ? 'Server Default GEMINI_API_KEY' : `Google AI Studio Key ${keys.length + 1}`),
          key: cleanedKey,
          apiKey: cleanedKey,
          useEnv: isUsingDefault,
          priority: newKeyPriority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add API key');
      }

      setSuccessMsg('✅ API Key successfully added to encrypted server vault.');
      setIsAddModalOpen(false);
      setNewKeyName('');
      setNewKeySecret('');
      setNewKeyPriority(1);
      fetchKeyData();
      fetchAuditLogs();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setAddKeyError(err.message || 'Failed to add key');
    } finally {
      setIsSubmittingNewKey(false);
    }
  };

  // Toggle Key Status
  const handleToggleKey = async (key: AiKeyItem) => {
    try {
      const res = await fetch(`/api/admin/ai-keys/${key.id}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchKeyData();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error("Failed to toggle key:", err);
    }
  };

  // Test Key
  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await fetch(`/api/admin/ai-keys/${keyId}/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setTestResults(prev => ({
        ...prev,
        [keyId]: {
          success: data.success,
          latencyMs: data.latencyMs,
          message: data.message,
          error: data.error
        }
      }));
      fetchKeyData();
      fetchAuditLogs();
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [keyId]: {
          success: false,
          error: err.message || 'Network error during test'
        }
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  // Update Key
  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;

    try {
      const res = await fetch(`/api/admin/ai-keys/${editingKey.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingKey.name,
          priority: editingKey.priority,
          status: editingKey.status
        })
      });

      if (res.ok) {
        setSuccessMsg('✅ API Key settings saved.');
        setIsEditModalOpen(false);
        setEditingKey(null);
        fetchKeyData();
        fetchAuditLogs();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error("Failed to update key:", err);
    }
  };

  // Delete Key with Password
  const handleDeleteKeyConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingKey) return;

    if (!deletePasswordInput.trim()) {
      setDeletePasswordError('Super Admin password is required.');
      return;
    }

    setIsDeleting(true);
    setDeletePasswordError('');

    try {
      const res = await fetch(`/api/admin/ai-keys/${deletingKey.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password: deletePasswordInput.trim(),
          confirmPassword: deletePasswordInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete key');
      }

      setSuccessMsg(`🗑️ API Key '${deletingKey.name}' permanently deleted.`);
      setIsDeleteModalOpen(false);
      setDeletingKey(null);
      setDeletePasswordInput('');
      fetchKeyData();
      fetchAuditLogs();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setDeletePasswordError(err.message || 'Deletion authorization failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportLogs = () => {
    window.open('/api/admin/ai-keys/logs/export', '_blank');
  };

  // Filter & Sort Keys
  const filteredKeys = useMemo(() => {
    return keys
      .filter(k => {
        const matchesSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              k.keyHint.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return a.priority - b.priority;
        if (sortBy === 'requests') return b.totalRequests - a.totalRequests;
        if (sortBy === 'successRate') return b.successRate - a.successRate;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [keys, searchTerm, statusFilter, sortBy]);

  // Filter Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.keyName.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.user.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [logs, logSearch]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-[#12081f]/80 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl text-center space-y-4 max-w-2xl mx-auto my-12 shadow-[0_20px_50px_rgba(239,68,68,0.15)]">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-white font-serif">Super Admin Access Required</h2>
        <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed font-sans">
          The <span className="text-luxury-gold font-semibold">AI API Manager</span> controls sensitive server-side API key vaults, encrypted credentials, auto-failover, and rotation rules. Access is restricted exclusively to authenticated Super Admin personnel.
        </p>
        <div className="pt-2">
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 font-mono">
            Current Role: {xoroRole.toUpperCase()} (Unauthorized)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto animate-fade-in text-white pb-12">
      {/* HEADER BAR */}
      <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-luxury-gold/15 text-luxury-gold text-[9.5px] font-mono font-bold uppercase tracking-widest border border-luxury-gold/30 flex items-center gap-1">
                <ShieldCheck size={11} className="text-luxury-gold" /> Encrypted Vault
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9.5px] font-mono font-bold uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Auto Failover Active
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-wide flex items-center gap-2.5">
              <Key className="text-luxury-gold" size={24} /> AI API Manager
            </h1>
            <p className="text-xs text-white/80 max-w-2xl font-sans">
              Manage unlimited Google AI Studio API Keys with automatic load balancing, quota limit detection, seamless failover rotation, and zero-exposure encrypted security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-[#0B0B0F] border border-white/15 hover:border-luxury-gold/40 text-white/90 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-luxury-gold' : ''} />
              Refresh
            </button>

            <button
              onClick={handleExportLogs}
              className="px-3.5 py-2 rounded-xl bg-[#0B0B0F] border border-white/15 hover:border-luxury-gold/40 text-white/90 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download size={13} className="text-luxury-gold" />
              Export Audit Logs
            </button>

            <button
              onClick={() => { setIsAddModalOpen(true); setAddKeyError(''); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold via-amber-400 to-luxury-gold text-luxury-black font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all cursor-pointer active:scale-95 group"
            >
              <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" /> 
              <span>+ Add Your Custom Key</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGES */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fade-in">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono flex items-center justify-between animate-fade-in">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* METRIC CARDS GRID */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Keys */}
          <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] p-4 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/60">API Key Pool Size</span>
              <Key size={16} className="text-luxury-gold" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{summary.totalKeys}</span>
              <span className="text-[11px] text-emerald-400 font-mono">Keys Enrolled</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-white/70">
              <span className="text-emerald-400">🟢 {summary.activeKeys} Active</span>
              {summary.quotaExceededKeys > 0 && <span className="text-amber-400">⚠️ {summary.quotaExceededKeys} Quota Exceeded</span>}
              {summary.invalidKeys > 0 && <span className="text-red-400">⛔ {summary.invalidKeys} Invalid</span>}
              {summary.disabledKeys > 0 && <span className="text-white/50">⏸️ {summary.disabledKeys} Disabled</span>}
            </div>
          </div>

          {/* Card 2: Current Active Key */}
          <div className="bg-[#15151D] border border-luxury-gold/40 p-4 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-luxury-gold flex items-center gap-1 font-bold">
                <Zap size={12} /> Current Active Key
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-white font-mono truncate">{summary.currentActiveKeyName}</div>
              <div className="text-[10px] font-mono text-luxury-gold/90 mt-0.5">Reference: {summary.currentActiveKeyHint}</div>
            </div>
            <div className="mt-2 text-[9.5px] font-mono text-white/60 flex items-center gap-1">
              <ArrowRightLeft size={10} className="text-luxury-gold" /> Load-balanced across active keys
            </div>
          </div>

          {/* Card 3: Total AI Requests */}
          <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] p-4 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/60">Total AI Calls Handled</span>
              <Activity size={16} className="text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{summary.totalRequests.toLocaleString()}</span>
              <span className="text-[11px] text-purple-300 font-mono">Requests</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-white/70">
              ⚡ Automatic failover retry on error 429 / 403
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] p-4 rounded-2xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/60">Overall Pool Success Rate</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">{summary.overallSuccessRate}%</span>
              <span className="text-[11px] text-white/60 font-mono">Reliability</span>
            </div>
            <div className="mt-2.5 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-luxury-gold to-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, summary.overallSuccessRate)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveSubTab('keys')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'keys'
              ? 'bg-luxury-gold text-luxury-black font-extrabold shadow-lg'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Key size={13} /> Active Key Pool ({keys.length})
        </button>

        <button
          onClick={() => setActiveSubTab('health_monitor')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'health_monitor'
              ? 'bg-luxury-gold text-luxury-black font-extrabold shadow-lg'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Activity size={13} className={activeSubTab === 'health_monitor' ? 'text-luxury-black' : 'text-emerald-400'} /> Health Monitor & Latency
        </button>

        <button
          onClick={() => setActiveSubTab('load_balancing')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'load_balancing'
              ? 'bg-luxury-gold text-luxury-black font-extrabold shadow-lg'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Layers size={13} /> Load Balancing & Analytics
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-luxury-gold text-luxury-black font-extrabold shadow-lg'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Clock size={13} /> Audit Logs ({logs.length})
        </button>
      </div>

      {/* SUB-TAB 1: KEYS POOL LIST */}
      {activeSubTab === 'keys' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
              <input
                type="text"
                placeholder="Search key by name or hint (e.g. '89F1')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-luxury-gold/50"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'active', 'quota_exceeded', 'invalid', 'disabled'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/40'
                      : 'bg-black/30 text-white/50 border border-white/5 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1 shrink-0">
                <SlidersHorizontal size={11} /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-black/50 border border-white/10 text-xs text-white/80 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-luxury-gold/50 font-mono"
              >
                <option value="priority">Priority (High first)</option>
                <option value="requests">Most Requests</option>
                <option value="successRate">Highest Success Rate</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* KEYS CARDS GRID */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="animate-spin text-luxury-gold mx-auto" size={28} />
              <p className="text-xs font-mono text-white/50">Loading Encrypted AI Key Pool Vault...</p>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="py-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
              <Key className="mx-auto text-white/20" size={36} />
              <p className="text-sm font-semibold text-white/70">No API Keys Match Your Filter</p>
              <p className="text-xs text-white/40 max-w-sm mx-auto font-sans">
                Try clearing search terms or add a new Google AI Studio API key to the active rotation pool.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKeys.map((k) => {
                const isCurrentActive = summary?.currentActiveKeyId === k.id;
                const testResult = testResults[k.id];

                return (
                  <div
                    key={k.id}
                    className={`bg-[#120822]/60 backdrop-blur-xl border p-5 rounded-2xl flex flex-col justify-between relative transition-all duration-300 hover:border-luxury-gold/50 ${
                      isCurrentActive
                        ? 'border-luxury-gold/50 shadow-[0_0_25px_rgba(212,175,55,0.15)] bg-gradient-to-b from-[#180a32]/80 to-[#120822]/60'
                        : 'border-white/10 shadow-lg'
                    }`}
                  >
                    {/* Top Status & Priority Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                          k.priority === 1
                            ? 'bg-luxury-gold/15 text-luxury-gold border-luxury-gold/30'
                            : 'bg-white/5 text-white/60 border-white/10'
                        }`}>
                          ⭐ Priority {k.priority}
                        </span>

                        {/* Status Indicator Badge */}
                        {k.status === 'active' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9.5px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                          </span>
                        )}

                        {k.status === 'quota_exceeded' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9.5px] font-mono font-bold border border-amber-500/30 flex items-center gap-1.5">
                            <AlertTriangle size={10} /> Quota Exceeded
                          </span>
                        )}

                        {k.status === 'invalid' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[9.5px] font-mono font-bold border border-red-500/30 flex items-center gap-1.5">
                            <XCircle size={10} /> Invalid Key
                          </span>
                        )}

                        {k.status === 'disabled' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 text-[9.5px] font-mono font-bold border border-white/10 flex items-center gap-1.5">
                            <Power size={10} /> Disabled
                          </span>
                        )}
                      </div>

                      {/* Key Name & Masked Key Hint */}
                      <div className="pt-1">
                        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5 truncate">
                          {k.name}
                          {isCurrentActive && (
                            <span className="text-[8px] bg-luxury-gold/20 text-luxury-gold px-1.5 py-0.2 rounded uppercase font-mono font-black border border-luxury-gold/40">
                              IN USE NOW
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-luxury-gold tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/5 select-none">
                            {k.keyHint}
                          </span>
                          <span className="text-[9.5px] text-white/40 font-mono flex items-center gap-1">
                            <Lock size={9} /> Encrypted
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics Grid */}
                    <div className="my-4 py-3 border-y border-white/5 grid grid-cols-3 gap-2 text-center bg-black/20 rounded-xl p-2">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-white/40 block">Total Calls</span>
                        <span className="text-sm font-mono font-bold text-white">{k.totalRequests}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-white/40 block">Success Rate</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">{k.successRate}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-white/40 block">Errors</span>
                        <span className={`text-sm font-mono font-bold ${k.errorCount > 0 ? 'text-red-400' : 'text-white/60'}`}>
                          {k.errorCount}
                        </span>
                      </div>
                    </div>

                    {/* Last Error or Last Used Note */}
                    <div className="space-y-1 mb-4 text-[10px] font-mono">
                      <div className="flex items-center justify-between text-white/50">
                        <span>Last Used:</span>
                        <span className="text-white/80">{k.lastUsed ? new Date(k.lastUsed).toLocaleTimeString() : 'Never'}</span>
                      </div>
                      {k.lastError && (
                        <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[9.5px] truncate">
                          ⚠️ {k.lastError}
                        </div>
                      )}
                      {testResult && (
                        <div className={`p-2 rounded text-[9.5px] border ${
                          testResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                        }`}>
                          {testResult.success
                            ? `⚡ Ping OK (${testResult.latencyMs}ms)`
                            : `❌ Test Failed: ${testResult.error}`}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/5">
                      {/* Test Button */}
                      <button
                        onClick={() => handleTestKey(k.id)}
                        disabled={testingKeyId === k.id}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-luxury-gold/15 border border-white/10 hover:border-luxury-gold/30 text-white/80 hover:text-luxury-gold text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Ping Google AI Studio API with a 1-token test call"
                      >
                        <Zap size={11} className={testingKeyId === k.id ? 'animate-bounce text-luxury-gold' : 'text-luxury-gold'} />
                        {testingKeyId === k.id ? 'Testing...' : 'Test Key'}
                      </button>

                      {/* Toggle Enable/Disable Button */}
                      <button
                        onClick={() => handleToggleKey(k)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          k.status === 'active'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Power size={11} />
                        {k.status === 'active' ? 'Disable' : 'Enable'}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => { setEditingKey({ ...k }); setIsEditModalOpen(true); }}
                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[10px] font-mono transition-all cursor-pointer"
                        title="Edit name or priority"
                      >
                        <Edit3 size={11} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          setDeletingKey(k);
                          setDeletePasswordInput('');
                          setDeletePasswordError('');
                          setIsDeleteModalOpen(true);
                        }}
                        className="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-mono transition-all cursor-pointer"
                        title="Delete key (Requires Super Admin Password)"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: REAL-TIME HEALTH MONITOR & LATENCY DASHBOARD */}
      {activeSubTab === 'health_monitor' && (
        <div className="space-y-6">
          {/* TOP CONTROLS & REAL-TIME BENCHMARK BAR */}
          <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                    Real-Time API Health & Latency Monitor
                  </h3>
                </div>
                <p className="text-xs text-white/60">
                  Live response time metrics, error rate trends, latency distribution, and automated bottleneck detection for all active Google AI Studio keys.
                </p>
              </div>

              {/* ACTION CONTROLS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Auto Refresh Toggle */}
                <button
                  onClick={() => setAutoPollInterval(prev => prev === 0 ? 10 : prev === 10 ? 5 : 0)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all border cursor-pointer ${
                    autoPollInterval > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                  }`}
                  title="Toggle Live Streaming Updates (Auto-ping)"
                >
                  {autoPollInterval > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Stream ({autoPollInterval}s)
                    </>
                  ) : (
                    <>
                      <Pause size={12} />
                      Stream Off
                    </>
                  )}
                </button>

                {/* Key Selector Filter */}
                <select
                  value={selectedKeyFilter}
                  onChange={(e) => setSelectedKeyFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-2 font-mono outline-none focus:border-luxury-gold"
                >
                  <option value="all">⚡ All Keys Aggregate</option>
                  {keys.map(k => (
                    <option key={k.id} value={k.id}>{k.name} ({k.keyHint})</option>
                  ))}
                </select>

                {/* Instant Benchmark Button */}
                <button
                  onClick={handleRunBenchmark}
                  disabled={isBenchmarking}
                  className="px-4 py-2 bg-gradient-to-r from-luxury-gold via-amber-400 to-emerald-500 text-luxury-black font-extrabold text-xs font-mono rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isBenchmarking ? "animate-spin" : ""} />
                  {isBenchmarking ? "Benchmarking Pool..." : "Run Live Latency Benchmark"}
                </button>
              </div>
            </div>

            {/* QUICK HEALTH INDICATOR TILES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
              {/* Tile 1: Avg System Latency */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1">
                  <Activity size={12} className="text-luxury-gold" /> Avg System Latency
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    {systemAvgLatency} <span className="text-xs text-white/50">ms</span>
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    systemAvgLatency < 300 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : systemAvgLatency < 600 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {systemAvgLatency < 300 ? 'Optimal' : systemAvgLatency < 600 ? 'Moderate' : 'Bottleneck'}
                  </span>
                </div>
              </div>

              {/* Tile 2: Overall Error Rate */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1">
                  <ShieldAlert size={12} className="text-amber-400" /> System Error Rate
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    {systemErrorRate}%
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    systemErrorRate < 2 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : systemErrorRate < 8 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {systemErrorRate < 2 ? 'Healthy' : systemErrorRate < 8 ? 'Elevated' : 'High Errors'}
                  </span>
                </div>
              </div>

              {/* Tile 3: Active Pool Capacity */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1">
                  <Key size={12} className="text-purple-400" /> Pool Availability
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    {activeKeysCount} / {keys.length} <span className="text-xs text-white/50">Active</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {Math.round((activeKeysCount / Math.max(keys.length, 1)) * 100)}% Cap
                  </span>
                </div>
              </div>

              {/* Tile 4: Bottleneck Alert Indicator */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1">
                  <Zap size={12} className="text-cyan-400" /> Bottleneck Status
                </span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-sm font-bold font-mono truncate ${
                    bottleneckKeys.length === 0 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                  }`}>
                    {bottleneckKeys.length === 0 ? 'No Bottlenecks' : `${bottleneckKeys.length} Key Alert`}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    bottleneckKeys.length === 0 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {bottleneckKeys.length === 0 ? 'Smooth' : 'Needs Action'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTLENECK ALERT & RECOMMENDATION BANNER */}
          {bottleneckKeys.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-purple-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300 font-mono flex items-center gap-2">
                    Performance Bottleneck Identified
                  </h4>
                  <p className="text-xs text-white/70 mt-0.5">
                    {bottleneckKeys.map(b => `${b.name} (${b.avgLatencyMs || b.lastLatencyMs}ms latency)`).join(', ')}.
                    Elevated latency or quota warnings detected. High latency keys may cause customer AI chat response delays.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={handleRunBenchmark}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                >
                  Re-Test Pool
                </button>
              </div>
            </div>
          )}

          {/* RECHARTS SECTION 1: TIME-SERIES API LATENCY TRENDS */}
          <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <TrendingUp className="text-luxury-gold" size={16} /> Real-Time Latency Trends (Milliseconds)
                </h4>
                <p className="text-xs text-white/50">
                  Response latency trajectory measured over time across active keys in the rotation pool.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-white/50">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span> Warning (400ms)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-red-500 inline-block"></span> Bottleneck (800ms)
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTimeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                    </linearGradient>
                    {keys.map((k, idx) => (
                      <linearGradient key={k.id} id={`grad_${k.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={KEY_COLORS[idx % KEY_COLORS.length]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={KEY_COLORS[idx % KEY_COLORS.length]} stopOpacity={0.0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis dataKey="time" stroke="#ffffff60" fontSize={11} tickLine={false} />
                  <YAxis stroke="#ffffff60" fontSize={11} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#ffffff20',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine y={400} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Warning (400ms)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                  <ReferenceLine y={800} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (800ms)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />

                  {filteredKeysForChart.map((k, idx) => (
                    <Area
                      key={k.id}
                      type="monotone"
                      dataKey={k.name}
                      stroke={KEY_COLORS[idx % KEY_COLORS.length]}
                      fill={`url(#grad_${k.id})`}
                      strokeWidth={2}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECHARTS SECTION 2 & 3: GRID WITH KEY LATENCY COMPARISON & RESPONSE DISTRIBUTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BAR CHART: LATENCY vs ERROR RATE COMPARISON */}
            <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-5 rounded-2xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <BarChart2 className="text-luxury-gold" size={16} /> Key Performance Comparison
                </h4>
                <p className="text-xs text-white/50">
                  Average Latency (ms) side-by-side for active Google AI Studio keys in rotation.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                    <XAxis dataKey="shortName" stroke="#ffffff60" fontSize={10} tickLine={false} />
                    <YAxis stroke="#ffffff60" fontSize={11} tickLine={false} unit="ms" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0f',
                        borderColor: '#ffffff20',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="avgLatency" name="Avg Latency (ms)" radius={[6, 6, 0, 0]}>
                      {chartComparisonData.map((entry, index) => {
                        const color = entry.avgLatency < 300 
                          ? '#10B981' 
                          : entry.avgLatency < 600 
                          ? '#F59E0B' 
                          : '#EF4444';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SPEED BUCKET DISTRIBUTION */}
            <div className="bg-[#15151D] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-5 rounded-2xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Gauge className="text-purple-400" size={16} /> Latency Distribution Breakdown
                </h4>
                <p className="text-xs text-white/50">
                  Distribution of API key response speeds across health latency buckets.
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSpeedBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                    <XAxis dataKey="bucket" stroke="#ffffff60" fontSize={10} tickLine={false} />
                    <YAxis stroke="#ffffff60" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0a0f',
                        borderColor: '#ffffff20',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="count" name="Keys Count" radius={[6, 6, 0, 0]}>
                      {chartSpeedBuckets.map((entry, index) => (
                        <Cell key={`bucket-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* INDIVIDUAL KEY HEALTH MATRIX CARDS */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Key className="text-luxury-gold" size={16} /> Key Health Matrix
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keys.map((k) => {
                const isTesting = testingKeyId === k.id;
                const lat = k.lastLatencyMs || k.avgLatencyMs || 220;

                return (
                  <div key={k.id} className="bg-black/40 border border-white/10 hover:border-luxury-gold/40 transition-all p-4 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                          {k.name}
                        </h5>
                        <span className="text-[10px] font-mono text-luxury-gold/80">{k.keyHint}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        k.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : k.status === 'quota_exceeded'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {k.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] text-white/50 block">Last Latency</span>
                        <span className={`font-bold ${lat < 300 ? 'text-emerald-400' : lat < 600 ? 'text-amber-400' : 'text-red-400'}`}>
                          {lat} ms
                        </span>
                      </div>

                      <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] text-white/50 block">Success Rate</span>
                        <span className="font-bold text-white">
                          {k.successRate}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-white/60 pt-1">
                      <span>Priority: P{k.priority}</span>
                      <span>Reqs: {k.totalRequests}</span>
                    </div>

                    <button
                      onClick={() => handleTestKey(k.id)}
                      disabled={isTesting}
                      className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Zap size={11} className={isTesting ? "animate-bounce text-amber-400" : "text-luxury-gold"} />
                      {isTesting ? "Testing Ping..." : "Ping Test Latency"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LOAD BALANCING VISUALIZATION */}
      {activeSubTab === 'load_balancing' && (
        <div className="bg-[#120822]/60 border border-white/10 p-6 rounded-2xl space-y-6 backdrop-blur-xl">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
              <Layers className="text-luxury-gold" size={18} /> Smart Load Balancing & Request Distribution
            </h3>
            <p className="text-xs text-white/60 font-sans">
              Visual overview of how AI completion requests are distributed across active API keys based on priority level and round-robin load distribution.
            </p>
          </div>

          <div className="space-y-4">
            {keys.map((k) => {
              const maxReq = Math.max(...keys.map(x => x.totalRequests), 1);
              const percentage = Math.round((k.totalRequests / maxReq) * 100);

              return (
                <div key={k.id} className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{k.name}</span>
                      <span className="text-luxury-gold/80">({k.keyHint})</span>
                      <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.2 rounded text-white/50">
                        Priority {k.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-white/70">
                      <span>{k.totalRequests} Requests</span>
                      <span className="text-emerald-400">{k.successRate}% Success</span>
                    </div>
                  </div>

                  {/* Load bar */}
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        k.status === 'active'
                          ? 'bg-gradient-to-r from-luxury-gold via-amber-400 to-purple-500'
                          : k.status === 'quota_exceeded'
                          ? 'bg-amber-500'
                          : k.status === 'invalid'
                          ? 'bg-red-500'
                          : 'bg-white/20'
                      }`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#120822]/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                <Clock className="text-luxury-gold" size={18} /> Security & Failover Audit Logs
              </h3>
              <p className="text-xs text-white/60 font-sans">
                Immutable audit trail recording every key addition, quota failover event, status toggle, test ping, and removal action.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-luxury-gold/50"
              />
              <button
                onClick={handleExportLogs}
                className="px-3 py-1.5 rounded-xl bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold/20 text-xs font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Download size={12} /> CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-black/40 border-b border-white/10 text-white/40 uppercase text-[9px] tracking-wider">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Key Name & Hint</th>
                  <th className="p-3">Initiated By</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/40">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-white/50 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          log.action.includes('FAILOVER') || log.action.includes('INVALID')
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : log.action.includes('ADDED')
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : log.action.includes('DELETED')
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-white/5 text-white/70 border-white/10'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        {log.keyName} <span className="text-luxury-gold/80 font-normal">({log.keyHint || '••••'})</span>
                      </td>
                      <td className="p-3 text-purple-300">{log.user}</td>
                      <td className="p-3 text-white/60 max-w-md truncate">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW API KEY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120822] border border-luxury-gold/50 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                <Plus className="text-luxury-gold" size={20} /> Add Custom Google AI Key
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-white text-lg">✕</button>
            </div>

            <div className="p-3 bg-luxury-gold/10 border border-luxury-gold/25 rounded-xl text-xs text-amber-200/90 font-sans space-y-1">
              <p className="font-semibold text-luxury-gold flex items-center gap-1.5">
                <Key size={13} /> Set Your Own Key
              </p>
              <p className="text-[11px] text-white/70 leading-relaxed">
                You can generate a free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-luxury-gold underline hover:text-white">aistudio.google.com</a> and paste it below.
              </p>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-white/70 block">Key Name / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. My Personal Gemini Key or Backup Key 1"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold/50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-white/70 block">Google AI Studio API Key Secret</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewKeySecret('SERVER_DEFAULT');
                      if (!newKeyName) setNewKeyName('Server Default GEMINI_API_KEY');
                    }}
                    className="text-[10px] font-mono text-luxury-gold hover:underline bg-luxury-gold/10 hover:bg-luxury-gold/20 px-2 py-0.5 rounded border border-luxury-gold/30 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    ⚡ Use Server Environment Key
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="AIzaSy... or click 'Use Server Environment Key'"
                  value={newKeySecret}
                  onChange={(e) => setNewKeySecret(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-luxury-gold focus:outline-none focus:border-luxury-gold/50"
                />
                <p className="text-[10px] text-white/50 font-mono flex items-center gap-1">
                  <span>🔒 Key is encrypted server-side with AES-256 and auto-sanitized (quotes or env prefixes stripped automatically).</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-white/70 block">Priority Level (1 = Highest Priority)</label>
                <select
                  value={newKeyPriority}
                  onChange={(e) => setNewKeyPriority(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold/50 font-mono"
                >
                  <option value={1}>Priority 1 (High - Primary Rotation)</option>
                  <option value={2}>Priority 2 (Medium - Secondary Pool)</option>
                  <option value={3}>Priority 3 (Low - Fallback Reserve)</option>
                </select>
              </div>

              {addKeyError && (
                <p className="text-xs font-mono text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                  ⚠️ {addKeyError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewKey}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-luxury-gold via-amber-400 to-luxury-gold text-luxury-black font-bold text-xs uppercase cursor-pointer hover:shadow-lg transition-all"
                >
                  {isSubmittingNewKey ? 'Encrypting & Saving...' : 'Save API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT API KEY */}
      {isEditModalOpen && editingKey && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120822] border border-white/20 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                <Edit3 className="text-luxury-gold" size={20} /> Edit API Key Settings
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-white/70 block">Key Name</label>
                <input
                  type="text"
                  value={editingKey.name}
                  onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-white/70 block">Key Status</label>
                <select
                  value={editingKey.status}
                  onChange={(e: any) => setEditingKey({ ...editingKey, status: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold/50 font-mono"
                >
                  <option value="active">Active (In Pool)</option>
                  <option value="disabled">Disabled (Paused)</option>
                  <option value="quota_exceeded">Quota Exceeded</option>
                  <option value="invalid">Invalid</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-white/70 block">Priority Level</label>
                <select
                  value={editingKey.priority}
                  onChange={(e) => setEditingKey({ ...editingKey, priority: Number(e.target.value) })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-luxury-gold/50 font-mono"
                >
                  <option value={1}>Priority 1 (Highest)</option>
                  <option value={2}>Priority 2 (Medium)</option>
                  <option value={3}>Priority 3 (Low)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-luxury-gold text-luxury-black font-bold text-xs uppercase cursor-pointer hover:shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE KEY (PASSWORD CONFIRMATION) */}
      {isDeleteModalOpen && deletingKey && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#180a24] border border-red-500/40 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-scale-in">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <h3 className="text-lg font-bold font-serif text-red-400 flex items-center gap-2">
                <Trash2 size={20} /> Confirm Key Deletion
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-white/80 font-sans leading-relaxed">
                You are about to permanently delete <span className="font-bold text-luxury-gold">{deletingKey.name}</span> (<span className="font-mono">{deletingKey.keyHint}</span>) from the encrypted server pool.
              </p>

              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-300 text-[11px] font-mono">
                🔒 Security Requirement: Please enter your Super Admin Password to authorize key deletion.
              </div>

              <form onSubmit={handleDeleteKeyConfirm} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-white/70 block">Super Admin Password</label>
                  <input
                    type="password"
                    placeholder="Enter Super Admin Password..."
                    value={deletePasswordInput}
                    onChange={(e) => setDeletePasswordInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                  />
                </div>

                {deletePasswordError && (
                  <p className="text-xs font-mono text-red-400 bg-red-500/15 p-2 rounded-lg border border-red-500/30">
                    ⚠️ {deletePasswordError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs uppercase cursor-pointer shadow-lg hover:shadow-red-500/30 transition-all"
                  >
                    {isDeleting ? 'Verifying Password...' : 'Permanently Delete Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiApiManager;
