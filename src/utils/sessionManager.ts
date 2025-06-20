/**
 * Session timeout management utilities
 */

export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export class SessionManager {
  private lastActivity: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private onTimeout: () => void;
  private onWarning: () => void;

  constructor(onTimeout: () => void, onWarning: () => void) {
    this.lastActivity = Date.now();
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.resetTimer();
    this.setupActivityListeners();
  }

  private setupActivityListeners() {
    // List of events that should reset the timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
  }

  private resetTimer() {
    this.lastActivity = Date.now();
    
    // Clear existing timers
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }

    // Set warning timer
    this.warningId = setTimeout(() => {
      this.onWarning();
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set timeout timer
    this.timeoutId = setTimeout(() => {
      this.onTimeout();
    }, SESSION_TIMEOUT);
  }

  public extendSession() {
    this.resetTimer();
  }

  public destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }
  }

  public getTimeUntilTimeout(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, SESSION_TIMEOUT - elapsed);
  }
}