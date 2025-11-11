import * as signalR from '@microsoft/signalr';
import { url } from 'boot/axios';

/**
 * SignalR service for real-time communication with the backend
 * Handles project notifications and messages from AI agents
 */
export class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.currentProjectId = null;
    this.messageHandlers = new Map();
  }

  /**
   * Connects to the SignalR hub with Firebase authentication
   * @param {Object} user - Firebase user object with getIdToken() method
   * @returns {Promise<void>}
   */
  async connect(user) {
    // Guest mode check - if no user, skip SignalR
    if (!user) {
      console.log('[SignalR] Guest mode detected - skipping SignalR connection');
      return;
    }

    if (this.isConnected) {
      console.log('[SignalR] Already connected');
      return;
    }

    try {
      const token = await user.getIdToken();

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(url + 'hubs/project', {
          accessTokenFactory: () => token,
          skipNegotiation: false
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Custom retry logic: exponential backoff
            if (retryContext.previousRetryCount < 5) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null; // Stop retrying after 5 attempts
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.connection.on('ProjectMessage', (message) => {
        this.handleProjectMessage(message);
      });

      this.connection.onreconnecting((error) => {
        console.log('[SignalR] Reconnecting...', error);
        this.isConnected = false;
      });

      this.connection.onreconnected((connectionId) => {
        console.log('[SignalR] Reconnected successfully. ConnectionId:', connectionId);
        this.isConnected = true;

        // Rejoin the project if we were in one
        if (this.currentProjectId) {
          this.joinProject(this.currentProjectId);
        }
      });

      this.connection.onclose((error) => {
        console.log('[SignalR] Connection closed', error);
        this.isConnected = false;
      });

      await this.connection.start();
      this.isConnected = true;
      console.log('[SignalR] Connected successfully');
    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnects from the SignalR hub
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.stop();
      this.isConnected = false;
      this.currentProjectId = null;
      console.log('[SignalR] Disconnected');
    } catch (error) {
      console.error('[SignalR] Disconnect failed:', error);
    }
  }

  /**
   * Joins a project group to receive notifications
   * @param {string} projectId - The project ID to join
   * @returns {Promise<void>}
   */
  async joinProject(projectId) {
    if (!this.connection || !this.isConnected) {
      console.warn('[SignalR] Cannot join project - not connected');
      return;
    }

    if (!projectId) {
      console.warn('[SignalR] Cannot join project - invalid projectId');
      return;
    }

    try {
      await this.connection.invoke('JoinProject', projectId);
      this.currentProjectId = projectId;
      console.log('[SignalR] Joined project:', projectId);
    } catch (error) {
      console.error('[SignalR] Failed to join project:', error);
      throw error;
    }
  }

  /**
   * Leaves a project group
   * @param {string} projectId - The project ID to leave
   * @returns {Promise<void>}
   */
  async leaveProject(projectId) {
    if (!this.connection || !this.isConnected) {
      return;
    }

    if (!projectId) {
      return;
    }

    try {
      await this.connection.invoke('LeaveProject', projectId);
      if (this.currentProjectId === projectId) {
        this.currentProjectId = null;
      }
      console.log('[SignalR] Left project:', projectId);
    } catch (error) {
      console.error('[SignalR] Failed to leave project:', error);
    }
  }

  /**
   * Registers a handler for a specific message type
   * @param {string} messageType - The type of message to handle (e.g., 'FileChanged', 'AgentStatus')
   * @param {Function} handler - The handler function to call when a message of this type is received
   */
  onMessage(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }

  /**
   * Removes a message handler
   * @param {string} messageType - The message type
   * @param {Function} handler - The handler to remove
   */
  offMessage(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      return;
    }
    const handlers = this.messageHandlers.get(messageType);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Internal handler for incoming project messages
   * @param {Object} message - The message object { type, payload, timestamp }
   * @private
   */
  handleProjectMessage(message) {
    console.log('[SignalR] Received message:', message);

    if (!message || !message.type) {
      console.warn('[SignalR] Received invalid message');
      return;
    }

    const handlers = this.messageHandlers.get(message.type);
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(message.payload, message.timestamp);
        } catch (error) {
          console.error(`[SignalR] Error in message handler for ${message.type}:`, error);
        }
      });
    } else {
      console.log(`[SignalR] No handlers registered for message type: ${message.type}`);
    }
  }

  /**
   * Checks if currently connected
   * @returns {boolean}
   */
  get connected() {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Export a singleton instance
export const signalRService = new SignalRService();
