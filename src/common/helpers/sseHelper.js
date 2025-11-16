import { SSE } from 'sse.js';

/**
 * Stream SSE using sse.js library with better control and POST support
 *
 * @param {string} url - Full URL to SSE endpoint
 * @param {object} options - Configuration options
 * @param {string} options.method - HTTP method (GET/POST), default: POST
 * @param {object} options.body - Request body for POST
 * @param {object} options.headers - Custom headers
 * @param {object} options.eventHandlers - Map of event types to handlers {eventType: (data, id) => {}}
 * @param {function} options.onComplete - Called when stream completes normally
 * @param {function} options.onError - Called on connection errors
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @param {boolean} options.autoReconnect - Enable auto-reconnection, default: false
 * @param {number} options.reconnectDelay - Delay between reconnection attempts in ms, default: 3000
 * @param {number} options.maxRetries - Max reconnection attempts (null = unlimited), default: 3
 * @param {boolean} options.useLastEventId - Send Last-Event-ID header on reconnect, default: false
 * @returns {SSE} - SSE instance for manual control
 *
 * @example
 * const source = streamSse('http://api.example.com/stream', {
 *   method: 'POST',
 *   body: { query: 'Hello' },
 *   headers: { 'Authorization': 'Bearer token' },
 *   eventHandlers: {
 *     status: (data) => console.log('Status:', data.message),
 *     messages: (data) => console.log('Message:', data),
 *     error: (data) => console.error('Error:', data)
 *   },
 *   onComplete: () => console.log('Stream complete'),
 *   onError: (err) => console.error('Connection error:', err),
 *   signal: abortController.signal
 * });
 */
export function streamSse(url, {
  method = 'POST',
  body = null,
  headers = {},
  eventHandlers = {},
  onComplete = null,
  onError = null,
  signal = null,
  autoReconnect = false,
  reconnectDelay = 3000,
  maxRetries = 3,
  useLastEventId = false
} = {}) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    payload: body ? JSON.stringify(body) : undefined,
    method,
    start: false, // Don't auto-start, we'll call stream() manually
    autoReconnect,
    reconnectDelay,
    maxRetries,
    useLastEventId
  };

  const source = new SSE(url, options);

  // Register event handlers for each event type
  Object.entries(eventHandlers).forEach(([eventType, handler]) => {
    source.addEventListener(eventType, (e) => {
      try {
        // Try to parse JSON data
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        handler(data, e.id);
      } catch (err) {
        // If parsing fails, pass raw data
        console.warn(`Failed to parse ${eventType} event data as JSON:`, err);
        handler(e.data, e.id);
      }
    });
  });

  // Handle connection open
  source.addEventListener('open', (e) => {
    console.log('[SSE] Connection opened:', {
      status: e.responseCode,
      headers: e.headers
    });
  });

  // Handle errors
  source.addEventListener('error', (e) => {
    console.error('[SSE] Error:', {
      responseCode: e.responseCode,
      data: e.data,
      retryCount: source.retryCount,
      maxRetries: source.maxRetries
    });

    if (onError) {
      const error = new Error(e.data || 'SSE connection error');
      error.status = e.responseCode;
      error.responseText = e.data;
      onError(error);
    }
  });

  // Handle abort signal
  if (signal) {
    signal.addEventListener('abort', () => {
      console.log('[SSE] Abort signal received, closing connection');
      source.close();
    });
  }

  // Handle readyState changes for completion detection
  source.addEventListener('readystatechange', () => {
    console.log('[SSE] Ready state changed:', source.readyState);

    // When connection closes normally and onComplete is provided
    if (source.readyState === SSE.CLOSED && onComplete && !source._errorOccurred) {
      onComplete();
    }
  });

  // Track if error occurred to prevent double-calling onComplete
  source._errorOccurred = false;
  const originalErrorListener = source.addEventListener.bind(source);
  source.addEventListener('error', () => {
    source._errorOccurred = true;
  });

  // Start streaming
  console.log('[SSE] Starting stream to:', url);
  source.stream();

  return source; // Return source for manual control if needed
}
