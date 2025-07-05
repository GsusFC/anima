/**
 * Advanced logging system for the Figma plugin
 */

import { pluginStorage } from './storage';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  sessionId?: string;
}

const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 100,
};

class Logger {
  private config: LoggerConfig;
  private storageKey = 'animagen-plugin-logs';

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    return `[${timestamp}] ${levelNames[entry.level]} [${entry.category}] ${entry.message}`;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
      sessionId: this.config.sessionId,
    };
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formattedMessage = this.formatMessage(entry);
    const consoleData = [formattedMessage];
    
    if (entry.data) {
      consoleData.push('\nData:', entry.data);
    }
    
    if (entry.error) {
      consoleData.push('\nError:', entry.error instanceof Error ? entry.error.message : String(entry.error));
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...consoleData);
        break;
      case LogLevel.INFO:
        console.info(...consoleData);
        break;
      case LogLevel.WARN:
        console.warn(...consoleData);
        break;
      case LogLevel.ERROR:
        console.error(...consoleData);
        break;
    }
  }

  private writeToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage) return;

    try {
      const existing = this.getStoredLogs();
      const newLogs = [...existing, entry];

      // Maintain max entries limit
      if (newLogs.length > this.config.maxStorageEntries) {
        newLogs.splice(0, newLogs.length - this.config.maxStorageEntries);
      }

      pluginStorage.setItem(this.storageKey, JSON.stringify(newLogs));
    } catch (error) {
      // Fallback to console if storage fails
      console.warn('Failed to write to plugin storage:', error);
    }
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, category, message, data, error);
    
    this.writeToConsole(entry);
    this.writeToStorage(entry);
  }

  // Public logging methods
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data, error);
  }

  // Utility methods
  getStoredLogs(): LogEntry[] {
    try {
      const stored = pluginStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredLogs(): void {
    try {
      pluginStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear stored logs:', error);
    }
  }

  exportLogs(): string {
    const logs = this.getStoredLogs();
    return logs.map(entry => this.formatMessage(entry)).join('\n');
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  // Performance tracking
  time(label: string): void {
    this.debug('Performance', `Timer started: ${label}`);
    console.time(label);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
    this.debug('Performance', `Timer ended: ${label}`);
  }

  // API call logging
  logAPICall(method: string, url: string, status?: number, duration?: number): void {
    const message = `${method} ${url}`;
    const data = { status, duration: duration ? `${duration}ms` : undefined };
    
    if (status && status >= 400) {
      this.error('API', `${message} - Error ${status}`, undefined, data);
    } else {
      this.info('API', message, data);
    }
  }

  // User action logging
  logUserAction(action: string, details?: any): void {
    this.info('User', action, details);
  }

  // Component lifecycle logging
  logComponentMount(componentName: string, props?: any): void {
    this.debug('Component', `${componentName} mounted`, props);
  }

  logComponentUnmount(componentName: string): void {
    this.debug('Component', `${componentName} unmounted`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for custom loggers
export const createLogger = (config: Partial<LoggerConfig>) => new Logger(config);
