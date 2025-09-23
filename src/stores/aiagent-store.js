import { defineStore } from 'pinia';
import {
  cloneRequest,
} from "src/common/helpers/promptHelper";
import {usePromptStore} from 'stores/prompt-store';
import {useEditorStore} from 'stores/editor-store';
import {useFileStore} from 'stores/file-store';
import { editorTextBetween} from 'src/common/utils/editorUtils';
import { markdownToHtml } from 'src/common/utils/textUtils';
import {currentFilePromptContext, createDynamicContext, allPromptContexts} from 'src/common/resources/promptContexts';
import { useFileSearch } from 'src/composables/useFileSearch';
import {Notify, useQuasar} from 'quasar';

export const useAiAgentStore = defineStore('ai-agent', {
  state: () => ({
    confirmationWidgetData: null,
    currentConfirmationPromise: null,

    projectAgent: null,
    projectAgentCurrentProcessingParagraphItem: null,
    projectAgentSkippedParagraphs: new Set(), // Track skipped paragraph text content
    projectAgentProcessing: false,
    projectAgentContext: [],
    projectAgentCurrentPromptRequest: null,

    projectAgentUserAborted: false, // Global flag to abort all streaming
    independentAgentChatHistory: [], // Persistent conversation messages for independent agents
    agentActionHistory: [],
    agentStatus: null,

    // Agent chat state for AgentChatTab
    agentChats: {
      chats: [],           // Array of chat sessions
      activeChat: null,    // Current active chat ID
      isAgentRunning: false // Flag to prevent multiple agent runs
    },
    agentChatCurrentRequest: null, // Current request with abort controller for agent chat

    // Batch approval state
    pendingToolBatch: null,      // Current tools awaiting approval
    selectedTools: [],           // Array of selected tool IDs for execution
    batchApprovalResolve: null   // Promise resolver for batch approval
  }),
  getters: {
    agentState: (state) => {
      if (state.currentConfirmationPromise) {
        return 'waiting_for_user';
      }
      if (state.projectAgentProcessing) {
        return 'processing';
      }
      if(state.agentChats && state.agentChats.isAgentRunning) {
        return 'processing';
      }
      return 'idle';
    },
    isAgentActive: (state) => state.projectAgentProcessing,
  },
  actions: {
    // Helper methods for action history and status
    addActionToHistory(action, details = {}) {
      const timestamp = new Date().toLocaleTimeString();
      this.agentActionHistory.push({
        timestamp,
        action,
        details,
        ...details
      });
    },
    updateAgentStatus(status) {
      this.agentStatus = status;
    },
    async openProjectAgent(agent) {
      const promptStore = usePromptStore();

      promptStore.promptContext = this.projectAgentContext ?? [ currentFilePromptContext ];
      promptStore.promptParametersValue = [];
      promptStore.promptParametersShown = true;
      const request = {
        prompt: promptStore.prompts.find(p => p.id === agent.promptId),
        text: '',
        clear: false,
        agent: agent,
        promptTimes: 1,
        isProjectAgent: true,
      };

      promptStore.currentPromptConfirmationRequest = request;
    },
    async confirmProjectAgent(request) {
      const editorStore = useEditorStore();
      const promptStore = usePromptStore();

      const editor = editorStore.editor;
      if (!editor) {
        this.clearProjectAgent();
        return;
      }

      const agent = request.agent;

      this.projectAgentContext = [...promptStore.promptContext];
      this.projectAgentProcessing = true;
      this.projectAgentCurrentPromptRequest = cloneRequest(request, true);
      this.projectAgentUserAborted = false;
      this.projectAgent = agent;

      this.agentActionHistory = [];
      this.agentStatus = null;

      editorStore.clearAllAgentDecorations();
      this.projectAgentSkippedParagraphs.clear();

      if (agent.isIndependent) {
        await this.processIndependentAgent(agent);
      } else {
        // Log project agent start
        this.addActionToHistory('🚀 Agent started', {
          type: 'start',
          agentName: agent.title,
          searchPrefix: agent.searchPrefix,
          mode: 'paragraph_based'
        });
        this.updateAgentStatus('Looking for paragraphs to process...');

        await this.processNextParagraph(agent);
      }
    },
    clearProjectAgent() {
      const editorStore = useEditorStore();
      if (this.projectAgentCurrentProcessingParagraphItem) {
        editorStore.removeAgentDecoration(this.projectAgentCurrentProcessingParagraphItem.from, this.projectAgentCurrentProcessingParagraphItem.to);
      }

      this.projectAgent = null;
      this.projectAgentProcessing = false;
      this.projectAgentUserAborted = false;
      this.projectAgentCurrentPromptRequest = null;
      this.projectAgentSkippedParagraphs.clear();
      this.projectAgentCurrentProcessingParagraphItem = null;
      this.independentAgentChatHistory = [];

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
      }

      editorStore.clearAllAgentDecorations();
      this.confirmationWidgetData = null;
    },
    async processNextParagraph(agent) {
      const nextItem = this.findNextParagraph(agent);
      if (!nextItem) {
        // Log completion
        this.addActionToHistory('✅ All paragraphs processed', {
          type: 'completed',
          reason: 'No more paragraphs found to process'
        });
        this.updateAgentStatus('Completed');

        this.clearProjectAgent();
        return;
      }

      // Log found paragraph
      this.addActionToHistory('📝 Found paragraph to process', {
        type: 'found_paragraph',
        paragraphId: nextItem.nodeId,
        instruction: nextItem.instruction.substring(0, 100) + (nextItem.instruction.length > 100 ? '...' : '')
      });
      this.updateAgentStatus(`Processing paragraph: ${nextItem.instruction.substring(0, 50)}...`);

      const result = await this.runAgentOnParagraph(agent, nextItem);

      if (result === 'stopped' || result === 'error' || !this.projectAgentProcessing) {
        return;
      }

      // Log continuation
      this.addActionToHistory('🔄 Looking for next paragraph', {
        type: 'continue'
      });
      this.updateAgentStatus('Looking for next paragraph...');

      await this.processNextParagraph(agent);
    },
    findNextParagraph(agent) {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return null;

      const doc = editor.state.doc;
      let nextItem = null;

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (nextItem) return false; // Stop if we found one

        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          if (text.trim().startsWith(agent.searchPrefix) && text.trim().length > agent.searchPrefix.length) {
            const instruction = text.trim().substring(agent.searchPrefix.length).trim();

            if (!this.projectAgentSkippedParagraphs.has(node.attrs.id) && instruction.length > 0) {
              nextItem = {
                node,
                pos,
                from,
                to,
                text: text.trim(),
                instruction,
                originalContent: text,
                nodeId: node.attrs.id
              };
            }
          }
        }
      });

      return nextItem;
    },
    manageParagraphDecoration(item, state) {
      const editorStore = useEditorStore();

      // Skip decoration for position markers since there's no paragraph to highlight
      if (item.nodeId === '__END__') {
        return;
      }

      switch (state) {
        case 'pending':
          editorStore.addAgentDecoration(item.from, item.to, 'pending');
          break;
        case 'processing':
          editorStore.updateAgentDecoration(item.from, item.to, 'processing');
          break;
        case 'streaming':
          editorStore.updateAgentDecoration(item.from, item.to, 'streaming');
          break;
        case 'awaiting_confirmation':
          editorStore.updateAgentDecoration(item.from, item.to, 'awaiting_confirmation');
          break;
        case 'remove':
          editorStore.removeAgentDecoration(item.from, item.to);
          break;
      }
    },
    shouldAbortStreaming() {
      return this.projectAgentUserAborted;
    },
    shouldIgnoreAgentResult(resultText, agent) {
      const cleanResultText = (resultText ?? '').trim().toLowerCase().replace(/^["']|["']$/g, '');
      const cleanIgnoreText = (agent.ignoreResultText ?? 'OK').trim().toLowerCase();
      return cleanResultText === cleanIgnoreText;
    },
    onWidgetAccept(data) {
      console.log('User accepted changes:', data);
      const editorStore = useEditorStore();

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      const { from, to } = data.paragraphRange;

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      this.manageParagraphDecoration({from, to}, 'remove');

      // Get operation type from widget data
      const operationType = this.confirmationWidgetData?.toolCallResult?.action || 'modify';
      const position = this.confirmationWidgetData?.toolCallResult?.position;

      // Execute different operations based on type
      if (operationType === 'remove') {
        // Remove the paragraph
        editorStore.editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.delete(from, to);
            return true;
          })
          .run();
      } else if (operationType === 'add') {
        // Handle special position markers
        const nodeId = this.confirmationWidgetData?.nodeId;
        let insertPos = position === 'before' ? from : to;

        // Convert markdown to HTML for proper formatting
        const htmlContent = markdownToHtml(data.aiSuggestion);
        editorStore.editor
          .chain()
          .focus()
          .insertContentAt(insertPos, htmlContent)
          .run();
      } else {
        // Default modify operation
        // Convert markdown to HTML for proper formatting
        const htmlContent = markdownToHtml(data.aiSuggestion);
        editorStore.editor
          .chain()
          .focus()
          .command(({ tr }) => {
            // Delete the existing content and insert the new HTML content
            tr.delete(from, to);
            return true;
          })
          .insertContentAt(from, htmlContent)
          .run();
      }

      if(this.projectAgentCurrentProcessingParagraphItem) {
        this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'remove');

        // Log user acceptance for project agent
        if (!this.confirmationWidgetData?.isIndependentAgent) {
          this.addActionToHistory('✅ User accepted change', {
            type: 'user_accept',
            paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId,
            operationType
          });
        }
      }

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('accepted');
        this.currentConfirmationPromise = null;
      }
    },
    onWidgetReject(data) {
      if(!this.confirmationWidgetData) {
        return;
      }

      const editorStore = useEditorStore();
      console.log('User skipped paragraph:', data);
      this.projectAgentSkippedParagraphs.add(data.nodeId);

      // Log user rejection for project agent
      if (!this.confirmationWidgetData?.isIndependentAgent) {
        this.addActionToHistory('❌ User skipped paragraph', {
          type: 'user_skip',
          paragraphId: data.nodeId
        });
      }

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      if(this.projectAgentCurrentProcessingParagraphItem) {
        this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'remove');
      }

      if (this.currentConfirmationPromise) {
        // For agent chat, pass the feedback along with the result
        if (this.confirmationWidgetData.isAgentChat && data.userFeedback) {
          this.currentConfirmationPromise.resolve({ result: 'skipped', feedback: data.userFeedback });
        } else {
          this.currentConfirmationPromise.resolve('skipped');
        }
        this.currentConfirmationPromise = null;
      }
    },
    onWidgetReplaceText(text) {
      if(!this.confirmationWidgetData) {
        return;
      }

      this.confirmationWidgetData.aiSuggestion = text.originalText;
    },
    async onWidgetChat(userFeedback) {
      if(!this.confirmationWidgetData) {
        return;
      }

      if(this.confirmationWidgetData.isIndependentAgent) {
        this.independentAgentChatHistory.push({
          type: 'user',
          text: userFeedback
        });

        // Log user feedback
        this.addActionToHistory('💬 User provided feedback', {
          type: 'user_chat',
          feedback: userFeedback,
          paragraphId: this.confirmationWidgetData.nodeId
        });
        this.updateAgentStatus('Processing feedback...');

        // Clear current suggestion and set streaming state
        this.confirmationWidgetData.aiMessage = '';
        this.confirmationWidgetData.isLoading = true;

        // Abort any current request
        this.projectAgentCurrentPromptRequest?.abortController?.abort();

        try {
          const promptStore = usePromptStore();

          const request = cloneRequest(this.projectAgentCurrentPromptRequest);
          this.projectAgentCurrentPromptRequest = request;

          request.abortController = new AbortController();
          if (this.independentAgentChatHistory.length > 0) {
            request.appendMessages = [...this.independentAgentChatHistory];
          }

          const result = await promptStore.promptInternalSimple(request);

          this.confirmationWidgetData.isLoading = false;

          await this.processIndependentAgentResult(result, false);

          // Update status after processing feedback
          this.updateAgentStatus('Waiting for user confirmation...');
        } catch (error) {
          this.clearProjectAgent();
        } finally {
          if(this.confirmationWidgetData) {
            this.confirmationWidgetData.isLoading = false;
          }
        }

        await this.continueIndependentAgent(this.projectAgent);
      } else {
        // Log user feedback for project agent
        this.addActionToHistory('💬 User provided feedback', {
          type: 'user_chat',
          feedback: userFeedback,
          paragraphId: this.confirmationWidgetData.nodeId
        });
        this.updateAgentStatus('Processing feedback...');

        this.confirmationWidgetData.conversationMessages.push({ type: 'assistant', text: this.confirmationWidgetData.aiSuggestion });
        this.confirmationWidgetData.conversationMessages.push({ type: 'user', text: userFeedback });

        this.confirmationWidgetData.aiSuggestion = '';

        this.projectAgentCurrentPromptRequest?.abortController?.abort();

        if(this.projectAgentCurrentProcessingParagraphItem) {
          this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'streaming');
        }

        try {
          const onOutput = (fullText, newText, isFinished, isError, request, result) => {
            if (this.shouldAbortStreaming() || !this.confirmationWidgetData || request.isInstructionGeneratorRequest) {
              return;
            }

            this.confirmationWidgetData.isStreaming = true;

            this.confirmationWidgetData.executingPromptRequest = request;
            this.confirmationWidgetData.promptResult = result;

            if(!request.isPromptAgent) { // do not stream when analysing by agent
              this.confirmationWidgetData.aiSuggestion = fullText;
            }

            if (isFinished) {
              this.confirmationWidgetData.isStreaming = false;

              if (!isError && !this.shouldAbortStreaming()) {

                if (request.isPromptAgent) {
                  if(this.shouldIgnoreAgentResult(fullText, request.promptAgent)) {
                    return;
                  }
                }

                this.confirmationWidgetData.aiSuggestion = fullText;

                if(this.projectAgentCurrentProcessingParagraphItem) {
                  this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');
                }
              }
            }
          };

          this.confirmationWidgetData.promptResult = await this.executeProjectAgentPrompt(onOutput);

        } catch (error) {
          this.confirmationWidgetData.isStreaming = false;
        }
      }
    },
    onWidgetUndo() {
      if(!this.confirmationWidgetData) {
        return;
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      this.confirmationWidgetData.aiSuggestion = this.confirmationWidgetData.originalAiSuggestion;

      if(!this.confirmationWidgetData.isIndependentAgent) {
        this.confirmationWidgetData.conversationMessages = [];

        if(this.projectAgentCurrentProcessingParagraphItem) {
          this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');
        }
      }
    },
    async executeProjectAgentPrompt(onOutput) {
      const promptStore = usePromptStore();

      try {
        this.confirmationWidgetData.isStreaming = true;

        const newRequest = cloneRequest(this.projectAgentCurrentPromptRequest);
        this.projectAgentCurrentPromptRequest = newRequest;

        newRequest.isProjectAgent = true;
        newRequest.abortController = new AbortController();
        newRequest.silent = true;
        newRequest.text = this.projectAgentCurrentProcessingParagraphItem.instruction;

        newRequest.contextTypes = this.projectAgentContext;

        if (this.confirmationWidgetData.conversationMessages.length > 0) {
          newRequest.appendMessages = [...this.confirmationWidgetData.conversationMessages];
        }

        if (onOutput) {
          newRequest.onOutput = onOutput;
        }

        const result = await promptStore.promptMultiple(newRequest);
        return result;
      } catch (error) {
        console.log(error);
        // Log error
        this.addActionToHistory('⚠️ Error in prompt execution', {
          type: 'prompt_error',
          error: error.message || 'Unknown error'
        });
        this.updateAgentStatus('Error occurred');

        this.clearProjectAgent();

        throw error;
      }
    },
    async runAgentOnParagraph(agent, item) {
      const editorStore = useEditorStore();

      this.projectAgentCurrentProcessingParagraphItem = item;

      let conversationMessages = [];

      console.log('RUN AGENT ON PARAGRAPH', item.text);

      // Log processing start
      this.addActionToHistory('⚙️ Processing paragraph', {
        type: 'processing',
        paragraphId: item.nodeId,
        instruction: item.instruction.substring(0, 100) + (item.instruction.length > 100 ? '...' : '')
      });
      this.updateAgentStatus(`Processing: ${item.instruction.substring(0, 50)}...`);

      editorStore.updateAgentDecoration(item.from, item.to, 'processing');

      this.confirmationWidgetData = {
        agentTitle: agent.title,
        paragraphRange: { from: item.from, to: item.to },

        originalText: item.text,
        nodeId: item.nodeId,
        conversationMessages: conversationMessages,

        isStreaming: true,
        originalAiSuggestion: '',
        aiSuggestion: '',

        promptResult: null,
      };

      let promiseResolve;
      const confirmationPromise = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      this.currentConfirmationPromise = { resolve: promiseResolve };

      try {
        let ignored = false;

        const onInitialOutput = (fullText, newText, isFinished, isError, request, result) => {
          if (this.shouldAbortStreaming() || ignored || !this.confirmationWidgetData || request.isInstructionGeneratorRequest) {
            return;
          }

          this.confirmationWidgetData.isStreaming = true;

          this.confirmationWidgetData.executingPromptRequest = request;
          this.confirmationWidgetData.promptResult = result;

          if(!request.isPromptAgent) { // do not stream when analysing by agent
            this.confirmationWidgetData.aiSuggestion = fullText;
          }

          if (isFinished) {
            this.confirmationWidgetData.isStreaming = false;
            if (!isError && !this.shouldAbortStreaming()) {

              if (request.isPromptAgent) {
                if(this.shouldIgnoreAgentResult(fullText, request.promptAgent)) {
                  return;
                }
              }

              this.confirmationWidgetData.aiSuggestion = fullText;

              if (!this.confirmationWidgetData.originalAiSuggestion) {
                this.confirmationWidgetData.originalAiSuggestion = fullText;
              }

              if (this.shouldIgnoreAgentResult(this.confirmationWidgetData.aiSuggestion, agent)) {
                // Log ignored result
                this.addActionToHistory('🚫 Suggestion ignored', {
                  type: 'ignored',
                  paragraphId: item.nodeId,
                  reason: 'Agent returned ignore text'
                });

                this.projectAgentCurrentPromptRequest?.abortController?.abort();

                this.projectAgentSkippedParagraphs.add(item.nodeId);
                this.manageParagraphDecoration(item, 'remove');

                if (this.currentConfirmationPromise) {
                  this.currentConfirmationPromise.resolve('skipped');
                  this.currentConfirmationPromise = null;
                }

                ignored = true;
                return;
              }

              // Log suggestion
              this.addActionToHistory('✏️ Suggested change', {
                type: 'suggest',
                paragraphId: item.nodeId,
                preview: fullText.substring(0, 100) + (fullText.length > 100 ? '...' : '')
              });
              this.updateAgentStatus('Waiting for user confirmation...');

              this.manageParagraphDecoration(item, 'awaiting_confirmation');
            }
          }
        };

        //TODO bug - even if user aborts, it still waits to complete this before continuing with the next paragraph
        this.confirmationWidgetData.promptResult = await this.executeProjectAgentPrompt(onInitialOutput);
      } catch (error) {
        console.log(error);
        // Log error for project agent
        this.addActionToHistory('⚠️ Error occurred', {
          type: 'error',
          paragraphId: item.nodeId,
          error: error.message || 'Unknown error'
        });
        this.updateAgentStatus('Error occurred');

        this.confirmationWidgetData.isStreaming = false;
        return 'error';
      }

      const userChoice = await confirmationPromise;

      return userChoice;
    },
    async processIndependentAgent(agent) {
      // Generate full file content with node IDs
      const fullFileContent = this.generateFullFileWithNodeIds();
      if (!fullFileContent.trim()) {
        this.clearProjectAgent();
        return;
      }

      // Log agent start
      this.addActionToHistory('🚀 Agent started', {
        type: 'start',
        agentName: agent.title,
        documentLength: fullFileContent.split('\n').filter(line => line.trim()).length + ' paragraphs'
      });
      this.updateAgentStatus('Analyzing document...');

      try {

        const result = await this.executeIndependentAgentPrompt(fullFileContent);

        await this.processIndependentAgentResult(result, true);

      } catch (error) {
        console.log(error);
        // Log error
        this.addActionToHistory('⚠️ Error occurred', {
          type: 'error',
          error: error.message || 'Unknown error'
        });
        this.updateAgentStatus('Error occurred');

        this.clearProjectAgent();
        return;
      }

      await this.continueIndependentAgent(this.projectAgent);
    },
    async continueIndependentAgent(agent) {
      if (agent && !this.confirmationWidgetData?.isAgentStopped) {
        // Generate current file content for next iteration
        const currentFileContent = this.generateFullFileWithNodeIds();

        this.independentAgentChatHistory.push({
          type: 'user',
          text: `${currentFileContent}`
        })

        // Log continuation
        this.addActionToHistory('🔄 Continuing to next task', {
          type: 'continue'
        });
        this.updateAgentStatus('Looking for next task...');

        // Continue with the agent for next iteration
        await this.processIndependentAgent(agent);
      }
    },
    async processIndependentAgentResult(result, createNewWidget) {
      if (!result || this.shouldAbortStreaming()) {
        this.clearProjectAgent();
        return;
      }

      // Extract tool calls from the OpenAI response
      const completion = result.completionResponse;
      if (!completion || !completion.choices || completion.choices.length === 0) {
        this.clearProjectAgent();
        return;
      }

      const message = completion.choices[0].message;
      if (!message.tool_calls || message.tool_calls.length === 0) {
        // Log no tool calls
        this.addActionToHistory('⚠️ No actions suggested', {
          type: 'no_actions',
          reason: 'AI did not suggest any modifications'
        });
        this.updateAgentStatus('No actions to perform');

        this.clearProjectAgent();
        return;
      }

      // Add the original assistant message with tool_calls to chat history
      // This is required by OpenAI before any tool response messages
      this.independentAgentChatHistory.push({
        type: 'assistant',
        text: message.content || '',
        toolCalls: message.tool_calls
      });

      for (const toolCall of message.tool_calls) {
        // Get the first tool call
        const toolCallResult = {
          toolName: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
          toolCallId: toolCall.id
        };

        // Execute the tool
        const toolResult = this.executeIndependentAgentTool(toolCallResult);

        if (toolResult.error) {
          console.log(toolResult.error);
          continue;
        }

        if (toolResult.action === 'stop') {
          // Log stop action
          this.addActionToHistory('🛑 Agent finished his work', {
            type: 'stop',
            reasoning: toolResult.reasoning
          });
          this.updateAgentStatus('Completed');

          this.clearProjectAgent();
          return;
        }

        if (toolResult.action === 'modify' || toolResult.action === 'add' || toolResult.action === 'remove') {
          this.projectAgentCurrentProcessingParagraphItem = toolResult.targetNode;

          if(!this.projectAgentCurrentProcessingParagraphItem) {
            this.clearProjectAgent();
            return;
          }

          // Log appropriate action suggestion
          const actionEmoji = toolResult.action === 'add' ? '➕' : toolResult.action === 'remove' ? '🗑️' : '✏️';
          const actionLabel = toolResult.action === 'add' ? 'addition' : toolResult.action === 'remove' ? 'removal' : 'modification';

          this.addActionToHistory(`${actionEmoji} Suggested ${actionLabel}`, {
            type: 'suggest',
            action: toolResult.action,
            paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId,
            reasoning: toolResult.reasoning,
            preview: toolResult.newContent ? toolResult.newContent.substring(0, 100) + (toolResult.newContent.length > 100 ? '...' : '') : 'Remove paragraph'
          });

          // Check for auto-approval on empty documents
          const editorStore = useEditorStore();
          if (toolResult.action === 'add' && this.isDocumentEmpty(editorStore.editor)) {
            // Auto-approve: directly execute insertion for empty document
            await this.executeDirectInsertionForEmptyDocument(toolResult);

            this.addActionToHistory('✅ Auto-approved addition to empty document', {
              type: 'auto_approved',
              action: toolResult.action,
              paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId,
              reasoning: 'Document was empty, no user confirmation needed'
            });

            // Continue to next paragraph processing
            await this.processNextParagraph(agent);
            return;
          }

          this.updateAgentStatus('Waiting for user confirmation...');

          if(createNewWidget || !this.confirmationWidgetData) {
            // Set up confirmation widget for independent agent
            const nodeId = this.projectAgentCurrentProcessingParagraphItem.nodeId;
            let displayText = this.projectAgentCurrentProcessingParagraphItem.text;

            // Handle special position markers
            if (nodeId === '__END__') {
              displayText = 'Insert at document end';
            }

            this.confirmationWidgetData = {
              agentTitle: this.projectAgent.title,
              paragraphRange: { from: this.projectAgentCurrentProcessingParagraphItem.from, to: this.projectAgentCurrentProcessingParagraphItem.to },
              originalText: displayText,
              nodeId: nodeId,
              conversationMessages: [...this.independentAgentChatHistory],
              isStreaming: false,
              originalAiSuggestion: toolResult.newContent || '',
              aiSuggestion: toolResult.newContent || '',
              promptResult: result,
              isIndependentAgent: true,
              reasoning: toolResult.reasoning,
              toolCallResult: toolResult
            };
          } else {
            this.confirmationWidgetData.aiSuggestion = toolResult.newContent || '';
            this.confirmationWidgetData.conversationMessages = [...this.independentAgentChatHistory];
            this.confirmationWidgetData.promptResult = result;
            this.confirmationWidgetData.reasoning = toolResult.reasoning;
            this.confirmationWidgetData.toolCallResult = toolResult;
          }

          this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');

          let promiseResolve;
          const confirmationPromise = new Promise((resolve) => {
            promiseResolve = resolve;
          });
          this.currentConfirmationPromise = { resolve: promiseResolve };

          const confirmationResult = await confirmationPromise;

          // Add tool result to assistant history
          if(confirmationResult === 'accepted') {
            this.independentAgentChatHistory.push({
              type: 'tool',
              name: 'modifyParagraph',
              toolCallId: toolCallResult.toolCallId,
              text: `Successfully modified paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId}. User ACCEPTED the change.`
            });

            // Log user acceptance
            this.addActionToHistory('✅ User accepted change', {
              type: 'user_accept',
              paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId
            });

            this.confirmationWidgetData = null;
          } else if (confirmationResult === 'skipped') {
            this.independentAgentChatHistory.push({
              type: 'tool',
              name: 'modifyParagraph',
              toolCallId: toolCallResult.toolCallId,
              text: `Modification of paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId} was SKIPPED by user. Do not suggest it again!`
            });

            // Log user rejection
            this.addActionToHistory('❌ User skipped change', {
              type: 'user_skip',
              paragraphId: this.projectAgentCurrentProcessingParagraphItem.nodeId
            });

            this.confirmationWidgetData = null;
          }

          editorStore.clearAllAgentDecorations();
          this.currentConfirmationPromise = null;
        }
      }
    },
    async executeIndependentAgentPrompt(fullFileContent) {
      const promptStore = usePromptStore();

      try {
        const newRequest = cloneRequest(this.projectAgentCurrentPromptRequest);
        this.projectAgentCurrentPromptRequest = newRequest;

        newRequest.userPrompt = fullFileContent;
        newRequest.text = fullFileContent;
        newRequest.isProjectAgent = true;
        newRequest.isIndependentAgent = true;
        newRequest.abortController = new AbortController();
        newRequest.silent = true;
        newRequest.contextTypes = this.projectAgentContext;
        newRequest.tools = this.getIndependentAgentTools();

        if (this.independentAgentChatHistory.length > 0) {
          newRequest.appendMessages = [...this.independentAgentChatHistory];
        }

        const result = await promptStore.promptInternalSimple(newRequest);

        return result;
      } catch (error) {
        this.clearProjectAgent();
        throw error;
      }
    },
    stopAgentProcessing() {
      const editorStore = useEditorStore();

      this.projectAgentUserAborted = true;

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      // Log agent stop
      if (this.projectAgent) {
        this.addActionToHistory('🛑 User stopped agent', {
          type: 'user_stop',
          agentType: this.projectAgent.isIndependent ? 'independent' : 'paragraph_based'
        });
        this.updateAgentStatus('Stopped by user');
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
      }

      this.clearProjectAgent();
    },
    generateFullFileWithNodeIds() {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return '';

      const doc = editor.state.doc;
      let fullContent = '';

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          if (text.trim().length > 0) {
            fullContent += `[${node.attrs.id}]: ${text.trim()}\n\n`;
          }
        }
      });

      return fullContent;
    },
    findParagraphByNodeId(nodeId) {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return null;

      const doc = editor.state.doc;

      // Handle regular paragraph nodeIds
      let foundItem = null;

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (foundItem) return false;

        if (node.type.name === 'paragraph' && node.attrs.id === nodeId) {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          foundItem = {
            node,
            pos,
            from,
            to,
            text: text.trim(),
            nodeId: node.attrs.id
          };
        }
      });

      return foundItem;
    },
    async replaceParagraphWithContent(nodeId, newContent) {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) {
        Notify.create({
          message: 'Editor not available',
          color: 'negative',
          position: 'top-right',
          timeout: 2000
        });
        return false;
      }

      const targetNode = this.findParagraphByNodeId(nodeId);
      if (!targetNode) {
        Notify.create({
          message: 'Paragraph not found',
          color: 'negative',
          position: 'top-right',
          timeout: 2000
        });
        return false;
      }

      try {
        // Replace paragraph content while preserving its ID
        editor.chain()
          .focus()
          .command(({ tr, state }) => {
            const newNode = state.schema.nodes.paragraph.create(
              { id: targetNode.node.attrs.id }, // Preserve the paragraph ID
              state.schema.text(newContent)
            );
            tr.replaceWith(targetNode.from, targetNode.to, newNode);
            return true;
          })
          .run();

        return true;
      } catch (error) {
        console.error('Error replacing paragraph:', error);
        Notify.create({
          message: 'Failed to replace paragraph',
          color: 'negative',
          position: 'top-right',
          timeout: 2000
        });
        return false;
      }
    },
    getIndependentAgentTools() {
      return [
        {
          type: "function",
          function: {
            name: "modifyParagraph",
            description: "Modify the content of a specific paragraph in the document",
            parameters: {
              type: "object",
              properties: {
                nodeId: {
                  type: "string",
                  description: "The ID of the paragraph node to modify"
                },
                newContent: {
                  type: "string",
                  description: "The new content to replace the paragraph with"
                },
                reasoning: {
                  type: "string",
                  description: "Explanation of why this change is being made"
                }
              },
              required: ["nodeId", "newContent", "reasoning"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "stop",
            description: "Stop the agent processing when no more changes are needed",
            parameters: {
              type: "object",
              properties: {
                reasoning: {
                  type: "string",
                  description: "Explanation of why processing is being stopped"
                }
              },
              required: ["reasoning"]
            }
          }
        }
      ];
    },
    getChatAgentTools() {
      return [
        {
          type: "function",
          function: {
            name: "getCurrentDocument",
            description: "Get the current user opened document content with paragraph IDs and a list of all child files. Each paragraph is formatted as [nodeId]: content. Also shows the file hierarchy with metadata for all child files. CALL this before making changes to the current file to ensure proper position.",
            parameters: {
              type: "object",
              properties: {
                includeChildFileSummaries: {
                  type: "boolean",
                  description: "Whether to include file summaries in the child files tree",
                  default: false
                },
                maxSummaryLength: {
                  type: "number",
                  description: "Maximum length of summaries to display (characters)",
                  default: 100
                }
              },
              required: []
            }
          }
        },
        {
          type: "function",
          function: {
            name: "listProjectFiles",
            description: "Get a list of all files in the project with their structure, metadata, and hierarchy. Optionally filter by context type to focus on specific content types.",
            parameters: {
              type: "object",
              properties: {
                contextType: {
                  type: "string",
                  description: "Optional filter to only show files of a specific context type (e.g., 'Manuscript', 'Characters', 'Places', 'Notes', 'Research'). If not provided or set to 'all', shows all files regardless of context type."
                },
                includeSummaries: {
                  type: "boolean",
                  description: "Whether to include file summaries in the file tree",
                  default: false
                },
                maxSummaryLength: {
                  type: "number",
                  description: "Maximum length of summaries to display (characters)",
                  default: 100
                }
              },
              required: []
            }
          }
        },
        {
          type: "function",
          function: {
            name: "readFile",
            description: "Read the content of a specific file in the project. Can read full content or just summary. Use the file ID from listProjectFiles (shown as 'ID: abc123' in the brackets). Also shows all child files with their metadata.",
            parameters: {
              type: "object",
              properties: {
                fileId: {
                  type: "string",
                  description: "The exact file ID from listProjectFiles output (e.g., 'abc123def456', not a file path)"
                },
                readType: {
                  type: "string",
                  description: "Type of read operation: 'full' for complete content or 'summary' for summary only",
                  enum: ["full", "summary"]
                },
                includeChildFileSummaries: {
                  type: "boolean",
                  description: "Whether to include file summaries in the child files tree",
                  default: false
                },
                maxSummaryLength: {
                  type: "number",
                  description: "Maximum length of summaries to display (characters)",
                  default: 100
                }
              },
              required: ["fileId"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "modifyParagraph",
            description: "Modify, add, or remove paragraphs in the CURRENTLY OPENED document - use this to modify the file user has currently opened.",
            parameters: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  description: "The type of action to perform",
                  enum: ["modify", "add", "remove"]
                },
                nodeId: {
                  type: "string",
                  description: "For modify/remove: The ID of the paragraph to modify/remove. For add: The ID of the paragraph to insert relative to. Special values: '__END__' (insert at document end) - Useful also when the document is empty."
                },
                newContent: {
                  type: "string",
                  description: "For modify/add: The content for the paragraph"
                },
                position: {
                  type: "string",
                  description: "For add action: Where to insert the new paragraph",
                  enum: ["before", "after"]
                },
                reasoning: {
                  type: "string",
                  description: "Explanation of why this change is being made"
                }
              },
              required: ["action", "nodeId", "reasoning"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "setFileSummary",
            description: "Set the summary for any file. If no fileId is provided, sets the summary for the currently opened file. (Prefer this tool to appending summary paragraphs to the documents - it sets the summary to file's metadata instead of modifying its content)",
            parameters: {
              type: "object",
              properties: {
                fileId: {
                  type: "string",
                  description: "The ID of the file to set the summary for. If not provided, uses the currently opened file."
                },
                summary: {
                  type: "string",
                  description: "The summary content to set for the file"
                }
              },
              required: ["summary"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "search",
            description: "Search through all project files using exact or fuzzy matching. By default, searches in all fields (title, content, and summary) across all context types for comprehensive results. Provide optional parameters if you need to narrow the search scope.",
            parameters: {
              type: "object",
              properties: {
                searchQuery: {
                  type: "string",
                  description: "The text to search for. Prefer simple keywords for exact or fuzzy matches, no advanced search syntax or logical operators are available."
                },
                searchType: {
                  type: "string",
                  description: "Optional: Type of content to search in. Defaults to 'all' which searches across title, content, and summary. Only specify 'title', 'content', or 'summary' if you specifically need to limit the search to a single field.",
                  enum: ["title", "content", "summary", "all"],
                  default: "all"
                },
                contextType: {
                  type: "string",
                  description: "Optional filter to only search files of a specific context type (e.g., 'Manuscript', 'Characters', 'Places', 'Notes', 'Research'). Leave empty/undefined to search across all context types. Do not use 'all' as a value."
                },
                fuzzySearch: {
                  type: "boolean",
                  description: "Enable fuzzy search for typo tolerance and approximate matching",
                  default: false
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: 20
                },
                threshold: {
                  type: "number",
                  description: "Fuzzy search sensitivity (0.0 = exact match, 1.0 = match anything)",
                  default: 0.3
                }
              },
              required: ["searchQuery"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getAvailableAIPrompts",
            description: "Get a list of available AI prompts that can be executed for text generation and other tasks. Returns prompts with their titles and descriptions so you can choose the most appropriate one.",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        },
        {
          type: "function",
          function: {
            name: "executeAIPrompt",
            description: "Execute a specialized AI prompt with input text. Use getAvailableAIPrompts first to find the right prompt ID.",
            parameters: {
              type: "object",
              properties: {
                promptId: {
                  type: "string",
                  description: "ID of the prompt to execute (from getAvailableAIPrompts)"
                },
                inputText: {
                  type: "string",
                  description: "The text input to provide to the prompt"
                }
              },
              required: ["promptId", "inputText"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getAllContextTypes",
            description: "Get a list of all available context types in the project. Context types help organize files by purpose (e.g., Manuscript, Characters, Places, Notes, Research).",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        },
        {
          type: "function",
          function: {
            name: "createFile",
            description: "Create a new file in the project with optional content, summary, and organization settings.",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "The title/name for the new file"
                },
                content: {
                  type: "string",
                  description: "Optional initial content for the file"
                },
                summary: {
                  type: "string",
                  description: "Optional summary/synopsis for the file"
                },
                parentId: {
                  type: "string",
                  description: "Optional ID of the parent file to create this file as a child"
                },
                contextType: {
                  type: "string",
                  description: "Optional context type for organizing the file (e.g., 'Manuscript', 'Characters', 'Places', 'Notes', 'Research')"
                }
              },
              required: ["title"]
            }
          }
        }
      ];
    },
    executeIndependentAgentTool(toolCall) {
      const { toolName, arguments: args } = toolCall;

      switch (toolName) {
        case 'modifyParagraph':
          return this.executeModifyParagraphTool(args);
        case 'stop':
          return this.executeStopTool(args);
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    },
    executeModifyParagraphTool(args) {
      const { action = 'modify', nodeId, newContent, position, reasoning } = args;

      if (!nodeId || !reasoning) {
        return { error: "Missing required arguments: nodeId and reasoning" };
      }

      if ((action === 'modify' || action === 'add') && !newContent) {
        return { error: `Missing newContent for ${action} action` };
      }

      if (action === 'add' && !position && nodeId !== '__END__') {
        return { error: "Missing position for add action" };
      }

      // Handle special position markers
      if (nodeId === '__END__') {
        // Find the last paragraph instead of using position marker
        const editorStore = useEditorStore();
        const lastParagraph = this.findLastParagraph(editorStore.editor);
        if (!lastParagraph) {
          return { error: "No paragraphs found in document for __END__ positioning" };
        }

        return {
          success: true,
          action,
          targetNode: lastParagraph,  // Use actual last paragraph
          newContent,
          position: 'after',  // Always insert after the last paragraph
          reasoning
        };
      }

      // Find the target paragraph for regular nodeIds
      const targetNode = this.findParagraphByNodeId(nodeId);
      if (!targetNode) {
        return { error: `Paragraph with ID ${nodeId} not found` };
      }

      return {
        success: true,
        action,
        targetNode,
        newContent,
        position,
        reasoning
      };
    },
    executeStopTool(args) {
      const { reasoning } = args;

      if (!reasoning) {
        return { error: "Missing reasoning for stop" };
      }

      return {
        success: true,
        action: 'stop',
        reasoning
      };
    },
    async executeChatAgentTool(toolCall) {
      const { toolName, arguments: args } = toolCall;

      switch (toolName) {
        case 'getCurrentDocument':
          return this.executeGetCurrentDocumentTool(args);
        case 'listProjectFiles':
          return this.executeListProjectFilesTool(args);
        case 'readFile':
          return this.executeReadFileTool(args);
        case 'modifyParagraph':
          return this.executeModifyParagraphTool(args);
        case 'setFileSummary':
          return this.executeSetFileSummaryTool(args);
        case 'search':
          return this.executeSearchTool(args);
        case 'getAvailableAIPrompts':
          return this.executeGetAvailableAIPromptsTool(args);
        case 'executeAIPrompt':
          return await this.executeAIPromptTool(args);
        case 'getAllContextTypes':
          return this.executeGetAllContextTypesTool();
        case 'createFile':
          return this.executeCreateFileTool(args);
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    },
    // Helper method to format file tree with all levels
    formatFileTreeForAgent(files, fileStore, depth = 0, prefix = "", includeSummaries = false, maxSummaryLength = 100) {
      let output = '';

      files.forEach((file, index) => {
        const isLastFile = index === files.length - 1;
        const connector = isLastFile ? "└── " : "├── ";
        const childPrefix = prefix + (isLastFile ? "    " : "│   ");

        const metadata = [];

        output += prefix + connector + file.title + ` [ID: ${file.id}]`;

        if (file.labels && file.labels.length > 0) {
          const labelNames = file.labels.map(label => typeof label === 'string' ? label : label.label).join(', ');
          metadata.push(`Labels: ${labelNames}`);
        }

        if (file.settings && file.settings.contextType && file.settings.contextType.label) {
          metadata.push(`Context: ${file.settings.contextType.label}`);
        }

        const wordCount = fileStore.getTextWords(file, true, false);
        if (wordCount) {
          metadata.push(`Content: ${wordCount}`);
        }

        // Add summary word count if summary exists
        if (file.synopsis && file.synopsis.trim()) {
          const summaryWords = file.synopsis.trim().split(/\s+/).length;
          metadata.push(`Summary: ${summaryWords} words`);
        }

        if (file.children && file.children.length > 0) {
          metadata.push(`${file.children.length} sub-files`);
        }

        if (metadata.length > 0) {
          output += ` (${metadata.join(', ')})`;
        }

        output += '\n';

        // Add summary content if requested
        if (includeSummaries && file.synopsis && file.synopsis.trim()) {
          const summaryText = file.synopsis.trim();
          const truncatedSummary = summaryText.length > maxSummaryLength
            ? summaryText.substring(0, maxSummaryLength) + '...'
            : summaryText;
          output += prefix + (isLastFile && (!file.children || file.children.length === 0) ? '    ' : '│   ') + '📝 ' + truncatedSummary + '\n';
        }

        // Recursively add children
        if (file.children && file.children.length > 0) {
          output += this.formatFileTreeForAgent(file.children, fileStore, depth + 1, childPrefix, includeSummaries, maxSummaryLength);
        }
      });

      return output;
    },
    executeGetCurrentDocumentTool(args) {
      const { includeChildFileSummaries = false, maxSummaryLength = 100 } = args || {};
      const fileStore = useFileStore();
      const currentFile = fileStore.selectedFile;

      let output = '';

      // Add current file metadata
      if (currentFile) {
        output += `CURRENT FILE: ${currentFile.title}\n`;
        output += `Path: ${fileStore.getFileNameWithPath(currentFile)}\n`;

        // Add file metadata
        const metadata = [];
        if (currentFile.labels && currentFile.labels.length > 0) {
          const labelNames = currentFile.labels.map(label => typeof label === 'string' ? label : label.label).join(', ');
          metadata.push(`Labels: ${labelNames}`);
        }

        if (currentFile.settings && currentFile.settings.contextType && currentFile.settings.contextType.label) {
          metadata.push(`Context: ${currentFile.settings.contextType.label}`);
        }

        if (currentFile.state && currentFile.state.trim()) {
          metadata.push(`State: ${currentFile.state}`);
        }

        const wordCount = fileStore.getTextWords(currentFile, true, false);
        if (wordCount) {
          metadata.push(`Word Count: ${wordCount}`);
        }

        if (metadata.length > 0) {
          output += metadata.join(' | ') + '\n';
        }

        output += '\nDOCUMENT CONTENT:\n';
      }

      const documentContent = this.generateFullFileWithNodeIds();

      if (!documentContent) {
        output += "The document is empty.";
      } else {
        output += documentContent;
      }

      // Add children files information after content
      if (currentFile && currentFile.children && currentFile.children.length > 0) {
        output += `\n\nCHILDREN FILES:\n`;
        output += this.formatFileTreeForAgent(currentFile.children, fileStore, 0, "", includeChildFileSummaries, maxSummaryLength);
      }

      return {
        success: true,
        content: output
      };
    },
    executeListProjectFilesTool(args) {
      const { contextType, includeSummaries = false, maxSummaryLength = 100 } = args || {};
      const fileStore = useFileStore();

      if (!fileStore.files || fileStore.files.length === 0) {
        return {
          success: true,
          content: "No files found in the project."
        };
      }

      // Filter files by contextType if specified
      let filesToProcess = fileStore.files;
      if (contextType && contextType !== 'all') {
        filesToProcess = fileStore.getContextFiles(contextType);
        if (filesToProcess.length === 0) {
          return {
            success: true,
            content: `No files found with context type "${contextType}".`
          };
        }
      }

      let output = "PROJECT FILES:\n";
      output += "Note: Use the ID values shown in brackets to read specific files with the readFile tool.\n\n";

      output += this.formatFileTreeForAgent(filesToProcess, fileStore, 0, "", includeSummaries, maxSummaryLength);

      // Add project summary
      const totalFiles = this.countAllFiles(filesToProcess);
      const totalWords = this.getTotalProjectWordCount(filesToProcess);

      output += `\n${contextType ? contextType.toUpperCase() + ' FILES' : 'PROJECT'} SUMMARY:\n`;
      output += `Total files: ${totalFiles}\n`;
      output += `Total words: ${totalWords}\n`;
      if (!contextType) {
        output += `Project name: ${fileStore.projectName || 'Untitled'}\n`;
      }
      output += `\nUSAGE: To read a specific file, use readFile tool with the ID value (e.g., readFile with fileId: "abc123def456")\n`;
      output += `Example: readFile({"fileId": "abc123def456", "readType": "full"})`;

      return {
        success: true,
        content: output
      };
    },
    executeReadFileTool(args) {
      const { fileId, readType = 'full', includeChildFileSummaries = false, maxSummaryLength = 100 } = args;

      if (!fileId) {
        return { error: "fileId parameter is required" };
      }

      const fileStore = useFileStore();
      const file = fileStore.getFile(fileId);

      if (!file) {
        return { error: `File with ID ${fileId} not found` };
      }

      // Build file metadata
      const metadata = [];

      // Add file path
      const filePath = fileStore.getFileNameWithPath(file);

      // Add labels if any
      if (file.labels && file.labels.length > 0) {
        const labelNames = file.labels.map(label => typeof label === 'string' ? label : label.label).join(', ');
        metadata.push(`Labels: ${labelNames}`);
      }

      // Add context type if set
      if (file.settings && file.settings.contextType && file.settings.contextType.label) {
        metadata.push(`Context: ${file.settings.contextType.label}`);
      }

      // Add state if set
      if (file.state && file.state.trim()) {
        metadata.push(`State: ${file.state}`);
      }

      // Add word count
      const wordCount = fileStore.getTextWords(file, true, false);
      if (wordCount) {
        metadata.push(`Word Count: ${wordCount}`);
      }

      // Add icon if not default
      if (file.icon && file.icon !== 'mdi-file-outline') {
        metadata.push(`Icon: ${file.icon}`);
      }

      // Build output based on read type
      let output = `FILE: ${file.title}\n`;
      output += `Path: ${filePath}\n`;

      if (metadata.length > 0) {
        output += metadata.join('\n') + '\n';
      }

      output += '\n';

      if (readType === 'summary') {
        output += 'SUMMARY:\n';
        if (file.synopsis && file.synopsis.trim()) {
          output += file.synopsis;
        } else {
          output += 'No summary available for this file.';
        }
      } else {
        // Default to full content
        output += 'CONTENT:\n';
        if (file.content && file.content.trim()) {
          output += file.content;
        } else {
          output += 'This file is empty.';
        }
      }

      // Add children files information if available
      if (file.children && file.children.length > 0) {
        output += '\n\nCHILDREN FILES:\n';
        output += this.formatFileTreeForAgent(file.children, fileStore, 0, "", includeChildFileSummaries, maxSummaryLength);
        output += `\nTo read any child file, use: readFile({"fileId": "<child_id>", "readType": "full" or "summary"})`;
      }

      return {
        success: true,
        content: output
      };
    },
    executeSetFileSummaryTool(args) {
      const { fileId, summary } = args;

      if (!summary) {
        return { error: "summary parameter is required" };
      }

      const fileStore = useFileStore();
      let file;

      if (fileId) {
        // Use the provided fileId
        file = fileStore.getFile(fileId);
        if (!file) {
          return { error: `File with ID ${fileId} not found` };
        }
      } else {
        // Use the current active file
        file = fileStore.selectedFile;
        if (!file) {
          return { error: "No file specified and no active file available" };
        }
      }

      // Use the file store method to set the summary
      fileStore.setFileSummary(file, summary);

      return {
        success: true,
        content: `Successfully set summary for file "${file.title}". Summary: "${summary}"`
      };
    },
    executeSearchTool(args) {
      const {
        searchQuery,
        searchType,
        contextType,
        fuzzySearch = false,
        maxResults = 20,
        threshold = 0.3
      } = args;

      if (!searchQuery || !searchQuery.trim()) {
        return { error: "searchQuery parameter is required and cannot be empty" };
      }

      // Map 'summary' to 'synopsis' for backward compatibility with searchFiles
      const mappedSearchType = searchType === 'summary' ? 'synopsis' : searchType;

      const { searchFiles } = useFileSearch();
      return searchFiles(searchQuery, mappedSearchType, fuzzySearch, maxResults, threshold, false, contextType);
    },
    executeGetAvailableAIPromptsTool(args) {
      const promptStore = usePromptStore();

      try {
        // Filter prompts by agent permission, enabled status, and type
        const availablePrompts = promptStore.prompts.filter(p =>
          p.enabled &&
          p.canBeUsedByAgent === true &&
          ['insert', 'general', 'selection'].includes(p.promptType)
        );

        return {
          success: true,
          content: JSON.stringify({
            prompts: availablePrompts.map(p => this.formatPromptForAgent(p)),
            totalCount: availablePrompts.length
          }, null, 2)
        };
      } catch (error) {
        return {
          error: `Failed to get available AI prompts: ${error.message}`
        };
      }
    },
    formatPromptForAgent(prompt) {
      // Get model name for this prompt
      const promptStore = usePromptStore();
      const model = promptStore.models.find(m => m.id === prompt.modelId);

      return {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description || '',
        modelName: model ? model.name : 'Unknown Model'
      };
    },
    countAllFiles(files) {
      let count = 0;
      for (const file of files) {
        count += 1;
        if (file.children && file.children.length > 0) {
          count += this.countAllFiles(file.children);
        }
      }
      return count;
    },
    getTotalProjectWordCount(files) {
      const fileStore = useFileStore();
      let totalWords = 0;
      for (const file of files) {
        const wordCount = fileStore.getTextWords(file, true, false);
        if (wordCount) {
          const words = parseInt(wordCount.replace(' words', ''));
          if (!isNaN(words)) {
            totalWords += words;
          }
        }
        if (file.children && file.children.length > 0) {
          totalWords += this.getTotalProjectWordCount(file.children);
        }
      }
      return totalWords;
    },
    async executeAIPromptTool(args) {
      const promptStore = usePromptStore();

      const { promptId, inputText } = args;

      // Find the prompt by ID
      const prompt = promptStore.prompts.find(p => p.id === promptId);
      if (!prompt) {
        return {
          error: `Prompt with ID '${promptId}' not found`
        };
      }

      // Validate prompt can be used by agent
      if (!this.validatePromptForAgent(prompt)) {
        return {
          error: `Prompt '${prompt.title}' cannot be used by AI agents`
        };
      }

      try {
        // Check if agent execution was stopped
        if (!this.agentChats.isAgentRunning) {
          return {
            error: "Agent execution was stopped"
          };
        }

        // Get prompt's pre-configured contexts for AI agents
        const contextTypes = [];
        const fileStore = useFileStore();
        const promptStore = usePromptStore();

        // Add pre-configured contexts if available
        if (prompt.agentDefaultContextTypes && prompt.agentDefaultContextTypes.length > 0) {
          for (const contextId of prompt.agentDefaultContextTypes) {
            // Extract contextId from object if needed
            const contextIdValue = typeof contextId === 'object' && contextId.value ? contextId.value : contextId;

            // Handle Variable contexts
            if (contextIdValue.startsWith('Variable ')) {
              const variableName = contextIdValue.replace('Variable ', '');
              const variable = fileStore.variables.find(v => v.title === variableName);
              if (variable && variable.value) {
                // Create context with correct contextType for prompt-store recognition
                contextTypes.push({
                  id: contextIdValue,
                  label: `Variable: ${variableName}`,
                  contextType: 'Variable',
                  parameters: variableName,
                  color: 'brown',
                  description: `Content from variable ${variableName}`
                });
              }
            }
            // Handle Context Type Summary contexts
            else if (contextIdValue.startsWith('Context Type Summary ')) {
              const contextTypeName = contextIdValue.replace('Context Type Summary ', '');
              const contextType = promptStore.contextTypes.find(ct => ct.label === contextTypeName);
              if (contextType) {
                // Create context with correct contextType for prompt-store recognition
                contextTypes.push({
                  id: contextIdValue,
                  label: `${contextType.label} summaries`,
                  contextType: 'Context Type Summary',
                  parameters: contextTypeName,
                  color: contextType.color || 'deep-purple',
                  description: `Summaries from all pages with context type ${contextTypeName}`
                });
              }
            }
            // Handle Context Type full content contexts
            else if (contextIdValue.startsWith('Context Type ')) {
              const contextTypeName = contextIdValue.replace('Context Type ', '');
              const contextType = promptStore.contextTypes.find(ct => ct.label === contextTypeName);
              if (contextType) {
                // Create context with correct contextType for prompt-store recognition
                contextTypes.push({
                  id: contextIdValue,
                  label: `${contextType.label} (full text)`,
                  contextType: 'Context Type',
                  parameters: contextTypeName,
                  color: contextType.color || 'purple',
                  description: `Full content from all pages with context type ${contextTypeName}`
                });
              }
            }
            // Handle Previous Characters contexts with parameters
            else if (contextIdValue.startsWith('Previous Text ')) {
              const characterCount = contextIdValue.replace('Previous Text ', '');
              const previousContext = allPromptContexts.find(c => c.id === 'Previous Text');
              if (previousContext) {
                // Create a copy with the parameter information
                const parameterizedContext = {
                  ...previousContext,
                  parameters: parseInt(characterCount),
                  description: `${characterCount} characters preceding your selected text`,
                  label: `Previous ${characterCount} characters`
                };
                contextTypes.push(parameterizedContext);
              }
            }
            // Handle standard contexts from allPromptContexts
            else {
              const contextType = allPromptContexts.find(c => c.id === contextIdValue);
              if (contextType) {
                contextTypes.push(contextType);
              }
            }
          }
        }

        // Always add the input text as dynamic context
        contextTypes.push(createDynamicContext("Input text", inputText));

        // Create request for prompt execution
        const request = {
          prompt: prompt,
          text: inputText,
          clear: true,
          forceBypassMoreParameters: true,
          contextTypes: contextTypes,
          silent: true,
          abortController: this.agentChatCurrentRequest?.abortController || new AbortController()
        };

        // Execute the prompt using internal streaming
        const result = await promptStore.promptInternalStreaming(request);

        // Format and return the result
        return this.formatSimpleResult(result);

      } catch (error) {
        return {
          error: `Failed to execute prompt: ${error.message}`
        };
      }
    },
    validatePromptForAgent(prompt) {
      return prompt.enabled && prompt.canBeUsedByAgent === true;
    },
    formatSimpleResult(result) {
      const content = result.originalText || result.text || 'No result returned';
      return {
        success: true,
        content: content
      };
    },
    executeGetAllContextTypesTool() {
      const promptStore = usePromptStore();

      if (!promptStore.contextTypes || promptStore.contextTypes.length === 0) {
        return {
          success: true,
          content: "No context types defined in this project."
        };
      }

      let output = "AVAILABLE CONTEXT TYPES:\n\n";

      for (let i = 0; i < promptStore.contextTypes.length; i++) {
        const contextType = promptStore.contextTypes[i];
        output += `${i + 1}. ${contextType.label}\n`;
        output += `   Color: ${contextType.color}\n`;
        output += `   Usage: Use "${contextType.label}" as contextType parameter in listProjectFiles and search tools\n\n`;
      }

      output += "EXAMPLES:\n";
      output += `listProjectFiles({"contextType": "${promptStore.contextTypes[0]?.label || 'Manuscript'}"}) - List only ${promptStore.contextTypes[0]?.label || 'Manuscript'} files\n`;
      output += `search({"searchQuery": "keyword", "contextType": "${promptStore.contextTypes[1]?.label || 'Characters'}"}) - Search only in ${promptStore.contextTypes[1]?.label || 'Characters'} files`;

      return {
        success: true,
        content: output
      };
    },
    executeCreateFileTool(args) {
      const { title, content, summary, parentId, contextType } = args;

      if (!title || !title.trim()) {
        return { error: "title parameter is required and cannot be empty" };
      }

      const fileStore = useFileStore();
      const promptStore = usePromptStore();

      try {
        // Find parent file if parentId is provided
        let parent = null;
        if (parentId) {
          parent = fileStore.getFile(parentId);
          if (!parent) {
            return { error: `Parent file with ID ${parentId} not found` };
          }
        }

        // Create template object if content or contextType is provided
        let template = null;
        if (content || contextType) {
          template = {};

          if (content) {
            template.content = markdownToHtml(content);
          } else {
            template.content = '';
          }

          if (contextType) {
            // Find the context type in promptStore
            const contextTypeObj = promptStore.contextTypes.find(ct => ct.label === contextType);
            if (contextTypeObj) {
              template.settings = {
                contextType: contextTypeObj
              };
            }
          }
        }

        if (summary && summary.trim()) {
          template.synopsis = summary;
        }

        // Create the file using fileStore.addFile
        const newFile = fileStore.addFile(title.trim(), parent, template);

        if (!newFile) {
          return { error: "Failed to create file. You may have reached the maximum number of files allowed." };
        }

        return {
          success: true,
          content: `Successfully created file "${newFile.title}" with ID: ${newFile.id}`
        };

      } catch (error) {
        return {
          error: `Failed to create file: ${error.message}`
        };
      }
    },
    isDocumentEmpty(editor) {
      if (!editor) return true;

      const doc = editor.state.doc;

      // Check if document has no paragraphs or only empty paragraphs
      let hasContent = false;
      doc.nodesBetween(0, doc.content.size, (node) => {
        if (node.type.name === 'paragraph' && node.textContent.trim().length > 0) {
          hasContent = true;
          return false; // Stop iteration
        }
      });

      return !hasContent;
    },
    findLastParagraph(editor) {
      if (!editor) return null;

      const doc = editor.state.doc;
      let lastParagraph = null;

      // Traverse document to find the last paragraph
      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          lastParagraph = {
            node,
            pos,
            from,
            to,
            text: text.trim(),
            nodeId: node.attrs.id
          };
        }
      });

      return lastParagraph;
    },
    async executeDirectInsertionForEmptyDocument(toolResult) {
      // This function should ONLY be called when document is empty
      const editorStore = useEditorStore();
      const htmlContent = markdownToHtml(toolResult.newContent);

      // For empty documents, always insert at position 0 (start)
      // since there's no existing content to position relative to
      const insertPos = 0;

      // Execute insertion
      editorStore.editor
        .chain()
        .focus()
        .insertContentAt(insertPos, htmlContent)
        .run();
    },

    // Agent Chat Tab actions
    createAgentChat() {
      const chatId = `chat-${Date.now()}`;
      const newChat = {
        id: chatId,
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      this.agentChats.chats.push(newChat);
      this.agentChats.activeChat = chatId;

      return chatId;
    },
    setActiveAgentChat(chatId) {
      if (this.agentChats.chats.find(c => c.id === chatId)) {
        this.agentChats.activeChat = chatId;
      }
    },
    deleteAgentChat(chatId) {
      const index = this.agentChats.chats.findIndex(c => c.id === chatId);
      if (index !== -1) {
        this.agentChats.chats.splice(index, 1);

        // If deleted chat was active, set the first chat as active
        if (this.agentChats.activeChat === chatId) {
          this.agentChats.activeChat = this.agentChats.chats.length > 0 ? this.agentChats.chats[0].id : null;
        }
      }
    },
    deleteAllAgentChats() {
      this.agentChats.chats = [];
      this.agentChats.activeChat = null;
    },
    addAgentMessage(chatId, message) {
      const chat = this.agentChats.chats.find(c => c.id === chatId);
      if (chat) {
        const messageWithId = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        chat.messages.push(messageWithId);
        chat.lastActivity = Date.now();
        return messageWithId;
      }
    },
    updateAgentRunningState(isRunning) {
      this.agentChats.isAgentRunning = isRunning;
    },
    async executeAgentPrompt(userMessage, selectedPrompt) {
      if (this.agentChats.isAgentRunning || !this.agentChats.activeChat) {
        return;
      }

      const promptStore = usePromptStore();
      const chat = this.agentChats.chats.find(c => c.id === this.agentChats.activeChat);
      if (!chat) {
        return;
      }

      this.updateAgentRunningState(true);

      try {
        // Use the selected prompt or find a suitable one
        let agentPrompt = selectedPrompt;
        if (!agentPrompt) {
          throw new Error('No suitable prompt found for agent');
        }

        // Add system and user prompts to chat if this is the first message
        if (chat.messages.length === 0) {
          // Add system prompt if it exists
          if (agentPrompt.systemPrompt) {
            this.addAgentMessage(this.agentChats.activeChat, {
              role: 'system',
              content: agentPrompt.systemPrompt,
              hidden: true
            });
          }

          // Add initial user prompt if it exists, replacing $chat with user message
          const userPromptWithMessage = agentPrompt.userPrompt.replace('$chat', userMessage);
          this.addAgentMessage(this.agentChats.activeChat, {
            role: 'user',
            content: userPromptWithMessage
          });
        } else {
          // Add new user message
          this.addAgentMessage(this.agentChats.activeChat, {
            role: 'user',
            content: userMessage
          });
        }

        // Prepare messages for AI
        const messages = chat.messages.map(msg => ({
          type: msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : msg.role === 'tool' ? 'tool' : 'assistant',
          text: msg.content,
          toolCalls: msg.toolCalls,
          toolCallId: msg.toolCallId
        }));

        // Create request with tools
        const request = {
          prompt: agentPrompt,
          text: null,
          agentMessages: messages, // All messages from chat history
          agentMessagesOnly: true,
          tools: this.getChatAgentTools(),
          silent: true,
          contextTypes: [], // Chat agent will get context through tools
          abortController: new AbortController()
        };

        // Store the request for abort capability
        this.agentChatCurrentRequest = request;

        // Execute prompt
        const result = await promptStore.promptInternalSimple(request);

        if (!result || !result.completionResponse) {
          throw new Error('No response from AI');
        }

        const completion = result.completionResponse;
        const message = completion.choices[0].message;

        // Add assistant message
        const assistantMessage = this.addAgentMessage(this.agentChats.activeChat, {
          role: 'assistant',
          content: message.content || '',
          toolCalls: message.tool_calls || []
        });

        // Process tool calls if any
        if (message.tool_calls && message.tool_calls.length > 0) {
          await this.processAgentToolCalls(message.tool_calls, assistantMessage.id, agentPrompt);
        }

      } catch (error) {
        console.error('Error in executeAgentPrompt:', error);
        this.addAgentMessage(this.agentChats.activeChat, {
          role: 'system',
          content: `Error: ${error.message}`
        });
      } finally {
        this.updateAgentRunningState(false);
        this.agentChatCurrentRequest = null;
      }
    },

    async processAgentToolCalls(toolCalls, messageId, agentPrompt) {
      const promptStore = usePromptStore();
      const chat = this.agentChats.chats.find(c => c.id === this.agentChats.activeChat);
      if (!chat) return;

      // Add IDs to tools if they don't have them
      toolCalls.forEach((tool, index) => {
        tool.id = tool.id || `tool-${Date.now()}-${index}`;
      });

      // 1. Separate tools by approval requirement
      const needApproval = toolCalls.filter(tool =>
        promptStore.toolApprovalSettings[tool.function.name]
      );
      const autoApprove = toolCalls.filter(tool =>
        !promptStore.toolApprovalSettings[tool.function.name]
      );

      const toolResults = [];

      // 2. Execute auto-approved tools immediately
      for (const toolCall of autoApprove) {
        if (!this.agentChats.isAgentRunning) break;

        const toolResult = await this.executeToolCall(toolCall);
        toolResults.push(toolResult);
      }

      // 3. Show approval UI for tools that need approval
      if (needApproval.length > 0 && this.agentChats.isAgentRunning) {
        const approvedTools = await this.showToolApproval(needApproval);

        // Execute approved tools
        for (const toolCall of approvedTools) {
          if (!this.agentChats.isAgentRunning) break;

          const toolResult = await this.executeToolCall(toolCall);
          toolResults.push(toolResult);
        }

        // Create rejection results for unapproved tools
        const rejectedTools = needApproval.filter(tool =>
          !approvedTools.some(approved => approved.id === tool.id)
        );
        for (const toolCall of rejectedTools) {
          toolResults.push({
            role: 'tool',
            name: toolCall.function.name,
            content: 'Tool execution rejected by user',
            tool_call_id: toolCall.id
          });
        }
      }

      // If we have tool results, make another call to get the AI's response
      if (toolResults.length > 0 && this.agentChats.isAgentRunning) {
        try {
          // First, add tool results to permanent chat history
          for (const toolResult of toolResults) {
            this.addAgentMessage(this.agentChats.activeChat, {
              role: 'tool',
              content: toolResult.content,
              //toolName: toolResult.name,
              toolCallId: toolResult.tool_call_id
            });
          }

          const messages = chat.messages.map(msg => ({
            type: msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : msg.role === 'tool' ? 'tool' : 'assistant',
            text: msg.content,
            toolCalls: msg.toolCalls,
            name: msg.toolName,
            toolCallId: msg.toolCallId
          }));

          const request = {
            prompt: agentPrompt,
            text: '',
            agentMessages: messages,
            agentMessagesOnly: true,
            tools: this.getChatAgentTools(),
            silent: true,
            contextTypes: [], // Chat agent will get context through tools
            abortController: new AbortController()
          };

          // Update the stored request for abort capability
          this.agentChatCurrentRequest = request;

          const result = await promptStore.promptInternalSimple(request);

          if (result && result.completionResponse) {
            const completion = result.completionResponse;
            const message = completion.choices[0].message;

            // Add the final assistant response
            const newAssistantMessage = this.addAgentMessage(this.agentChats.activeChat, {
              role: 'assistant',
              content: message.content || '',
              toolCalls: message.tool_calls || []
            });

            // Process any new tool calls recursively
            if (message.tool_calls && message.tool_calls.length > 0) {
              await this.processAgentToolCalls(message.tool_calls, newAssistantMessage.id, agentPrompt);
            }
          }
        } catch (error) {
          console.error('Error processing tool results:', error);
        }
      }
    },

    getActiveAgentChat() {
      return this.agentChats.chats.find(c => c.id === this.agentChats.activeChat);
    },

    // Helper method to execute a single tool call
    async executeToolCall(toolCall) {
      const toolCallResult = {
        toolName: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
        toolCallId: toolCall.id
      };

      // Execute the tool
      const toolResult = await this.executeChatAgentTool(toolCallResult);

      if (toolResult.error) {
        return {
          role: 'tool',
          content: `Error: ${toolResult.error}`,
          tool_call_id: toolCall.id
        };
      } else {
        let content = '';

        // Handle chat agent tool results
        if (toolResult.content) {
          content = toolResult.content;
        } else if (toolResult.action === 'stop') {
          content = `Stopped: ${toolResult.reasoning}`;
        } else if (toolResult.action === 'modify' || toolResult.action === 'add' || toolResult.action === 'remove') {
          // Show the confirmation widget and wait for user response
          const modificationResult = await this.processChatAgentModification(toolResult, toolCall.id);
          content = modificationResult.content;
        }

        return {
          role: 'tool',
          content: content,
          tool_call_id: toolCall.id
        };
      }
    },

    // Batch approval methods
    async showToolApproval(tools) {
      return new Promise((resolve) => {
        this.pendingToolBatch = tools;
        this.selectedTools = tools.map(t => t.id); // Default: all selected
        this.batchApprovalResolve = resolve;
      });
    },

    executeBatch() {
      if (this.batchApprovalResolve && this.pendingToolBatch) {
        const approved = this.pendingToolBatch.filter(tool =>
          this.selectedTools.includes(tool.id)
        );
        this.batchApprovalResolve(approved);
        this.clearBatch();
      }
    },

    cancelBatch() {
      if (this.batchApprovalResolve) {
        this.batchApprovalResolve([]);
        this.clearBatch();
      }
    },

    clearBatch() {
      this.pendingToolBatch = null;
      this.selectedTools = [];
      this.batchApprovalResolve = null;
    },

    toggleTool(toolId) {
      if (this.selectedTools.includes(toolId)) {
        this.selectedTools = this.selectedTools.filter(id => id !== toolId);
      } else {
        this.selectedTools.push(toolId);
      }
    },

    selectAll() {
      if (this.pendingToolBatch) {
        this.selectedTools = this.pendingToolBatch.map(t => t.id);
      }
    },

    selectNone() {
      this.selectedTools = [];
    },

    stopAgentChatExecution() {
      this.updateAgentRunningState(false);

      // Abort any ongoing request
      this.agentChatCurrentRequest?.abortController?.abort();
      this.agentChatCurrentRequest = null;

      // Add system message to chat history indicating execution was stopped
      if (this.agentChats.activeChat) {
        this.addAgentMessage(this.agentChats.activeChat, {
          role: 'system',
          content: 'Agent execution was stopped by user.',
          hidden: false
        });
      }

      // Clear any pending confirmation widgets (if agent chat was waiting for user input)
      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
        this.confirmationWidgetData = null;
      }

      // Cancel any pending batch approval
      if (this.batchApprovalResolve) {
        this.cancelBatch();
      }
    },

    async processChatAgentModification(toolResult, toolCallId) {
      const editorStore = useEditorStore();

      this.projectAgentCurrentProcessingParagraphItem = toolResult.targetNode;

      if(!this.projectAgentCurrentProcessingParagraphItem) {
        return {
          success: false,
          content: 'Target paragraph not found'
        };
      }

      // Check for auto-approval on empty documents
      if (toolResult.action === 'add' && this.isDocumentEmpty(editorStore.editor)) {
        // Auto-approve: directly execute insertion for empty document
        await this.executeDirectInsertionForEmptyDocument(toolResult);

        return {
          success: true,
          content: 'Content added to empty document (auto-approved)'
        };
      }

      // Set up confirmation widget for chat agent
      const nodeId = this.projectAgentCurrentProcessingParagraphItem.nodeId;
      let displayText = this.projectAgentCurrentProcessingParagraphItem.text;

      // Handle special position markers
      if (nodeId === '__END__') {
        displayText = 'Insert at document end';
      }

      this.confirmationWidgetData = {
        agentTitle: 'AI Agent Chat',
        paragraphRange: {
          from: this.projectAgentCurrentProcessingParagraphItem.from,
          to: this.projectAgentCurrentProcessingParagraphItem.to
        },
        originalText: displayText,
        nodeId: nodeId,
        conversationMessages: [],
        isStreaming: false,
        originalAiSuggestion: toolResult.newContent || '',
        aiSuggestion: toolResult.newContent || '',
        promptResult: null,
        isAgentChat: true,
        reasoning: toolResult.reasoning,
        toolCallResult: toolResult
      };

      this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');

      // Wait for user confirmation
      let promiseResolve;
      const confirmationPromise = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      this.currentConfirmationPromise = { resolve: promiseResolve };

      const confirmationResult = await confirmationPromise;

      // Clean up
      editorStore.clearAllAgentDecorations();
      this.currentConfirmationPromise = null;
      this.confirmationWidgetData = null;

      // Return appropriate result based on user's decision
      const action = toolResult.action || 'modify';
      const actionLabel = action === 'add' ? 'addition' : action === 'remove' ? 'removal' : 'modification';

      if(confirmationResult === 'accepted') {
        return {
          success: true,
          content: `Successfully applied ${actionLabel} to paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId}. The change has been applied.`
        };
      } else if (confirmationResult === 'skipped' || (confirmationResult && confirmationResult.result === 'skipped')) {
        // Handle both simple 'skipped' string and object with feedback
        if (confirmationResult && confirmationResult.feedback) {
          return {
            success: true,
            content: `User REJECTED the modification of paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId} and so the ${actionLabel} was not applied. User also provided following feedback: "${confirmationResult.feedback}". RESPECT it. `
          };
        } else {
          return {
            success: true,
            content: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} of paragraph ${this.projectAgentCurrentProcessingParagraphItem.nodeId} was REJECTED by user.`
          };
        }
      } else {
        return {
          success: false,
          content: 'Operation was cancelled'
        };
      }
    },
  },
});
