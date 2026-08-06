import { useState, useEffect } from 'react';
import { getLogs, clearLogs, getLogsByLevel } from '../utils/logger';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const LOG_COLORS = {
  error: '#ef4444',
  warn: '#f97316',
  log: '#9ca3af',
  info: '#3b82f6',
};

const LOG_BG = {
  error: 'rgba(239,68,68,0.1)',
  warn: 'rgba(249,115,22,0.1)',
  log: 'rgba(107,114,128,0.1)',
  info: 'rgba(59,130,246,0.1)',
};

export default function ConsolePanel() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loadingBackend, setLoadingBackend] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setLoadingBackend(true);
      try {
        // Try to fetch from backend first
        if (BACKEND_URL) {
          const token = localStorage.getItem('token');
          if (token) {
            const res = await fetch(`${BACKEND_URL}/api/logs?level=${filter === 'all' ? '' : filter}&limit=200`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const backendLogs = await res.json();
              const searched = search
                ? backendLogs.filter(l => l.message.toLowerCase().includes(search.toLowerCase()))
                : backendLogs;
              setLogs(searched);
              setLoadingBackend(false);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch logs from backend:', e);
      }

      // Fallback to in-memory logs
      setLoadingBackend(false);
      const allLogs = getLogs();
      const filtered = filter === 'all' ? allLogs : getLogsByLevel(filter);
      const searched = search
        ? filtered.filter(l => l.message.toLowerCase().includes(search.toLowerCase()))
        : filtered;
      setLogs(searched.reverse());
    };

    loadLogs();
    const interval = autoRefresh ? setInterval(loadLogs, 1000) : null;
    return () => interval && clearInterval(interval);
  }, [filter, search, autoRefresh]);

  const handleClear = async () => {
    if (window.confirm('Clear all logs? This cannot be undone.')) {
      try {
        if (BACKEND_URL) {
          const token = localStorage.getItem('token');
          if (token) {
            await fetch(`${BACKEND_URL}/api/logs`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
        }
      } catch (e) {
        console.error('Failed to clear logs:', e);
      }
      clearLogs();
      setLogs([]);
    }
  };

  const errorCount = getLogs().filter(l => l.level === 'error').length;
  const warnCount = getLogs().filter(l => l.level === 'warn').length;
  const totalCount = getLogs().length;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h3 style={s.title}>🖥️ Debug Console</h3>
        <button onClick={handleClear} style={s.clearBtn}>Clear</button>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.statBox}>
          <div style={s.statNum}>{totalCount}</div>
          <div style={s.statLabel}>Total Logs</div>
        </div>
        {errorCount > 0 && (
          <div style={{ ...s.statBox, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ ...s.statNum, color: '#ef4444' }}>{errorCount}</div>
            <div style={s.statLabel}>Errors</div>
          </div>
        )}
        {warnCount > 0 && (
          <div style={{ ...s.statBox, borderColor: 'rgba(249,115,22,0.3)' }}>
            <div style={{ ...s.statNum, color: '#f97316' }}>{warnCount}</div>
            <div style={s.statLabel}>Warnings</div>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div style={s.controls}>
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <div style={s.filters}>
          {['all', 'error', 'warn', 'info', 'log'].map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              style={{
                ...s.filterBtn,
                background: filter === level ? (LOG_COLORS[level] || '#6b7280') : 'rgba(255,255,255,0.05)',
                color: filter === level ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: filter === level ? '700' : '400',
              }}
            >
              {level}
            </button>
          ))}
        </div>
        <label style={s.autoRefreshLabel}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Auto-refresh
        </label>
      </div>

      {/* Logs */}
      <div style={s.logsList}>
        {logs.length === 0 ? (
          <div style={s.empty}>
            <span>✓ No logs yet</span>
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              style={{
                ...s.logEntry,
                background: LOG_BG[log.level] || 'rgba(107,114,128,0.05)',
                borderLeft: `3px solid ${LOG_COLORS[log.level] || '#6b7280'}`,
              }}
            >
              <div style={s.logTime}>{log.timestamp}</div>
              <div
                style={{
                  ...s.logBadge,
                  background: LOG_COLORS[log.level] || '#6b7280',
                }}
              >
                {log.level[0].toUpperCase()}
              </div>
              <div style={s.logMessage}>{log.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  container: {
    background: 'rgba(28,15,24,0.5)',
    border: '1px solid rgba(212,35,94,0.15)',
    borderRadius: '12px',
    padding: '1.2rem',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    color: 'white',
    margin: 0,
    fontSize: '1rem',
    fontWeight: '700',
  },
  clearBtn: {
    background: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '6px',
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  stats: {
    display: 'flex',
    gap: '0.8rem',
    marginBottom: '1rem',
  },
  statBox: {
    flex: 1,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '0.8rem',
    textAlign: 'center',
  },
  statNum: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '0.2rem',
  },
  controls: {
    marginBottom: '1rem',
    display: 'flex',
    gap: '0.8rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '0.6rem 0.8rem',
    color: 'white',
    fontSize: '0.85rem',
  },
  filters: {
    display: 'flex',
    gap: '0.4rem',
  },
  filterBtn: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  autoRefreshLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  logsList: {
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  empty: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    padding: '2rem 1rem',
    fontSize: '0.9rem',
  },
  logEntry: {
    padding: '0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    display: 'flex',
    gap: '0.8rem',
    alignItems: 'flex-start',
  },
  logTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.75rem',
    fontFamily: "'Courier New', monospace",
    minWidth: '80px',
  },
  logBadge: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '700',
    minWidth: '20px',
  },
  logMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "'Courier New', monospace",
    flex: 1,
    wordBreak: 'break-all',
  },
};
