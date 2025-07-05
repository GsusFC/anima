import React, { useState, useEffect } from 'react';
import { logger, LogEntry, LogLevel } from '../utils/logger';
import { colors, spacing, typography, borderRadius } from '../design-system/tokens';
import { Button } from '../design-system/Button';
import { Select } from '../design-system/Select';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const levelColors = {
  [LogLevel.DEBUG]: colors.text.tertiary,
  [LogLevel.INFO]: colors.text.primary,
  [LogLevel.WARN]: colors.status.warning,
  [LogLevel.ERROR]: colors.status.error,
};

const levelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.DEBUG);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load logs
  const loadLogs = () => {
    const allLogs = logger.getStoredLogs();
    setLogs(allLogs);
  };

  // Auto-refresh logs
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    loadLogs();
    const interval = setInterval(loadLogs, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (log.level < filterLevel) return false;
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    return true;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(logs.map(log => log.category)))];
  const categoryOptions = categories.map(cat => ({
    value: cat,
    label: cat === 'all' ? 'All Categories' : cat
  }));

  const levelOptions = [
    { value: LogLevel.DEBUG.toString(), label: 'DEBUG' },
    { value: LogLevel.INFO.toString(), label: 'INFO' },
    { value: LogLevel.WARN.toString(), label: 'WARN' },
    { value: LogLevel.ERROR.toString(), label: 'ERROR' },
  ];

  const handleExportLogs = () => {
    const logText = logger.exportLogs();
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animagen-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    logger.clearStoredLogs();
    setLogs([]);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bg.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bg.primary,
          border: `1px solid ${colors.border.primary}`,
          borderRadius: borderRadius.lg,
          width: '90vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing.lg,
            borderBottom: `1px solid ${colors.border.primary}`,
            backgroundColor: colors.bg.secondary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3 style={{
            margin: 0,
            fontSize: typography.fontSize.lg,
            color: colors.text.primary
          }}>
            Plugin Logs ({filteredLogs.length} entries)
          </h3>
          
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: colors.accent.primary }}
              />
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Auto-refresh
              </span>
            </label>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: spacing.md,
            borderBottom: `1px solid ${colors.border.primary}`,
            display: 'flex',
            gap: spacing.md,
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <label style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              minWidth: '60px'
            }}>
              Level:
            </label>
            <Select
              value={filterLevel.toString()}
              onChange={(value) => setFilterLevel(parseInt(value) as LogLevel)}
              options={levelOptions}
              size="sm"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <label style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              minWidth: '70px'
            }}>
              Category:
            </label>
            <Select
              value={filterCategory}
              onChange={setFilterCategory}
              options={categoryOptions}
              size="sm"
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: spacing.xs }}>
            <Button variant="secondary" size="sm" onClick={loadLogs}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportLogs}>
              Export
            </Button>
            <Button variant="error" size="sm" onClick={handleClearLogs}>
              Clear
            </Button>
          </div>
        </div>

        {/* Log entries */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: spacing.md,
            fontFamily: 'monospace',
            fontSize: typography.fontSize.xs,
            lineHeight: '1.4'
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: colors.text.secondary,
              padding: spacing.xl
            }}>
              No logs match the current filters
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  marginBottom: spacing.xs,
                  padding: spacing.xs,
                  backgroundColor: log.level >= LogLevel.ERROR ? 'rgba(242, 72, 34, 0.1)' : 
                                   log.level >= LogLevel.WARN ? 'rgba(255, 203, 71, 0.1)' : 
                                   'transparent',
                  borderRadius: borderRadius.sm,
                  borderLeft: `3px solid ${levelColors[log.level]}`
                }}
              >
                <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'baseline' }}>
                  <span style={{ color: colors.text.tertiary, minWidth: '80px' }}>
                    {formatTime(log.timestamp)}
                  </span>
                  <span
                    style={{
                      color: levelColors[log.level],
                      fontWeight: 'bold',
                      minWidth: '50px'
                    }}
                  >
                    {levelNames[log.level]}
                  </span>
                  <span style={{ color: colors.accent.primary, minWidth: '80px' }}>
                    [{log.category}]
                  </span>
                  <span style={{ color: colors.text.primary, flex: 1 }}>
                    {log.message}
                  </span>
                </div>
                
                {log.data && (
                  <div style={{
                    marginTop: spacing.xs,
                    marginLeft: '220px',
                    color: colors.text.secondary,
                    fontSize: '10px'
                  }}>
                    Data: {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
                
                {log.error && (
                  <div style={{
                    marginTop: spacing.xs,
                    marginLeft: '220px',
                    color: colors.status.error,
                    fontSize: '10px'
                  }}>
                    Error: {log.error.message}
                    {log.error.stack && (
                      <pre style={{
                        marginTop: spacing.xs,
                        whiteSpace: 'pre-wrap',
                        fontSize: '9px'
                      }}>
                        {log.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
