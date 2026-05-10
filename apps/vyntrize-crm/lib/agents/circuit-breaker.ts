// Circuit Breaker pattern implementation for agent operations

export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // Number of failures before opening
  successThreshold?: number;      // Number of successes to close from half-open
  timeout?: number;               // Time in ms before attempting half-open
  monitoringPeriod?: number;      // Time window for failure counting (ms)
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  monitoringPeriod: 120000, // 2 minutes
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  private recentFailures: number[] = []; // Timestamps of recent failures
  private readonly options: Required<CircuitBreakerOptions>;
  private readonly name: string;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        const waitTime = this.nextAttemptTime - Date.now();
        throw new Error(
          `Circuit breaker "${this.name}" is OPEN. Service unavailable. Retry after ${Math.ceil(waitTime / 1000)}s`
        );
      }
      // Transition to half-open to test service
      this.transitionToHalfOpen();
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.recentFailures.push(now);

    // Remove old failures outside monitoring period
    this.recentFailures = this.recentFailures.filter(
      timestamp => now - timestamp < this.options.monitoringPeriod
    );

    this.failureCount = this.recentFailures.length;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionToOpen();
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    console.log(`[CircuitBreaker] "${this.name}" transitioning to CLOSED`);
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.recentFailures = [];
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    console.error(`[CircuitBreaker] "${this.name}" transitioning to OPEN`, {
      failureCount: this.failureCount,
      threshold: this.options.failureThreshold,
    });
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.timeout;
    this.successCount = 0;
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    console.log(`[CircuitBreaker] "${this.name}" transitioning to HALF_OPEN`);
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime,
      recentFailures: this.recentFailures.length,
    };
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   */
  reset(): void {
    console.log(`[CircuitBreaker] "${this.name}" manually reset to CLOSED`);
    this.transitionToClosed();
  }

  /**
   * Check if circuit is currently allowing requests
   */
  isAvailable(): boolean {
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      return true;
    }
    
    // Check if timeout has passed for OPEN state
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttemptTime) {
      return true;
    }
    
    return false;
  }
}
