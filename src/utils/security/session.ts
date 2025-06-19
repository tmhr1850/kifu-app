// Session timeout management

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING = 5 * 60 * 1000; // 5 minutes before timeout
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

export class SessionManager {
  private lastActivity: number;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private activityCheckTimer: NodeJS.Timeout | null = null;
  private onTimeout: () => void;
  private onWarning: () => void;

  constructor(onTimeout: () => void, onWarning: () => void) {
    this.lastActivity = Date.now();
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.startTimers();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, () => this.updateActivity(), { passive: true });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });
  }

  private updateActivity() {
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  private startTimers() {
    this.resetTimers();
    
    // Check for inactivity periodically
    this.activityCheckTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      
      if (inactiveTime >= SESSION_TIMEOUT) {
        this.handleTimeout();
      } else if (inactiveTime >= SESSION_TIMEOUT - SESSION_WARNING) {
        this.handleWarning();
      }
    }, ACTIVITY_CHECK_INTERVAL);
  }

  private resetTimers() {
    // Clear existing timers
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Set new timers
    this.warningTimer = setTimeout(() => {
      this.handleWarning();
    }, SESSION_TIMEOUT - SESSION_WARNING);

    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, SESSION_TIMEOUT);
  }

  private handleWarning() {
    if (this.warningTimer) {
      this.onWarning();
      this.warningTimer = null;
    }
  }

  private handleTimeout() {
    this.destroy();
    this.onTimeout();
  }

  public extend() {
    this.updateActivity();
  }

  public destroy() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.activityCheckTimer) {
      clearInterval(this.activityCheckTimer);
      this.activityCheckTimer = null;
    }
  }

  public getRemainingTime(): number {
    const inactiveTime = Date.now() - this.lastActivity;
    return Math.max(0, SESSION_TIMEOUT - inactiveTime);
  }
}

// Hook for session management
export function useSessionTimeout(onTimeout: () => void, onWarning: () => void) {
  if (typeof window === 'undefined') return null;

  const manager = new SessionManager(onTimeout, onWarning);
  
  return {
    extend: () => manager.extend(),
    getRemainingTime: () => manager.getRemainingTime(),
    destroy: () => manager.destroy(),
  };
}