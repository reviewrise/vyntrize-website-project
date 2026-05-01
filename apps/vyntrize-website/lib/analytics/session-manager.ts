// Session management for analytics

import { SessionData } from './types';
import { generateSessionId } from './utils';

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly STORAGE_KEY = 'vyntrize_session';
  
  private sessionId: string;
  private startedAt: number;
  private lastActivity: number;
  
  constructor() {
    const existing = this.loadSession();
    
    if (existing && this.isSessionValid(existing)) {
      this.sessionId = existing.sessionId;
      this.startedAt = existing.startedAt;
      this.lastActivity = Date.now();
      this.saveSession();
    } else {
      this.sessionId = generateSessionId();
      this.startedAt = Date.now();
      this.lastActivity = Date.now();
      this.saveSession();
    }
  }
  
  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
  
  /**
   * Update session activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
    this.saveSession();
  }
  
  /**
   * Check if session is still active
   */
  isActive(): boolean {
    const now = Date.now();
    return now - this.lastActivity < SessionManager.SESSION_TIMEOUT;
  }
  
  /**
   * Get session duration in seconds
   */
  getDuration(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }
  
  /**
   * End current session and start a new one
   */
  endSession(): void {
    this.sessionId = generateSessionId();
    this.startedAt = Date.now();
    this.lastActivity = Date.now();
    this.saveSession();
  }
  
  /**
   * Load session from storage
   */
  private loadSession(): SessionData | null {
    if (typeof sessionStorage === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem(SessionManager.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Save session to storage
   */
  private saveSession(): void {
    if (typeof sessionStorage === 'undefined') return;
    
    try {
      const data: SessionData = {
        sessionId: this.sessionId,
        startedAt: this.startedAt,
        lastActivity: this.lastActivity,
      };
      sessionStorage.setItem(SessionManager.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // SessionStorage not available or quota exceeded
    }
  }
  
  /**
   * Check if session is valid
   */
  private isSessionValid(session: SessionData): boolean {
    const now = Date.now();
    return now - session.lastActivity < SessionManager.SESSION_TIMEOUT;
  }
}
