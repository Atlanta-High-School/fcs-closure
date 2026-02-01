import { createHash } from 'crypto';

interface AutoRefreshConfig {
  checkInterval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

interface RefreshState {
  isMonitoring: boolean;
  lastCheck: Date | null;
  lastUpdate: Date | null;
  updateCount: number;
  errorCount: number;
  currentHash: string | null;
  previousHash: string | null;
}

class AutoRefreshMonitor {
  private config: AutoRefreshConfig;
  private state: RefreshState;
  private intervalId: NodeJS.Timeout | null = null;
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private callbacks: {
    onUpdate: (status: string, timestamp: Date) => void;
    onError: (error: Error) => void;
    onStatusChange: (isMonitoring: boolean) => void;
  };

  constructor(config: Partial<AutoRefreshConfig> = {}) {
    this.config = {
      checkInterval: 5 * 60 * 1000, // 5 minutes default
      maxRetries: 3,
      retryDelay: 30 * 1000, // 30 seconds
      ...config
    };

    this.state = {
      isMonitoring: false,
      lastCheck: null,
      lastUpdate: null,
      updateCount: 0,
      errorCount: 0,
      currentHash: null,
      previousHash: null
    };

    this.callbacks = {
      onUpdate: () => {},
      onError: () => {},
      onStatusChange: () => {}
    };

    // Load saved state from localStorage if available
    this.loadState();
  }

  private loadState(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fcs-weather-monitor-state');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state = {
            ...this.state,
            ...parsed,
            lastCheck: parsed.lastCheck ? new Date(parsed.lastCheck) : null,
            lastUpdate: parsed.lastUpdate ? new Date(parsed.lastUpdate) : null
          };
        }
      } catch (error) {
        console.warn('Failed to load saved monitor state:', error);
      }
    }
  }

  private saveState(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fcs-weather-monitor-state', JSON.stringify(this.state));
      } catch (error) {
        console.warn('Failed to save monitor state:', error);
      }
    }
  }

  private async fetchPageContent(): Promise<string> {
    const response = await fetch('/api/fcs-weather', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch weather status');
    }

    return data.status;
  }

  private generateHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private async performCheck(): Promise<void> {
    try {
      console.log('🔍 Auto-refresh: Checking for updates...');
      
      const status = await this.fetchPageContent();
      const newHash = this.generateHash(status);
      
      this.state.lastCheck = new Date();
      this.state.errorCount = 0;

      // Check if this is an update
      if (this.state.currentHash && this.state.currentHash !== newHash) {
        console.log('🚨 Auto-refresh: Update detected!');
        this.state.previousHash = this.state.currentHash;
        this.state.currentHash = newHash;
        this.state.lastUpdate = new Date();
        this.state.updateCount++;
        
        this.callbacks.onUpdate(status, this.state.lastUpdate);
      } else if (!this.state.currentHash) {
        // First time checking
        this.state.currentHash = newHash;
        console.log('📋 Auto-refresh: Initial status captured');
      } else {
        console.log('✅ Auto-refresh: No changes detected');
      }

      this.saveState();
      
    } catch (error) {
      this.state.errorCount++;
      console.error(`❌ Auto-refresh: Check failed (${this.state.errorCount}/${this.config.maxRetries}):`, error);
      
      this.callbacks.onError(error as Error);
      
      // Implement retry logic
      if (this.state.errorCount < this.config.maxRetries && this.state.isMonitoring) {
        console.log(`🔄 Auto-refresh: Retrying in ${this.config.retryDelay / 1000} seconds...`);
        this.retryTimeoutId = setTimeout(() => {
          this.performCheck();
        }, this.config.retryDelay);
      } else if (this.state.errorCount >= this.config.maxRetries) {
        console.error('💥 Auto-refresh: Max retries reached, stopping monitoring');
        this.stop();
      }
    }
  }

  // Public API
  public start(): void {
    if (this.state.isMonitoring) {
      console.log('Auto-refresh: Already monitoring');
      return;
    }

    console.log(`🚀 Auto-refresh: Starting monitoring (check interval: ${this.config.checkInterval / 1000}s)`);
    
    this.state.isMonitoring = true;
    this.callbacks.onStatusChange(true);
    this.saveState();

    // Perform initial check
    this.performCheck();

    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.config.checkInterval);
  }

  public stop(): void {
    if (!this.state.isMonitoring) {
      console.log('Auto-refresh: Not currently monitoring');
      return;
    }

    console.log('🛑 Auto-refresh: Stopping monitoring');
    
    this.state.isMonitoring = false;
    this.callbacks.onStatusChange(false);
    this.saveState();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  public forceCheck(): void {
    console.log('⚡ Auto-refresh: Forcing immediate check');
    this.performCheck();
  }

  public updateConfig(newConfig: Partial<AutoRefreshConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if it's currently running to apply new interval
    if (this.state.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  public getState(): RefreshState {
    return { ...this.state };
  }

  public getConfig(): AutoRefreshConfig {
    return { ...this.config };
  }

  // Event handlers
  public onUpdate(callback: (status: string, timestamp: Date) => void): void {
    this.callbacks.onUpdate = callback;
  }

  public onError(callback: (error: Error) => void): void {
    this.callbacks.onError = callback;
  }

  public onStatusChange(callback: (isMonitoring: boolean) => void): void {
    this.callbacks.onStatusChange = callback;
  }

  // Cleanup
  public destroy(): void {
    this.stop();
    this.callbacks = {
      onUpdate: () => {},
      onError: () => {},
      onStatusChange: () => {}
    };
  }
}

// Export singleton instance
export const autoRefreshMonitor = new AutoRefreshMonitor();

// Export class for testing or multiple instances
export { AutoRefreshMonitor };
