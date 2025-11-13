import { api } from 'src/boot/axios';

/**
 * Streams Server-Sent Events (SSE) responses using standard SSE protocol
 *
 * Supports standard SSE fields:
 * - data: Event data (can be multi-line)
 * - event: Event type
 * - id: Event ID
 * - retry: Reconnection time
 * - Custom fields: Any field followed by colon
 *
 * @param {string} method - HTTP method (POST, GET, etc.)
 * @param {string} url - API endpoint URL
 * @param {object} request - Request body object
 * @param {object} params - Query parameters object
 * @param {function} dataCallback - Called with parsed data from each message
 * @param {function} eventCallback - Called with {event, data, id} for each message
 * @param {function} completeCallback - Called when stream completes
 * @param {function} errorCallback - Called on errors
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @param {object} eventHandlers - Optional map of event types to specific handlers {eventType: handler}
 *
 * @example
 * // Simple usage
 * await streamSseResponse(
 *   'POST',
 *   'api/aiagents/article_chat_agent/stream',
 *   { query: 'Hello' },
 *   null,
 *   (data) => console.log('Data:', data),
 *   (event) => console.log('Event:', event),
 *   () => console.log('Complete'),
 *   (error) => console.error('Error:', error),
 *   abortController.signal
 * );
 *
 * @example
 * // With event-specific handlers
 * await streamSseResponse(
 *   'POST',
 *   'api/aiagents/article_chat_agent/stream',
 *   { query: 'Hello' },
 *   null,
 *   null,
 *   null,
 *   () => console.log('Complete'),
 *   (error) => console.error('Error:', error),
 *   abortController.signal,
 *   {
 *     message_delta: (data) => content.value += data.content,
 *     message_done: (data) => tokens.value = data.stats?.tokens,
 *   }
 * );
 */
export async function streamSseResponse(
  method,
  url,
  request,
  params,
  dataCallback,
  eventCallback,
  completeCallback,
  errorCallback,
  signal,
  eventHandlers = {}
) {
  const queryParams = params ? new URLSearchParams(params).toString() : '';
  const fullUrl = `${api.defaults.baseURL}${url}${queryParams ? `?${queryParams}` : ''}`;

  /**
   * Parse a single SSE field line
   * @param {string} line - Line in format "field: value"
   * @returns {object|null} - {field, value} or null
   */
  function parseSseLine(line) {
    if (!line || line.startsWith(':')) {
      return null; // Empty line or comment
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      return null; // Invalid format
    }

    const field = line.substring(0, colonIndex);
    let value = line.substring(colonIndex + 1);

    // SSE spec: Remove single leading space if present
    if (value.startsWith(' ')) {
      value = value.substring(1);
    }

    return { field, value };
  }

  /**
   * Emit a complete SSE message
   * @param {string|null} event - Event type
   * @param {string[]} dataLines - Array of data lines
   * @param {string|null} id - Event ID
   */
  function emitMessage(event, dataLines, id) {
    if (dataLines.length === 0) {
      return; // No data to emit
    }

    // Join multi-line data with newlines
    const dataString = dataLines.join('\n');

    // Try to parse as JSON, fall back to string
    let parsedData;
    try {
      parsedData = JSON.parse(dataString);
    } catch {
      parsedData = dataString; // Keep as string if not JSON
    }

    const eventType = event || 'message';

    // Call event-specific handler if registered
    if (eventHandlers[eventType]) {
      eventHandlers[eventType](parsedData, id);
    }

    // Call general data callback
    if (dataCallback) {
      dataCallback(parsedData);
    }

    // Call general event callback
    if (eventCallback) {
      eventCallback({
        event: eventType,
        data: parsedData,
        id,
      });
    }
  }

  try {
    const fetchHeaders = {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    };

    if (api.defaults.headers.common && api.defaults.headers.common.Authorization) {
      fetchHeaders.Authorization = api.defaults.headers.common.Authorization;
      fetchHeaders.languageId = api.defaults.headers.common.languageId;
    }

    const response = await fetch(fullUrl, {
      method,
      headers: fetchHeaders,
      body: request ? JSON.stringify(request) : undefined,
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`HTTP error in SSE streaming. Status: ${response.status}. Details: ${errorText}`);
      error.status = response.status;
      error.responseText = errorText;
      throw error;
    }

    if (!response.body) {
      throw new Error('Response body is null.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let currentEvent = null;
    let currentData = [];
    let currentId = null;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        // Process any remaining message
        if (currentData.length > 0) {
          emitMessage(currentEvent, currentData, currentId);
        }

        buffer = '';
        if (completeCallback) {
          completeCallback();
        }
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line === '' || line === '\r') {
          // Empty line = message separator
          if (currentData.length > 0) {
            emitMessage(currentEvent, currentData, currentId);
            currentEvent = null;
            currentData = [];
            currentId = null;
          }
          continue;
        }

        const parsed = parseSseLine(line);
        if (!parsed) {
          continue;
        }

        const { field, value } = parsed;

        switch (field) {
          case 'data':
            currentData.push(value);
            break;
          case 'event':
            currentEvent = value;
            break;
          case 'id':
            currentId = value;
            break;
          case 'retry':
            // Could store for reconnection logic if needed
            break;
          default:
            // Custom fields - could be handled in the future
            break;
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return; // Silent abort - don't call error callback
    }

    if (errorCallback) {
      errorCallback(error);
    } else {
      throw new Error(`SSE streaming error: ${error}`);
    }
  }
}
