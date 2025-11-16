import { defineStore } from 'pinia';
import { streamSse } from 'src/common/helpers/sseHelper';
import { useLayoutStore } from 'stores/layout-store';
import { usePromptStore } from 'stores/prompt-store';
import { useFileStore } from 'stores/file-store';
import { useCurrentUser } from 'vuefire';
import { api } from 'src/boot/axios';
import { getResolvedVariable } from 'src/common/helpers/variableHelper';

export const useDeepAgentStore = defineStore('deepAgent', {
  state: () => ({
    deepAgentChats: [],
    currentDeepAgentChat: 0,
    abortController: null,
    sseSource: null,
    currentStatusMessage: null,
  }),
  getters: {
    getCurrentChat: (state) => {
      if (state.currentDeepAgentChat >= 0 && state.currentDeepAgentChat < state.deepAgentChats.length) {
        return state.deepAgentChats[state.currentDeepAgentChat];
      }
      return null;
    },
    isStreaming: (state) => {
      const currentChat = state.deepAgentChats[state.currentDeepAgentChat];
      return currentChat ? currentChat.isWorking : false;
    },
    getStatusMessage: (state) => {
      if (state.currentStatusMessage) {
        return state.currentStatusMessage;
      }
      const currentChat = state.deepAgentChats[state.currentDeepAgentChat];
      if (currentChat && currentChat.isWorking) {
        return 'Starting...';
      }
      return '';
    }
  },
  actions: {
    openDeepAgent() {
      const layoutStore = useLayoutStore();
      layoutStore.currentChatAgentMode = 'deep-agent';
      layoutStore.currentRightMenuView = 'agentChat';
      layoutStore.notifyNewChat();
    },
    /**
     * Create a new Deep Agent chat session
     * @param {string} threadId - Thread ID for backend tracking
     * @returns {object} The newly created chat object
     */
    createDeepAgentChat(threadId) {
      const chatId = `deepagent-chat-${Date.now()}`;
      const newChat = {
        id: chatId,
        threadId: threadId,
        isWorking: false,
        messages: [],
        streamMetadata: {
          tokens: null,
          completionReason: null,
        },
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      console.log('[DeepAgent] Creating new chat:', newChat);

      this.deepAgentChats.push(newChat);
      this.currentDeepAgentChat = this.deepAgentChats.length - 1;

      return newChat;
    },

    /**
     * Stream a query to the Deep Agent
     * @param {string} chatId - The ID of the chat to stream to
     * @param {string} userQuery - The user's query/prompt
     * @param {string} projectId - The project ID
     * @throws {Error} If chat not found or already streaming
     */
    async streamDeepAgent(chatId, userQuery, projectId) {
      const currentChat = this.deepAgentChats.find(chat => chat.id === chatId);

      if (!currentChat) {
        const error = `Chat with ID ${chatId} not found`;
        console.error('[DeepAgent] Error:', error);
        throw new Error(error);
      }

      if (currentChat.isWorking) {
        const error = 'Stream already in progress for this chat';
        console.error('[DeepAgent] Error:', error);
        throw new Error(error);
      }

      const threadId = currentChat.threadId;

      // Get authorization token from Firebase user
      const user = useCurrentUser();
      if (!user.value) {
        const error = 'User not authenticated. Please log in.';
        console.error('[DeepAgent] Error:', error);
        throw new Error(error);
      }

      try {
        const idToken = await user.value.getIdToken();
        console.log('[DeepAgent] Authorization token obtained');

        // Set authorization header for SSE streaming
        api.defaults.headers.common.Authorization = idToken;

        console.log('[DeepAgent] Starting stream:', {
          userQuery,
          projectId,
          threadId,
          chatId: currentChat.id,
        });

        // Create abort controller for cancellation support
        this.abortController = new AbortController();

        // Reset stream state
        currentChat.isWorking = true;
        currentChat.streamMetadata = {
          tokens: null,
          completionReason: null,
        };
        currentChat.lastActivity = Date.now();

        // Add user message
        const userMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content: userQuery,
          isStreaming: false,
          timestamp: Date.now(),
          metadata: {}
        };
        currentChat.messages.push(userMessage);
        console.log('[DeepAgent] Added user message:', userMessage);

        // Retrieve writing style from project variables
        const fileStore = useFileStore();
        const writingStyle = getResolvedVariable('WritingStyle', fileStore.variables) || '';
        console.log('[DeepAgent] Retrieved writing style:', writingStyle);

        // Build context info with currently opened file
        let contextInfo = '';
        if (fileStore.selectedFile) {
          const fileNameWithPath = fileStore.getFileNameAndFileNameWithPath(fileStore.selectedFile);
          contextInfo = `User has currently opened this file: ${fileNameWithPath}`;
        }
        console.log('[DeepAgent] Context info:', contextInfo);

        // Build full URL for SSE endpoint
        const fullUrl = `${api.defaults.baseURL}deepagent/inscriptor_agent/stream`;

        // Start SSE streaming with event-specific handlers
        this.sseSource = streamSse(fullUrl, {
          method: 'POST',
          body: {
            query: userQuery,
            project_id: projectId,
            thread_id: threadId,
            writing_style: writingStyle,
            context_info: contextInfo,
          },
          headers: {
            'Authorization': idToken,
            'languageId': api.defaults.headers.common.languageId || 'en'
          },
          eventHandlers: {
            // Handle status events (Synchronizing, Agent runs, etc.)
            status: (data) => {
              this.currentStatusMessage = data.message;
              console.log('[DeepAgent] Status update:', data.message);
            },

            // Handle stats messages (credit costs)
            stats: (data) => {
              if (!currentChat.streamMetadata.creditCost) {
                currentChat.streamMetadata.creditCost = {
                  inputTokens: 0,
                  outputTokens: 0
                };
              }

              currentChat.streamMetadata.creditCost.inputTokens += data.inputTokens;
              currentChat.streamMetadata.creditCost.outputTokens += data.outputTokens;

              console.log('[DeepAgent] Credit stats received:', {
                inputTokens: data.inputTokens,
                outputTokens: data.outputTokens,
                total: data.inputTokens + data.outputTokens
              });
            },

            // Handle message tokens from LangChain streaming
            messages: (data) => {
              const token = data.token;

              if (token && token.type === 'AIMessageChunk') {
                // Find message by token.id (all chunks for same message have same id)
                let streamingMessage = currentChat.messages.find(
                  msg => msg.id === token.id
                );

                if (!streamingMessage) {
                  // Create new assistant message with token.id
                  streamingMessage = {
                    id: token.id,
                    role: 'assistant',
                    content: '',
                    isStreaming: true,
                    timestamp: Date.now(),
                    metadata: {
                      model_name: token.response_metadata?.model_name,
                      model_provider: token.response_metadata?.model_provider,
                      ls_provider: data.metadata?.ls_provider,
                      ls_model_name: data.metadata?.ls_model_name,
                      langgraph_node: data.metadata?.langgraph_node
                    }
                  };
                  currentChat.messages.push(streamingMessage);
                  console.log('[DeepAgent] Created new assistant message:', {
                    id: streamingMessage.id,
                    model: streamingMessage.metadata.model_name
                  });
                }

                // Extract text content from content blocks array
                if (Array.isArray(token.content) && token.content.length > 0) {
                  for (const block of token.content) {
                    if (typeof block === 'string') {
                      // Simple string content
                      streamingMessage.content += block;
                      console.log('[DeepAgent] Appended text chunk:', block.substring(0, 50) + '...');
                    } else if (block.type === 'text' && block.text) {
                      // Standard text content block
                      streamingMessage.content += block.text;
                      console.log('[DeepAgent] Appended text block:', block.text.substring(0, 50) + '...');
                    } else if (block.type === 'thinking' && block.thinking) {
                      // Thinking/reasoning block (Claude extended thinking)
                      console.log('[DeepAgent] Received thinking block (not displayed):', block.thinking.substring(0, 50) + '...');
                      // Optionally store thinking in metadata for debugging
                      if (!streamingMessage.metadata.thinking) {
                        streamingMessage.metadata.thinking = '';
                      }
                      streamingMessage.metadata.thinking += block.thinking;
                    }
                  }
                }

                // Handle tool call chunks - merge by index instead of overriding
                if (token.tool_call_chunks && token.tool_call_chunks.length > 0) {
                  // Initialize tool_calls array if not exists
                  if (!streamingMessage.metadata.tool_calls) {
                    streamingMessage.metadata.tool_calls = [];
                  }

                  // Merge each tool call chunk by index
                  for (const incomingChunk of token.tool_call_chunks) {
                    const index = incomingChunk.index ?? streamingMessage.metadata.tool_calls.length;
                    const existingTool = streamingMessage.metadata.tool_calls[index];

                    if (existingTool) {
                      // Merge properties
                      const mergedTool = {
                        ...existingTool,
                        name: incomingChunk.name || existingTool.name,
                        id: incomingChunk.id || existingTool.id
                      };

                      // Handle args concatenation (args streamed as JSON string chunks)
                      const argsChunk = incomingChunk.args;
                      if (argsChunk && typeof argsChunk === 'string') {
                        // Concatenate JSON string chunks
                        const existingArgsStr = existingTool.argsString || '';
                        mergedTool.argsString = existingArgsStr + argsChunk;

                        // Try to parse completed JSON
                        try {
                          mergedTool.args = JSON.parse(mergedTool.argsString);
                          console.log(`[DeepAgent] Successfully parsed args for tool ${mergedTool.name}:`, mergedTool.args);
                        } catch (e) {
                          // JSON not complete yet, keep accumulating
                          mergedTool.args = null;
                        }
                      }

                      streamingMessage.metadata.tool_calls[index] = mergedTool;
                      console.log(`[DeepAgent] Merged tool call chunk at index ${index}:`, mergedTool);
                    } else {
                      // New tool call chunk
                      const newTool = { ...incomingChunk };
                      const argsChunk = incomingChunk.args;

                      if (argsChunk && typeof argsChunk === 'string') {
                        newTool.argsString = argsChunk;
                        try {
                          newTool.args = JSON.parse(argsChunk);
                        } catch (e) {
                          newTool.args = null;
                        }
                      }

                      streamingMessage.metadata.tool_calls[index] = newTool;
                      console.log(`[DeepAgent] Added new tool call chunk at index ${index}:`, newTool);
                    }
                  }

                  console.log('[DeepAgent] All tool calls:', streamingMessage.metadata.tool_calls);
                }

                // Update usage metadata if available
                if (token.usage_metadata) {
                  streamingMessage.metadata.usage = token.usage_metadata;
                  currentChat.streamMetadata.tokens = token.usage_metadata.total_tokens ||
                                                      token.usage_metadata.input_tokens + token.usage_metadata.output_tokens;
                }
              }

              // Update global metadata if available
              if (data.tokens) {
                currentChat.streamMetadata.tokens = data.tokens;
                console.log('[DeepAgent] Token count updated:', data.tokens);
              }
              if (data.finish_reason) {
                currentChat.streamMetadata.completionReason = data.finish_reason;
                console.log('[DeepAgent] Completion reason:', data.finish_reason);
              }

              currentChat.lastActivity = Date.now();
            },

            // Handle node state updates
            updates: (data) => {
              console.log('[DeepAgent] Node update received:', data);
              currentChat.lastActivity = Date.now();
            },

            // Handle completion signal
            complete: (data) => {
              console.log('[DeepAgent] Stream complete signal:', data);
              // Explicitly close SSE connection to prevent auto-reconnect on normal completion
              if (this.sseSource) {
                this.sseSource.close();
                this.sseSource = null;
              }
            },

            // Handle error events
            error: (data) => {
              console.error('[DeepAgent] Error event:', data);
              currentChat.streamMetadata.completionReason = 'error';

              const errorMessage = {
                id: `msg-${Date.now()}-error`,
                role: 'system',
                content: `Error: ${data.error || 'Unknown error occurred'}`,
                isStreaming: false,
                timestamp: Date.now(),
                metadata: {}
              };
              currentChat.messages.push(errorMessage);
              this.currentStatusMessage = 'Error occurred';
              console.log('[DeepAgent] Added error message to chat:', errorMessage);

              // Explicitly close SSE connection to prevent auto-reconnect on backend errors
              if (this.sseSource) {
                this.sseSource.close();
                this.sseSource = null;
              }
            }
          },
          // onComplete - called when stream ends normally
          onComplete: () => {
            console.log('[DeepAgent] Stream completed successfully');

            // Mark any streaming message as complete
            const streamingMessage = currentChat.messages.find(
              msg => msg.role === 'assistant' && msg.isStreaming
            );
            if (streamingMessage) {
              streamingMessage.isStreaming = false;
              console.log('[DeepAgent] Marked message as complete:', streamingMessage.id);
              console.log('[DeepAgent] Final content length:', streamingMessage.content.length);
            }

            console.log('[DeepAgent] Final metadata:', currentChat.streamMetadata);
            console.log('[DeepAgent] Total messages:', currentChat.messages.length);

            // Add to prompt history if we have credit stats
            if (currentChat.streamMetadata.creditCost) {
              const promptStore = usePromptStore();

              // Find the last user message (most recent query)
              const userMessage = [...currentChat.messages]
                .reverse()
                .find(msg => msg.role === 'user');

              const assistantMessage = currentChat.messages.find(
                msg => msg.role === 'assistant' && !msg.isStreaming
              );

              if (userMessage && assistantMessage) {
                promptStore.pushLastPrompt({
                  model: 'Deep Agent',
                  input: 'User message: ' + userMessage.content,
                  timeStamp: new Date(userMessage.timestamp).toISOString(),
                  pr: {
                    text: assistantMessage.content,
                    originalText: assistantMessage.content,
                    meta: null,
                    stats: currentChat.streamMetadata.creditCost,
                    waitingForResponse: false
                  }
                });

                console.log('[DeepAgent] Added to prompt history:', {
                  model: assistantMessage.metadata?.model_name || 'Deep Agent',
                  credits: currentChat.streamMetadata.creditCost.inputTokens + currentChat.streamMetadata.creditCost.outputTokens
                });
              }
            }

            currentChat.isWorking = false;
            currentChat.lastActivity = Date.now();
            this.currentStatusMessage = null;
            this.abortController = null;
            this.sseSource = null;
          },
          // onError - called on connection errors
          onError: (error) => {
            // Ignore "normal closure" errors (happens when we explicitly close the connection)
            // These have status 0 or undefined with empty/SSE error message
            if (!error.status || error.status === 0) {
              console.log('[DeepAgent] Connection closed normally (status 0)');
              return;
            }

            console.error('[DeepAgent] Stream error:', {
              message: error.message,
              status: error.status,
              responseText: error.responseText,
              stack: error.stack,
            });

            // Add error message to chat so user can see it
            const errorMessage = {
              id: `msg-${Date.now()}-error`,
              role: 'system',
              content: `Connection error: ${error.message}`,
              isStreaming: false,
              timestamp: Date.now(),
              metadata: {
                status: error.status,
                responseText: error.responseText
              }
            };
            currentChat.messages.push(errorMessage);

            // Update status indicator to show error
            this.currentStatusMessage = 'Connection error';

            console.log('[DeepAgent] Added error message to chat:', errorMessage);

            currentChat.isWorking = false;
            currentChat.streamMetadata.completionReason = 'error';
            currentChat.lastActivity = Date.now();
            this.abortController = null;
            this.sseSource = null;
          },
          // signal - abort signal for cancellation
          signal: this.abortController.signal,
          // Auto-reconnection support with Last-Event-ID
          useLastEventId: true,
          autoReconnect: true,
          reconnectDelay: 3000,  // 3 seconds between reconnection attempts
          maxRetries: 3           // Max 3 reconnection attempts
        });
      } catch (error) {
        console.error('[DeepAgent] Unexpected error during streaming:', error);
        currentChat.isWorking = false;
        currentChat.streamMetadata.completionReason = 'error';
        currentChat.lastActivity = Date.now();
        this.currentStatusMessage = null;
        this.abortController = null;
        throw error;
      }
    },

    /**
     * Cancel the current stream
     */
    cancelStream() {
      console.log('[DeepAgent] Cancelling stream');

      // Close SSE connection if using sse.js
      if (this.sseSource) {
        this.sseSource.close();
        this.sseSource = null;
      }

      // Abort fetch if using old method
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      const currentChat = this.getCurrentChat;
      if (currentChat) {
        currentChat.isWorking = false;
        currentChat.streamMetadata.completionReason = 'cancelled';
        currentChat.lastActivity = Date.now();
      }

      this.currentStatusMessage = null;
      console.log('[DeepAgent] Stream cancelled');
    },

    /**
     * Delete a chat by index
     * @param {number} chatIndex - Index of chat to delete
     */
    deleteChat(chatIndex) {
      if (chatIndex >= 0 && chatIndex < this.deepAgentChats.length) {
        const chat = this.deepAgentChats[chatIndex];
        console.log('[DeepAgent] Deleting chat:', chat.id);

        this.deepAgentChats.splice(chatIndex, 1);

        // Adjust current chat index if needed
        if (this.currentDeepAgentChat >= this.deepAgentChats.length) {
          this.currentDeepAgentChat = Math.max(0, this.deepAgentChats.length - 1);
        }
      }
    },

    /**
     * Set the active chat by index
     * @param {number} chatIndex - Index of chat to activate
     */
    setCurrentChat(chatIndex) {
      if (chatIndex >= 0 && chatIndex < this.deepAgentChats.length) {
        console.log('[DeepAgent] Switching to chat index:', chatIndex);
        this.currentDeepAgentChat = chatIndex;
      }
    },
  }
});
