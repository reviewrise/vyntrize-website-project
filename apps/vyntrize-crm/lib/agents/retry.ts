// Retry utility with exponential backoff for agent operations

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: () => true,
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!config.retryableErrors(lastError)) {
        console.error('[Retry] Non-retryable error encountered', {
          attempt,
          error: lastError.message,
        });
        throw lastError;
      }

      // Don't wait after the last attempt
      if (attempt === config.maxAttempts) {
        console.error('[Retry] Max attempts reached', {
          maxAttempts: config.maxAttempts,
          error: lastError.message,
        });
        break;
      }

      // Log retry attempt
      console.warn('[Retry] Attempt failed, retrying...', {
        attempt,
        nextAttempt: attempt + 1,
        delayMs: delay,
        error: lastError.message,
      });

      // Wait before next attempt
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retryable error checker for specific error types
 */
export function createRetryableChecker(
  retryableErrorNames: string[]
): (error: Error) => boolean {
  return (error: Error) => {
    return retryableErrorNames.includes(error.name);
  };
}

/**
 * Create a retryable error checker for HTTP status codes
 */
export function createHttpRetryableChecker(
  retryableStatusCodes: number[]
): (error: Error & { statusCode?: number }) => boolean {
  return (error: Error & { statusCode?: number }) => {
    return error.statusCode !== undefined && retryableStatusCodes.includes(error.statusCode);
  };
}
