// Lightweight logger utility for diagnostics
// Provides structured logging with different levels and environment-aware output

import { env } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = env.mode === 'development';
  private isTest = env.mode === 'test';

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    
    return `${timestamp} ${entry.level.toUpperCase()}${context}: ${entry.message}${data}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In test mode, only log errors
    if (this.isTest) {
      return level === 'error';
    }
    
    // In development, log everything
    if (this.isDevelopment) {
      return true;
    }
    
    // In production, log warnings and errors only
    return level === 'warn' || level === 'error';
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      data,
    };

    const formattedMessage = this.formatMessage(entry);

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }

  // Convenience methods for common Firebase operations
  firebase(message: string, data?: unknown): void {
    this.info(message, 'Firebase', data);
  }

  auth(message: string, data?: unknown): void {
    this.info(message, 'Auth', data);
  }

  presence(message: string, data?: unknown): void {
    this.debug(message, 'Presence', data);
  }

  // Performance timing utility
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
