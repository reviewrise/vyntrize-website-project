// Error classes for agent system

export class AgentError extends Error {
  constructor(
    message: string,
    public agentType: string,
    public leadId?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // milliseconds
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public resetTime: number // timestamp
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}
