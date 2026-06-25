import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, LogOut, Activity, DollarSign, Percent, Flame, 
  Terminal, Cpu, MapPin, ShoppingBag, Send, AlertCircle, 
  CheckCircle, Clock, Share2, Eye, EyeOff, FileText, X, 
  ChevronRight, Info, User, Users, ShieldAlert, AlertTriangle, RefreshCw
} from 'lucide-react';

const Metrics = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'transactions', 'cases', 'rings', 'simulator', 'shadow', 'audit'
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProtected: 0,
    totalAmountProtected: 0,
    threatsBlocked: 0,
    trustScore: 100
  });

  // State for other tabs
  const [cases, setCases] = useState([]);
  const [fraudRings, setFraudRings] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [shadowModeEnabled, setShadowModeEnabled] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [analystNote, setAnalystNote] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Form simulator inputs
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [location, setLocation] = useState('');
  const [ipAddress, setIpAddress] = useState('192.168.1.45');
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState('');
  const [simSuccess, setSimSuccess] = useState('');

  // Filtering live stream
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [filterMaxScore, setFilterMaxScore] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Biometrics signals state
  const [mouseVelocities, setMouseVelocities] = useState([]);
  const [lastMousePos, setLastMousePos] = useState(null);
  const [lastMouseTime, setLastMouseTime] = useState(0);
  const [keystrokeTimes, setKeystrokeTimes] = useState([]);
  const [lastKeystrokeTime, setLastKeystrokeTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [currentBiometrics, setCurrentBiometrics] = useState({
    mouseVelocityAvg: 0,
    mouseVelocityStdDev: 0,
    typingCadenceAvg: 0,
    typingCadenceStdDev: 0,
    clickCount: 0,
    sessionDurationMs: 0
  });

  // Device Fingerprint
  const [deviceFp, setDeviceFp] = useState(null);
  const [deviceRisk, setDeviceRisk] = useState({ score: 0, level: 'LOW' });

  // Notification Toast system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Passive Biometric Trackers
  useEffect(() => {
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (lastMousePos) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        const dt = (now - lastMouseTime) / 1000 || 0.001;
        const v = Math.sqrt(dx * dx + dy * dy) / dt;
        setMouseVelocities(prev => {
          const next = [...prev, v];
          if (next.length > 80) next.shift();
          return next;
        });
      }
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setLastMouseTime(now);
    };

    const handleKeyDown = () => {
      const now = Date.now();
      if (lastKeystrokeTime > 0) {
        setKeystrokeTimes(prev => {
          const next = [...prev, now - lastKeystrokeTime];
          if (next.length > 50) next.shift();
          return next;
        });
      }
      setLastKeystrokeTime(now);
    };

    const handleClick = () => {
      setClicks(c => c + 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [lastMousePos, lastMouseTime, lastKeystrokeTime, clicks]);

  // Aggregate Biometrics every 200ms
  useEffect(() => {
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const stddev = (arr) => {
      if (arr.length < 2) return 0;
      const m = avg(arr);
      return Math.sqrt(arr.reduce((s, v) => s + (v - m) * (v - m), 0) / (arr.length - 1));
    };

    const timer = setInterval(() => {
      setCurrentBiometrics({
        mouseVelocityAvg: avg(mouseVelocities),
        mouseVelocityStdDev: stddev(mouseVelocities),
        typingCadenceAvg: avg(keystrokeTimes),
        typingCadenceStdDev: stddev(keystrokeTimes),
        clickCount: clicks,
        sessionDurationMs: Date.now() - sessionStart
      });
    }, 200);

    return () => clearInterval(timer);
  }, [mouseVelocities, keystrokeTimes, clicks, sessionStart]);

  // Generate Device Fingerprint once on load
  useEffect(() => {
    const fp = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pluginCount: navigator.plugins ? navigator.plugins.length : 0,
      touchSupport: 'ontouchstart' in window,
      webdriver: navigator.webdriver || false,
      cookieEnabled: navigator.cookieEnabled,
      cores: navigator.hardwareConcurrency || 0
    };
    
    const hash = btoa(JSON.stringify(fp)).substring(0, 32);
    const completeFp = { ...fp, hash };
    setDeviceFp(completeFp);

    let score = 0;
    if (fp.webdriver) score += 0.5;
    if (fp.pluginCount === 0) score += 0.2;
    if (fp.userAgent.toLowerCase().includes('headless')) score += 0.45;
    if (fp.userAgent.toLowerCase().includes('selenium')) score += 0.45;
    score = Math.min(score, 1.0);
    const level = score > 0.5 ? 'HIGH' : score > 0.2 ? 'MEDIUM' : 'LOW';
    setDeviceRisk({ score, level });
  }, []);

  // Fetch Initial Data
  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/transactions/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error("Error fetching metrics:", e);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (e) {
      console.error("Error fetching cases:", e);
    }
  };

  const fetchFraudRings = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/fraud-rings');
      if (response.ok) {
        const data = await response.json();
        setFraudRings(data);
      }
    } catch (e) {
      console.error("Error fetching fraud rings:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/audit');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Error fetching audit logs:", e);
    }
  };

  const fetchShadowMode = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/shadow-mode');
      if (response.ok) {
        const data = await response.json();
        setShadowModeEnabled(data.enabled);
      }
    } catch (e) {
      console.error("Error fetching shadow mode state:", e);
    }
  };

  // Connect to SSE Live Stream
  useEffect(() => {
    fetchMetrics();
    fetchShadowMode();

    const eventSource = new EventSource('http://localhost:8080/api/stream/transactions');
    
    eventSource.addEventListener('init', (e) => {
      try {
        const txs = JSON.parse(e.data);
        setTransactions(txs);
      } catch (err) {
        console.error("Failed to parse init SSE transactions:", err);
      }
    });

    eventSource.addEventListener('transaction', (e) => {
      try {
        const tx = JSON.parse(e.data);
        setTransactions(prev => {
          const idx = prev.findIndex(x => x.id === tx.id);
          if (idx > -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...tx };
            return next;
          }
          return [tx, ...prev];
        });
        
        // Trigger alerts or updates based on composite status
        if (tx.status === 'FRAUD') {
          showToast(`🚨 High-risk Transaction Blocked: TX-${10000 + tx.id} at ${tx.merchant} ($${tx.amount})`, 'err');
        } else if (tx.status === 'SUSPICIOUS') {
          showToast(`⚠️ Suspicious Transaction Flagged: TX-${10000 + tx.id} ($${tx.amount})`, 'warn');
        } else {
          showToast(`✅ Transaction Approved: TX-${10000 + tx.id} ($${tx.amount})`, 'ok');
        }

        // Refresh stats/cases
        fetchMetrics();
        fetchCases();
      } catch (err) {
        console.error("Failed to parse transaction update from SSE:", err);
      }
    });

    eventSource.onerror = () => {
      console.warn("SSE stream disconnected. Retrying connection...");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Fetch relevant tab data on active change
  useEffect(() => {
    if (activeTab === 'cases') fetchCases();
    if (activeTab === 'rings') {
      fetchFraudRings();
      fetchUsers();
    }
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'shadow') fetchShadowMode();
  }, [activeTab]);

  // Handle Case Resolution
  const handleResolveCase = async (resolution) => {
    if (!selectedCase) return;
    setLoadingAction(true);

    try {
      const response = await fetch(`http://localhost:8080/api/cases/${selectedCase.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolution,
          analyst: user?.username || 'ANALYST_SECURE',
          note: analystNote
        })
      });

      if (response.ok) {
        showToast(`Case resolved as ${resolution.replace('_', ' ')}`, 'ok');
        fetchCases();
        fetchMetrics();
        // Update selected case object locally to reflect change immediately
        setSelectedCase(prev => ({
          ...prev,
          caseStatus: resolution,
          resolvedBy: user?.username || 'ANALYST_SECURE',
          resolvedAt: new Date().toISOString(),
          caseNote: analystNote,
          status: resolution === 'FALSE_POSITIVE' ? 'APPROVED' : prev.status
        }));
        setAnalystNote('');
      } else {
        showToast("Failed to resolve case.", "err");
      }
    } catch (e) {
      showToast("Connection error while resolving case.", "err");
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Shadow Mode Toggle
  const handleToggleShadow = async () => {
    const nextVal = !shadowModeEnabled;
    try {
      const response = await fetch('http://localhost:8080/api/admin/shadow-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: nextVal })
      });

      if (response.ok) {
        setShadowModeEnabled(nextVal);
        showToast(`Shadow Mode turned ${nextVal ? 'ON' : 'OFF'}`, nextVal ? 'warn' : 'info');
      } else {
        showToast("Failed to adjust shadow mode.", "err");
      }
    } catch (e) {
      showToast("Connection error to admin API.", "err");
    }
  };

  // Handle Simulate form submit
  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      setSimError('Transaction amount is required');
      return;
    }

    setSimulating(true);
    setSimError('');
    setSimSuccess('');

    try {
      const response = await fetch('http://localhost:8080/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id || 1,
          amount: parseFloat(amount),
          merchant: merchant || 'Unknown Merchant',
          location: location || 'N/A',
          ipAddress: ipAddress,
          deviceFingerprint: deviceFp,
          biometricSignal: currentBiometrics
        })
      });

      if (response.ok) {
        setSimSuccess('Transaction ingested successfully. Kafka routing live composite scoring...');
        setAmount('');
        setMerchant('');
        setLocation('');
        // Reset local mouse/typing records to avoid stacking scores across simulators
        setMouseVelocities([]);
        setKeystrokeTimes([]);
        setClicks(0);
      } else {
        const txt = await response.text();
        setSimError(txt || 'Failed to ingest transaction');
      }
    } catch (err) {
      setSimError('Failed to communicate with ingestion-service backend');
    } finally {
      setSimulating(false);
    }
  };

  // Apply Search/Filters to Live stream
  const filteredTxs = transactions.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    const score = Math.round((t.fraudScore || 0) * 100);
    if (filterMinScore && score < parseInt(filterMinScore)) return false;
    if (filterMaxScore && score > parseInt(filterMaxScore)) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchId = `tx-${10000 + t.id}`.includes(q);
      const matchMerchant = (t.merchant || '').toLowerCase().includes(q);
      const matchLocation = (t.location || '').toLowerCase().includes(q);
      if (!matchId && !matchMerchant && !matchLocation) return false;
    }
    return true;
  });

  // UI status mapping helpers
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge-approved';
      case 'SUSPICIOUS': return 'badge-suspicious';
      case 'FRAUD': return 'badge-fraud';
      default: return 'badge-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={12} style={{ marginRight: '4px' }} />;
      case 'SUSPICIOUS': return <AlertCircle size={12} style={{ marginRight: '4px' }} />;
      case 'FRAUD': return <Flame size={12} style={{ marginRight: '4px' }} />;
      default: return <Clock size={12} style={{ marginRight: '4px', animation: 'pulse 1s infinite' }} />;
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(isNaN(num) ? 0 : num);
  };

  const timeAgo = (iso) => {
    if (!iso) return '—';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return `${Math.round(diff / 3600)}h ago`;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Toast Notification Container */}
      <div className="toast-wrap" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 1.2rem', gap: '0.6rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600', color: t.type === 'err' ? '#ef4444' : t.type === 'warn' ? '#f59e0b' : t.type === 'ok' ? '#10b981' : '#38bdf8', background: 'rgba(15, 23, 42, 0.95)', border: `1px solid ${t.type === 'err' ? 'rgba(239, 68, 68, 0.3)' : t.type === 'warn' ? 'rgba(245, 158, 11, 0.3)' : t.type === 'ok' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`, backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease' }}>
            {t.type === 'err' ? <Flame size={14} /> : t.type === 'warn' ? <AlertTriangle size={14} /> : t.type === 'ok' ? <CheckCircle size={14} /> : <Info size={14} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <Shield size={22} style={{ color: 'var(--gold)', filter: 'drop-shadow(0 0 6px var(--gold))' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(90deg, var(--gold), #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AETHER GUARDIAN
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--cyber-blue)', letterSpacing: '1px', fontWeight: 600, opacity: 0.8 }}>
              COMMAND CENTER · SYSTEMS ENGAGED
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--neon-green)', fontWeight: 'bold' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 8px var(--neon-green)', animation: 'pulse 2s ease infinite' }}></div>
            LIVE
          </div>
          <div style={{ padding: '0.35rem 0.85rem', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '8px', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>Operative:</span>
            <strong style={{ color: '#fff', marginLeft: '0.3rem' }}>{(user?.username || 'ANALYST').toUpperCase()}</strong>
          </div>
          <button 
            onClick={onLogout}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <LogOut size={13} /> Exit
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto', background: 'rgba(15,23,42,0.4)' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
          { id: 'transactions', label: 'Live Stream', icon: <Cpu size={14} /> },
          { id: 'cases', label: 'Case Management', icon: <ShieldAlert size={14} />, badge: cases.filter(c => c.caseStatus === 'OPEN').length },
          { id: 'rings', label: 'Fraud Rings', icon: <Share2 size={14} />, badge: fraudRings.length },
          { id: 'simulator', label: 'Simulator', icon: <Terminal size={14} /> },
          { id: 'shadow', label: 'Shadow Mode', icon: <Eye size={14} /> },
          { id: 'audit', label: 'Audit Log', icon: <FileText size={14} /> }
        ].map(t => (
          <div 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{ 
              padding: '0.5rem 1.1rem', 
              borderRadius: '8px', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              whiteSpace: 'nowrap', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem',
              color: activeTab === t.id ? 'var(--cyber-blue)' : '#64748b',
              background: activeTab === t.id ? 'rgba(56,189,248,0.1)' : 'transparent',
              border: activeTab === t.id ? '1px solid rgba(56,189,248,0.18)' : '1px solid transparent'
            }}
          >
            {t.icon}
            <span>{t.label}</span>
            {!!t.badge && (
              <span style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem', borderRadius: '10px', background: t.id === 'cases' ? 'var(--ruby-red)' : 'rgba(234,179,8,0.2)', color: '#fff', marginLeft: '0.2rem' }}>
                {t.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{ maxW: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
        
        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fade">
            {/* Grid 1: Stats Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Scored', value: transactions.length.toLocaleString(), color: 'var(--cyber-blue)', icon: <Activity size={24} />, border: 'linear-gradient(90deg, transparent, var(--cyber-blue), transparent)' },
                { label: 'Approved Cases', value: transactions.filter(t => t.status === 'APPROVED').length.toLocaleString(), color: 'var(--neon-green)', icon: <CheckCircle size={24} />, border: 'linear-gradient(90deg, transparent, var(--neon-green), transparent)' },
                { label: 'Suspicious Alerts', value: transactions.filter(t => t.status === 'SUSPICIOUS').length.toLocaleString(), color: 'var(--amber)', icon: <AlertCircle size={24} />, border: 'linear-gradient(90deg, transparent, var(--amber), transparent)' },
                { label: 'Fraud Blocked', value: transactions.filter(t => t.status === 'FRAUD').length.toLocaleString(), color: 'var(--ruby-red)', icon: <Flame size={24} />, border: 'linear-gradient(90deg, transparent, var(--ruby-red), transparent)' },
                { label: 'Protected Volume', value: formatCurrency(metrics.totalAmountProtected), color: 'var(--gold)', icon: <DollarSign size={24} />, border: 'linear-gradient(90deg, transparent, var(--gold), transparent)' },
                { label: 'System Trust Score', value: `${metrics.trustScore || 100}%`, color: 'var(--cyber-blue)', icon: <Percent size={24} />, border: 'linear-gradient(90deg, transparent, var(--cyber-blue), transparent)' }
              ].map((s, idx) => (
                <div key={idx} className="card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: s.border }} />
                  <div style={{ position: 'absolute', top: '10px', right: '12px', opacity: 0.05, color: s.color }}>{s.icon}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '0.35rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Grid 2: Configuration & Recent Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Node Health Config */}
              <div className="card" style={{ border: '1px solid rgba(56,189,248,0.12)', padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <Cpu size={18} style={{ color: 'var(--cyber-blue)' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyber-blue)' }}>Intelligence Layers</span>
                </div>
                <div style={{ display: 'flex', flexDir: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                  {[
                    { name: 'Base Rules Engine', status: 'ACTIVE', color: 'var(--neon-green)' },
                    { name: 'Velocity Analysis', status: 'ACTIVE', color: 'var(--neon-green)' },
                    { name: 'Behavioral Biometrics', status: 'ACTIVE', color: 'var(--neon-green)' },
                    { name: 'Device Intelligence', status: 'ACTIVE', color: 'var(--neon-green)' },
                    { name: 'GeoFencing / Impossible Travel', status: 'ACTIVE', color: 'var(--neon-green)' },
                    { name: 'Shadow Mode Engine', status: shadowModeEnabled ? 'ACTIVE (RUNNING)' : 'STANDBY (MONITORING)', color: shadowModeEnabled ? 'var(--gold)' : '#64748b' },
                    { name: 'Fraud Ring Detector', status: 'ACTIVE', color: 'var(--neon-green)' }
                  ].map((layer, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: '#cbd5e1' }}>{layer.name}</span>
                      <span style={{ color: layer.color, fontWeight: 700 }}>{layer.status}</span>
                    </div>
                  ))}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: '#64748b' }}>Data Repository</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>Neon Serverless PostgreSQL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                  <span style={{ color: '#64748b' }}>Kafka Pipeline</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>Upstash Cloud Broker</span>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="card" style={{ border: '1px solid rgba(185,28,28,0.12)', padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <Flame size={18} style={{ color: 'var(--ruby-red)' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ruby-red)' }}>Critical Live Threats</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {transactions.filter(t => t.status === 'FRAUD' || t.status === 'SUSPICIOUS').slice(0, 5).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                      <CheckCircle size={20} style={{ color: 'var(--neon-green)', marginBottom: '0.5rem', opacity: 0.6 }} />
                      <p style={{ fontSize: '0.8rem' }}>No critical threats detected. Systems secure.</p>
                    </div>
                  ) : (
                    transactions.filter(t => t.status === 'FRAUD' || t.status === 'SUSPICIOUS').slice(0, 5).map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => setSelectedCase(t)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.7rem', borderRadius: '8px', background: t.status === 'FRAUD' ? 'rgba(185,28,28,0.1)' : 'rgba(245,158,11,0.1)', cursor: 'pointer', border: `1px solid ${t.status === 'FRAUD' ? 'rgba(185,28,28,0.15)' : 'rgba(245,158,11,0.15)'}` }}
                      >
                        <Flame size={14} style={{ color: t.status === 'FRAUD' ? 'var(--ruby-red)' : 'var(--amber)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          TX-{10000 + t.id} · {t.merchant} · {formatCurrency(t.amount)}
                        </span>
                        <span className={`badge ${getStatusBadgeClass(t.status)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: t.status === 'FRAUD' ? 'rgba(185,28,28,0.15)' : 'rgba(245,158,11,0.15)', color: t.status === 'FRAUD' ? 'var(--ruby-red)' : 'var(--amber)', fontWeight: 'bold' }}>
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: LIVE STREAM */}
        {activeTab === 'transactions' && (
          <div className="animate-fade">
            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(2,6,23,0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Status:
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '0.35rem 0.75rem', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.78rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">All</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="SUSPICIOUS">SUSPICIOUS</option>
                  <option value="FRAUD">FRAUD</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Min Score:
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="0"
                  value={filterMinScore}
                  onChange={e => setFilterMinScore(e.target.value)}
                  style={{ padding: '0.35rem 0.5rem', width: '65px', fontSize: '0.78rem', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', margin: 0 }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Max Score:
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="100"
                  value={filterMaxScore}
                  onChange={e => setFilterMaxScore(e.target.value)}
                  style={{ padding: '0.35rem 0.5rem', width: '65px', fontSize: '0.78rem', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', margin: 0 }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, flex: 1 }}>
                Search:
                <input 
                  type="text" 
                  placeholder="Merchant or ID"
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', margin: 0, width: '100%', maxWidth: '240px' }}
                />
              </label>

              <button 
                onClick={() => { setFilterStatus(''); setFilterMinScore(''); setFilterMaxScore(''); setFilterSearch(''); }}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Clear Filters
              </button>
            </div>

            {/* Stream Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {filteredTxs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'gray', padding: '3.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={24} style={{ opacity: 0.5, animation: 'pulse 2s infinite' }} />
                  <p style={{ fontSize: '0.85rem' }}>No transactions match criteria. Go to the Simulator to ingest events.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', fontSize: '0.68rem', textAlign: 'left' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>TX ID</th>
                        <th>Merchant</th>
                        <th>Location</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Risk Score</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map(t => {
                        const score = Math.round((t.fraudScore || 0) * 100);
                        const scoreCol = t.status === 'FRAUD' ? 'var(--ruby-red)' : t.status === 'SUSPICIOUS' ? 'var(--amber)' : t.status === 'APPROVED' ? 'var(--neon-green)' : 'var(--cyber-blue)';
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => setSelectedCase(t)} className="table-row-hover">
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--cyber-blue)', fontWeight: 700, fontFamily: 'monospace' }}>TX-{10000 + t.id}</td>
                            <td style={{ fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.merchant}>{t.merchant}</td>
                            <td style={{ color: '#64748b' }}>{t.location || '—'}</td>
                            <td style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(t.amount)}</td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, background: t.status === 'FRAUD' ? 'rgba(185,28,28,0.1)' : t.status === 'SUSPICIOUS' ? 'rgba(245,158,11,0.1)' : t.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : 'rgba(56,189,248,0.1)', color: scoreCol, border: `1px solid ${scoreCol}25` }}>
                                {getStatusIcon(t.status)}
                                <span>{t.status}</span>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: scoreCol }}>{t.status === 'PENDING' ? '—' : `${score}%`}</td>
                            <td style={{ color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{timeAgo(t.createdAt)}</td>
                            <td>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedCase(t); }} 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)' }}
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: CASE MANAGEMENT */}
        {activeTab === 'cases' && (
          <div className="animate-fade">
            <div className="card" style={{ border: '1px solid rgba(56,189,248,0.12)', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: 'var(--cyber-blue)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyber-blue)' }}>Analyst Open Worklist</span>
                <span style={{ marginLeft: 'auto', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(56,189,248,0.1)', color: 'var(--cyber-blue)' }}>
                  {cases.filter(c => c.caseStatus === 'OPEN').length} Cases Pending
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>
                System-flagged events exceeding elevated composite parameters. Select review to check composite metrics and authorize.
              </p>

              {cases.filter(c => c.caseStatus === 'OPEN').length === 0 ? (
                <div style={{ textAlign: 'center', color: 'gray', padding: '3.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={28} style={{ color: 'var(--neon-green)', opacity: 0.6, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>No open cases pending analyst attention.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', fontSize: '0.68rem', textAlign: 'left' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>TX ID</th>
                        <th>Merchant</th>
                        <th>Amount</th>
                        <th>Live Score</th>
                        <th>Reason Flags</th>
                        <th>Status</th>
                        <th>Ingested</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.filter(c => c.caseStatus === 'OPEN').map(t => {
                        const score = Math.round((t.fraudScore || 0) * 100);
                        const reasonCount = t.reasonCodes ? t.reasonCodes.split('|').length - 1 : 0;
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--cyber-blue)', fontWeight: 700, fontFamily: 'monospace' }}>TX-{10000 + t.id}</td>
                            <td style={{ fontWeight: 500 }}>{t.merchant}</td>
                            <td style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(t.amount)}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: t.status === 'FRAUD' ? 'var(--ruby-red)' : 'var(--amber)' }}>{score}%</td>
                            <td style={{ color: '#64748b' }}>{reasonCount} reasons</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(t.status)}`} style={{ fontSize: '0.68rem' }}>
                                {t.status}
                              </span>
                            </td>
                            <td style={{ color: '#475569' }}>{timeAgo(t.createdAt)}</td>
                            <td>
                              <button 
                                onClick={() => setSelectedCase(t)}
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer', background: 'var(--cyber-blue)', color: 'var(--midnight)', border: 'none', fontWeight: 'bold' }}
                              >
                                Review Case
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: FRAUD RINGS */}
        {activeTab === 'rings' && (
          <div className="animate-fade">
            <div className="card" style={{ border: '1px solid rgba(185,28,28,0.12)', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <Share2 size={18} style={{ color: 'var(--ruby-red)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ruby-red)' }}>Fingerprint Ring Network Graph</span>
                <button 
                  onClick={() => { fetchFraudRings(); fetchUsers(); }}
                  style={{ marginLeft: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                >
                  <RefreshCw size={12} /> Sync Graph
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Displays account nodes sharing identical device hardware signatures. Connected red edges indicate possible coordinated fraud activities.
              </p>

              {/* RINGS NETWORK RENDER */}
              {fraudRings.length === 0 ? (
                <div style={{ textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(2,6,23,0.3)', padding: '4rem 1rem', color: 'gray' }}>
                  <Shield size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>All clear. No multi-identity hardware matches found in transaction history.</p>
                </div>
              ) : (
                <div>
                  {/* SVG GRAPH PLOT */}
                  <div style={{ width: '100%', height: '340px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', position: 'relative', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                      {/* Render Connection Edges */}
                      {(() => {
                        const connections = [];
                        const nodes = {};
                        
                        // Extract distinct users involved in rings
                        const ringUsers = [...new Set(fraudRings.flatMap(r => r.userIds))];
                        
                        // Map users to circular positions
                        const cx = 500 / 2; // Approximate center coordinates
                        const cy = 340 / 2;
                        const r = Math.min(cx, cy) * 0.75;
                        
                        ringUsers.forEach((uid, index) => {
                          const angle = (index / ringUsers.length) * 2 * Math.PI - Math.PI / 2;
                          nodes[uid] = {
                            x: 50 + (cx + r * Math.cos(angle)),
                            y: cy + r * Math.sin(angle)
                          };
                        });

                        // Draw lines for user matches
                        fraudRings.forEach(ring => {
                          const ids = ring.userIds;
                          for (let i = 0; i < ids.length; i++) {
                            for (let j = i + 1; j < ids.length; j++) {
                              const n1 = nodes[ids[i]];
                              const n2 = nodes[ids[j]];
                              if (n1 && n2) {
                                connections.push(
                                  <line 
                                    key={`${ring.deviceFingerprint}-${ids[i]}-${ids[j]}`}
                                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                                    stroke="rgba(239,68,68,0.55)"
                                    strokeWidth="1.5"
                                    strokeDasharray="4 3"
                                  />
                                );
                              }
                            }
                          }
                        });

                        return (
                          <>
                            {connections}
                            {/* Render User Node circles */}
                            {ringUsers.map(uid => {
                              const pos = nodes[uid];
                              const userObj = users.find(u => u.id === uid);
                              const uName = userObj ? userObj.username : `UID-${uid}`;
                              const isSuspended = userObj && userObj.status === 'SUSPENDED';
                              
                              if (!pos) return null;
                              return (
                                <g key={uid}>
                                  <circle 
                                    cx={pos.x} cy={pos.y} r="22" 
                                    fill={isSuspended ? 'rgba(185, 28, 28, 0.15)' : 'var(--navy)'} 
                                    stroke={isSuspended ? 'var(--ruby-red)' : 'var(--cyber-blue)'} 
                                    strokeWidth="2" 
                                  />
                                  <text 
                                    x={pos.x} y={pos.y + 4} 
                                    textAnchor="middle" 
                                    fill={isSuspended ? 'var(--ruby-red)' : 'var(--cyber-blue)'}
                                    fontSize="9px" 
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                  >
                                    {uName.substring(0, 4).toUpperCase()}
                                  </text>
                                  <text 
                                    x={pos.x} y={pos.y + 35} 
                                    textAnchor="middle" 
                                    fill={isSuspended ? '#ef4444' : '#94a3b8'} 
                                    fontSize="8px"
                                    fontWeight="bold"
                                  >
                                    {uName} {isSuspended ? '⛔' : ''}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Ring Summary cards list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {fraudRings.map((ring, idx) => (
                      <div key={idx} style={{ padding: '0.8rem 1rem', background: 'rgba(185, 28, 28, 0.06)', border: '1px solid rgba(185, 28, 28, 0.15)', borderRadius: '10px', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <strong style={{ color: 'var(--ruby-red)' }}>Fraud Ring detected (Risk Score: {Math.round(ring.riskScore * 100)}%)</strong>
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'var(--ruby-red)', color: '#fff', fontWeight: 'bold' }}>{ring.riskLevel}</span>
                        </div>
                        <div style={{ color: '#94a3b8' }}>
                          Device Signature: <span style={{ color: 'var(--cyber-blue)', fontFamily: 'monospace' }}>{ring.deviceFingerprint.substring(0, 16)}...</span>
                        </div>
                        <div style={{ color: '#94a3b8', marginTop: '0.3rem' }}>
                          Accounts Connected: {ring.userIds.map(uid => users.find(u => u.id === uid)?.username || `UID-${uid}`).join(', ')} (total {ring.userCount} users)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="animate-fade">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Simulator Input Form */}
              <div className="card" style={{ border: '1px solid rgba(234,179,8,0.15)', padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Terminal size={20} style={{ color: 'var(--gold)' }} />
                  <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 700 }}>Ingestion Simulator</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  Provide simulated criteria. The browser collects interactive mouse tracking signals, cadence timing, click event triggers, and duration metrics passively to feed biometrics parameters.
                </p>

                {simError && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--ruby-red)', background: 'rgba(185, 28, 28, 0.1)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.75rem', border: '1px solid rgba(185,28,28,0.15)' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>{simError}</span>
                  </div>
                )}

                {simSuccess && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--neon-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.75rem', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <CheckCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{simSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSimulateSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'gray', marginBottom: '0.25rem', fontWeight: '600' }}>Amount ($)</label>
                      <div style={{ position: 'relative' }}>
                        <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="2500.00"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          required
                          style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '6px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.85rem', margin: 0 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'gray', marginBottom: '0.25rem', fontWeight: '600' }}>Location (City)</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                        <input 
                          type="text" 
                          placeholder="London, UK"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '6px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.85rem', margin: 0 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'gray', marginBottom: '0.25rem', fontWeight: '600' }}>Merchant Name</label>
                    <div style={{ position: 'relative' }}>
                      <ShoppingBag size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                      <input 
                        type="text" 
                        placeholder="CryptoXchange-01"
                        value={merchant}
                        onChange={e => setMerchant(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '6px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.85rem', margin: 0 }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'gray', marginBottom: '0.25rem', fontWeight: '600' }}>IP Address</label>
                    <div style={{ position: 'relative' }}>
                      <Activity size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                      <input 
                        type="text" 
                        placeholder="192.168.1.45"
                        value={ipAddress}
                        onChange={e => setIpAddress(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '6px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.85rem', margin: 0 }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="btn-primary glow-hover"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--gold)', color: 'var(--midnight)', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                    disabled={simulating}
                  >
                    {simulating ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                    <span>{simulating ? 'Analyzing biometrics and routing...' : 'Ingest Transaction'}</span>
                  </button>
                </form>
              </div>

              {/* Passive Biometric Reader Visualizers */}
              <div className="card" style={{ border: '1px solid rgba(56,189,248,0.15)', padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  <Activity size={20} style={{ color: 'var(--cyber-blue)' }} />
                  <h3 style={{ color: 'var(--cyber-blue)', fontSize: '1.1rem', fontWeight: 700 }}>Biometric & Device Telemetry</h3>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-green)', marginLeft: 'auto', boxShadow: '0 0 5px var(--neon-green)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                      <span>Mouse Velocity</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>{Math.round(currentBiometrics.mouseVelocityAvg)} px/s</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--cyber-blue)', width: `${Math.min(100, currentBiometrics.mouseVelocityAvg / 30)}%`, transition: 'width 0.2s ease' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                      <span>Typing Cadence</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>{currentBiometrics.typingCadenceAvg > 0 ? `${Math.round(currentBiometrics.typingCadenceAvg)} ms/key` : '—'}</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--cyber-blue)', width: `${currentBiometrics.typingCadenceAvg > 0 ? Math.min(100, 100 - Math.min(100, currentBiometrics.typingCadenceAvg / 4)) : 0}%`, transition: 'width 0.2s ease' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', paddingBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <span>Click Signals Recorded</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>{currentBiometrics.clickCount} clicks</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', paddingBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <span>Session Timer</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>{currentBiometrics.sessionDurationMs.toLocaleString()} ms</span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem' }}>Local Hardware Signature Risk</span>
                    <span className={`badge ${deviceRisk.level === 'HIGH' ? 'badge-fraud' : deviceRisk.level === 'MEDIUM' ? 'badge-suspicious' : 'badge-approved'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      {deviceRisk.level}
                    </span>
                  </div>

                  {deviceFp && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>
                      Platform: {deviceFp.platform} · Resolution: {deviceFp.screenResolution} · Cores: {deviceFp.cores} <br />
                      timezone: {deviceFp.timezone} · Cookie: {deviceFp.cookieEnabled ? 'Enabled' : 'Disabled'} · Fingerprint Hash: <span style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>{deviceFp.hash.substring(0, 14)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: SHADOW MODE */}
        {activeTab === 'shadow' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ border: '1px solid rgba(168,85,247,0.18)', padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <Eye size={18} style={{ color: 'var(--purple)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--purple)' }}>Shadow Mode Testing</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                When active, all transactions undergo parallel evaluations by both the production composite model and a shadow testing model. Divergences in scoring classifications are automatically logged for compliance reviews.
              </p>

              <div 
                onClick={handleToggleShadow}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.2rem', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.18)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {/* Switch indicator */}
                <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: shadowModeEnabled ? 'var(--purple)' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
                  <div style={{ content: '""', position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', top: '3px', left: '3px', transform: shadowModeEnabled ? 'translateX(20px)' : 'none', transition: 'transform 0.25s' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: shadowModeEnabled ? 'var(--purple)' : '#e2e8f0' }}>Shadow Engine: {shadowModeEnabled ? 'ON' : 'OFF'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Click to toggle parallel alternative telemetry testing</div>
                </div>
              </div>
            </div>

            {/* Comparison Matrix */}
            <div className="card" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Cpu size={18} style={{ color: 'var(--cyber-blue)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Parallel Classification Metrics</span>
              </div>

              {transactions.filter(t => t.shadowScore !== null).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'gray' }}>
                  <EyeOff size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>No comparison data logged. Run transaction simulator with Shadow Mode enabled.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', fontSize: '0.68rem', textAlign: 'left' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>TX ID</th>
                        <th>Merchant</th>
                        <th>Live Model Score</th>
                        <th>Shadow Model Score</th>
                        <th>Telemetry Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.shadowScore !== null).map(t => {
                        const liveScore = Math.round((t.fraudScore || 0) * 100);
                        const shadowScore = Math.round((t.shadowScore || 0) * 100);
                        const diverged = Math.abs(liveScore - shadowScore) > 20 || (t.status === 'APPROVED' && t.shadowScore > 0.6) || (t.status === 'FRAUD' && t.shadowScore < 0.4);
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--cyber-blue)', fontWeight: 700, fontFamily: 'monospace' }}>TX-{10000 + t.id}</td>
                            <td>{t.merchant}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: t.status === 'FRAUD' ? 'var(--ruby-red)' : t.status === 'SUSPICIOUS' ? 'var(--amber)' : 'var(--neon-green)' }}>
                              {liveScore}% ({t.status})
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: shadowScore > 80 ? 'var(--ruby-red)' : shadowScore > 50 ? 'var(--amber)' : 'var(--neon-green)' }}>
                              {shadowScore}%
                            </td>
                            <td>
                              <span className={`badge ${diverged ? 'badge-suspicious' : 'badge-approved'}`} style={{ fontSize: '0.65rem' }}>
                                {diverged ? 'DIVERGED' : 'MATCH'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="animate-fade">
            <div className="card" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileText size={18} style={{ color: 'var(--cyber-blue)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyber-blue)' }}>Compliance Audit Log</span>
                <button 
                  onClick={fetchAuditLogs}
                  style={{ marginLeft: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}
                >
                  Sync Logs
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Permanent compliance logging database detailing critical automated block authorizations, user adjustments, and analyst resolutions.
              </p>

              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'gray' }}>
                  <FileText size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>No audit records found.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569', fontSize: '0.68rem', textAlign: 'left' }}>
                        <th style={{ padding: '0.85rem 1rem' }}>EVENT TYPE</th>
                        <th>User ID</th>
                        <th>Transaction</th>
                        <th>Authorizer</th>
                        <th>Log Details</th>
                        <th>Occurred</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice().reverse().map(a => {
                        const eventCls = a.eventType?.includes('BLOCK') ? 'badge-fraud' : a.eventType?.includes('SUCCESS') ? 'badge-approved' : 'badge-pending';
                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span className={`badge ${eventCls}`} style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>{a.eventType}</span>
                            </td>
                            <td style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{a.userId || '—'}</td>
                            <td style={{ color: 'var(--cyber-blue)', fontFamily: 'monospace', fontWeight: 600 }}>{a.transactionId ? `TX-${10000 + a.transactionId}` : '—'}</td>
                            <td style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{a.performedBy}</td>
                            <td style={{ color: '#94a3b8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.details}>{a.details}</td>
                            <td style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{timeAgo(a.occurredAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Case Review Detail Modal */}
      {selectedCase && (
        <div className="modal-overlay open" onClick={e => { if (e.target.className.includes('modal-overlay')) setSelectedCase(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal card glow-hover animate-fade" style={{ width: '100%', maxWidth: '680px', background: 'var(--midnight)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '20px', padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldAlert size={18} style={{ color: 'var(--cyber-blue)' }} />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Case Details:</span>
                <span style={{ color: 'var(--cyber-blue)', fontFamily: 'monospace', fontWeight: 700 }}>TX-{10000 + selectedCase.id}</span>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* Grid 1: Details */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Transaction Metadata</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 0.5rem', fontSize: '0.82rem', background: 'rgba(15,23,42,0.4)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ color: '#64748b' }}>Merchant:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedCase.merchant}</div>
                  <div style={{ color: '#64748b' }}>Amount:</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>{formatCurrency(selectedCase.amount)}</div>
                  <div style={{ color: '#64748b' }}>Ingest Location:</div>
                  <div>{selectedCase.location || '—'}</div>
                  <div style={{ color: '#64748b' }}>Device Hardware fingerprint:</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--cyber-blue)' }}>{selectedCase.deviceFingerprint ? selectedCase.deviceFingerprint.substring(0, 18) + '...' : '—'}</div>
                  <div style={{ color: '#64748b' }}>Case Status:</div>
                  <div style={{ fontWeight: 'bold' }}>{selectedCase.caseStatus || 'OPEN'}</div>
                  <div style={{ color: '#64748b' }}>Composite Risk Probability:</div>
                  <div style={{ fontWeight: 'bold', fontFamily: 'monospace', color: selectedCase.status === 'FRAUD' ? 'var(--ruby-red)' : selectedCase.status === 'SUSPICIOUS' ? 'var(--amber)' : 'var(--neon-green)' }}>
                    {Math.round((selectedCase.fraudScore || 0) * 100)}% ({selectedCase.status})
                  </div>
                  {selectedCase.shadowScore !== null && (
                    <>
                      <div style={{ color: '#64748b' }}>Shadow Engine Score:</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{Math.round(selectedCase.shadowScore * 100)}%</div>
                    </>
                  )}
                </div>
              </div>

              {/* Grid 2: Reason codes XAI */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Explainable AI (XAI) Reason Flags</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedCase.reasonCodes ? (
                    selectedCase.reasonCodes.split('|').map((reason, rIdx) => {
                      if (!reason) return null;
                      const isHigh = reason.includes('HIGH') || reason.includes('CRITICAL') || reason.includes('IMPOSSIBLE') || reason.includes('BLOCK');
                      const isMed = reason.includes('MEDIUM') || reason.includes('VELOCITY') || reason.includes('BIOMETRIC') || reason.includes('DEVICE');
                      const color = isHigh ? 'var(--ruby-red)' : isMed ? 'var(--amber)' : 'var(--cyber-blue)';
                      const bg = isHigh ? 'rgba(185,28,28,0.1)' : isMed ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.08)';
                      
                      return (
                        <div 
                          key={rIdx} 
                          style={{ 
                            padding: '0.35rem 0.7rem', 
                            borderRadius: '8px', 
                            fontSize: '0.72rem', 
                            fontFamily: 'monospace', 
                            lineHeight: 1.4,
                            background: bg,
                            color: isHigh ? '#fca5a5' : isMed ? '#fcd34d' : '#7dd3fc',
                            borderLeft: `3px solid ${color}`
                          }}
                        >
                          {reason}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>No explanation flags generated for this transaction.</div>
                  )}
                </div>
              </div>

              {/* Grid 3: Telemetry metrics */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Sensor Metrics</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem' }}>
                  {/* Biometrics */}
                  <div style={{ background: 'rgba(56,189,248,0.04)', padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.1)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--cyber-blue)', marginBottom: '0.4rem', fontWeight: 700 }}>Biometric Telemetry</div>
                    {/* Just render indicators since the raw biometricSignal might not be saved in database, we can check biometricScore */}
                    <div style={{ color: '#94a3b8' }}>Biometric Risk Score: {selectedCase.biometricScore !== null ? `${Math.round(selectedCase.biometricScore * 100)}%` : '—'}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>Tracks mouse vectors, keystroke micro-variances, and completion velocity.</div>
                  </div>
                  {/* Velocity */}
                  <div style={{ background: 'rgba(234,179,8,0.04)', padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(234,179,8,0.1)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gold)', marginBottom: '0.4rem', fontWeight: 700 }}>Velocity Engine</div>
                    <div style={{ color: '#94a3b8' }}>Transactions (60s): {selectedCase.velocityCount || 0}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>Monitors rolling transaction frequencies to block automated carding attacks.</div>
                  </div>
                </div>
              </div>

              {/* Analyst Notes input */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Analyst Clearance Notes</label>
                {selectedCase.caseStatus && selectedCase.caseStatus !== 'OPEN' ? (
                  <div style={{ padding: '0.7rem 0.9rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem' }}>Resolved by {selectedCase.resolvedBy} at {new Date(selectedCase.resolvedAt).toLocaleString()}:</div>
                    <div style={{ italic: 'true', color: '#cbd5e1' }}>{selectedCase.caseNote || 'No notes left by authorizer.'}</div>
                  </div>
                ) : (
                  <textarea 
                    rows="3"
                    placeholder="Enter analytical audit notes describing clearance..."
                    value={analystNote}
                    onChange={e => setAnalystNote(e.target.value)}
                    style={{ width: '100%', background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '0.82rem', padding: '0.7rem 0.9rem', resize: 'vertical', outline: 'none' }}
                  />
                )}
              </div>

            </div>

            {/* Modal Footer actions */}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.4)' }}>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Cancel
              </button>
              
              {selectedCase.caseStatus === 'OPEN' && (
                <>
                  <button 
                    onClick={() => handleResolveCase('FALSE_POSITIVE')}
                    disabled={loadingAction}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--neon-green)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--neon-green)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                  >
                    Clear Case (Legitimate)
                  </button>
                  <button 
                    onClick={() => handleResolveCase('CONFIRMED_FRAUD')}
                    disabled={loadingAction}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(185, 28, 28, 0.1)', color: 'var(--ruby-red)', border: '1px solid rgba(185, 28, 28, 0.2)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ruby-red)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)'}
                  >
                    Authorize Suspension (Confirm Fraud)
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Metrics;
