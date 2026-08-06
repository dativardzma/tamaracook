// Global logging system for website debugging
const logs = [];
const MAX_LOGS = 200;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

function sendLogToBackend(level, message) {
  if (!BACKEND_URL) return; // Skip if no backend URL

  try {
    fetch(`${BACKEND_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        source: 'web'
      }),
    }).catch(() => {}); // Silently fail if backend is down
  } catch {}
}

function addLog(level, ...args) {
  const timestamp = new Date().toLocaleTimeString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  const entry = {
    id: Date.now() + Math.random(),
    timestamp,
    level,
    message,
  };

  logs.push(entry);

  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Send to backend asynchronously
  sendLogToBackend(level, message);

  const originalMethod = {
    log: originalLog,
    error: originalError,
    warn: originalWarn,
    info: originalInfo,
  }[level] || originalLog;

  originalMethod(`[${level.toUpperCase()}] ${message}`);
}

// Override console methods
console.log = (...args) => addLog('log', ...args);
console.error = (...args) => addLog('error', ...args);
console.warn = (...args) => addLog('warn', ...args);
console.info = (...args) => addLog('info', ...args);

// Capture global errors
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error?.message || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Rejection:', event.reason?.message || event.reason);
});

export function getLogs() {
  return [...logs];
}

export function clearLogs() {
  logs.length = 0;
}

export function getLogsByLevel(level) {
  return logs.filter(log => log.level === level);
}
