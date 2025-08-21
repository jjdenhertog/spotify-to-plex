// Logger helper

import { LOG_LEVELS, LogLevel } from '../constants';

export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private level: LogLevel = LOG_LEVELS.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LOG_LEVELS);
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);

    return messageIndex <= currentIndex;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    this.logs.push(entry);
    
    // Console output
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}]`;
    const output = context ? `${prefix} ${message} ${JSON.stringify(context)}` : `${prefix} ${message}`;
    
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(output, error || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(output);
        break;
      case LOG_LEVELS.DEBUG:
      case LOG_LEVELS.VERBOSE:
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.WARN, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.INFO, message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.DEBUG, message, context);
  }

  verbose(message: string, context?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.VERBOSE, message, context);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) {
      return this.logs;
    }

    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();