export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: any) => void;
}

const activeRequestsMap = new Map<string, Promise<any>>();

export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    backoffFactor = 2,
    timeoutMs = 30000,
    onRetry
  } = retryConfig;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        // Client errors (400, 401, 403, 404) should not retry blindly
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API Error ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }

      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      console.warn(`🔄 [RETRY] Attempt ${attempt}/${maxRetries} failed for ${url}. Retrying in ${delay}ms...`, error.message);
      await new Promise((res) => setTimeout(res, delay));
      delay *= backoffFactor;
    }
  }

  throw new Error('Maximum retry attempts exceeded');
}

export function deduplicatedFetch<T = any>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  if (activeRequestsMap.has(key)) {
    console.log(`⚡ [DEDUPLICATION] Reusing in-flight request for key: ${key}`);
    return activeRequestsMap.get(key) as Promise<T>;
  }

  const promise = fetchFn().finally(() => {
    activeRequestsMap.delete(key);
  });

  activeRequestsMap.set(key, promise);
  return promise;
}
