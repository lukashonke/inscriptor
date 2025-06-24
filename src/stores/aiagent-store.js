import { defineStore } from 'pinia';
import {
  cloneRequest,
} from "src/common/helpers/promptHelper";
import {usePromptStore} from 'stores/prompt-store';
import {useEditorStore} from 'stores/editor-store';
import { editorTextBetween} from 'src/common/utils/editorUtils';
import {currentFilePromptContext} from 'src/common/resources/promptContexts';

export const useAiAgentStore = defineStore('ai-agent', {
  state: () => ({
    confirmationWidgetData: null,
    currentConfirmationPromise: null,

    projectAgentCurrentProcessingParagraphItem: null,
    projectAgentSkippedParagraphs: new Set(), // Track skipped paragraph text content
    projectAgentProcessing: false,
    projectAgentContext: [],
    projectAgentCurrentPromptRequest: null,

    projectAgentUserAborted: false, // Global flag to abort all streaming
    independentAgentChatHistory: [], // Persistent conversation messages for independent agents
  }),
  getters: {
    agentState: (state) => {
      if (!state.projectAgentProcessing) {
        return 'idle';
      }
      if (state.currentConfirmationPromise) {
        return 'waiting_for_user';
      }
      return 'processing';
    },
    isAgentActive: (state) => state.projectAgentProcessing,
  },
  actions: {
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

      editorStore.clearAllAgentDecorations();
      this.projectAgentSkippedParagraphs.clear();

      if (agent.isIndependent) {
        await this.processIndependentAgent(agent);
      } else {
        await this.processNextParagraph(agent);
      }
    },
    clearProjectAgent() {
      const editorStore = useEditorStore();
      if (this.projectAgentCurrentProcessingParagraphItem) {
        editorStore.removeAgentDecoration(this.projectAgentCurrentProcessingParagraphItem.from, this.projectAgentCurrentProcessingParagraphItem.to);
      }

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
        this.clearProjectAgent();
        return;
      }

      const result = await this.runAgentOnParagraph(agent, nextItem);

      if (result === 'stopped' || result === 'error' || !this.projectAgentProcessing) {
        return;
      }

      await this.processNextParagraph(agent);
    },
    findNextParagraph(agent) {
      const editorStore = useEditorStore();
      const editor = editorStore.editor;

      if (!editor) return null;

      const doc = editor.state.doc;
      let nextItem = null;

      doc.nodesBetween(0, doc.content.size, (node, pos) => {
        debugger;

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

      editorStore.editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          // Replace the content at the specified range
          tr.replaceWith(from, to, state.schema.text(data.aiSuggestion));
          return true;
        })
        .run();

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

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      if(this.projectAgentCurrentProcessingParagraphItem) {
        this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'remove');
      }

      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('skipped');
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
    },
    onWidgetUndo() {
      if(!this.confirmationWidgetData) {
        return;
      }

      this.projectAgentCurrentPromptRequest?.abortController?.abort();

      this.confirmationWidgetData.aiSuggestion = this.confirmationWidgetData.originalAiSuggestion;
      this.confirmationWidgetData.conversationMessages = [];

      if(this.projectAgentCurrentProcessingParagraphItem) {
        this.manageParagraphDecoration(this.projectAgentCurrentProcessingParagraphItem, 'awaiting_confirmation');
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

        const result = await promptStore.promptMultiple2(newRequest);
        return result;
      } catch (error) {
        this.clearProjectAgent();

        throw error;
      }
    },
    async runAgentOnParagraph(agent, item) {
      const editorStore = useEditorStore();

      this.projectAgentCurrentProcessingParagraphItem = item;

      let conversationMessages = [];

      console.log('RUN AGENT ON PARAGRAPH', item.text);

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

              this.manageParagraphDecoration(item, 'awaiting_confirmation');
            }
          }
        };

        //TODO bug - even if user aborts, it still waits to complete this before continuing with the next paragraph
        this.confirmationWidgetData.promptResult = await this.executeProjectAgentPrompt(onInitialOutput);
      } catch (error) {
        this.confirmationWidgetData.isStreaming = false;
        return 'error';
      }

      const userChoice = await confirmationPromise;

      return userChoice;
    },
    parseIndependentAgentToolCall(responseText) {
      try {
        debugger;

        // Try to parse as JSON first (for direct tool call response)
        let response;
        try {
          response = JSON.parse(responseText);
        } catch {
          // If not JSON, look for tool_calls in the text
          const toolCallMatch = responseText.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/);
          if (toolCallMatch) {
            response = JSON.parse(toolCallMatch[0]);
          } else {
            return { error: "No tool calls found in response" };
          }
        }

        if (!response.tool_calls || !Array.isArray(response.tool_calls) || response.tool_calls.length === 0) {
          return { error: "No valid tool calls found" };
        }

        const toolCall = response.tool_calls[0]; // Take first tool call

        if (!toolCall.function || !toolCall.function.name) {
          return { error: "Invalid tool call structure" };
        }

        let args;
        try {
          args = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        } catch {
          return { error: "Invalid tool call arguments" };
        }

        return {
          toolName: toolCall.function.name,
          arguments: args,
          toolCallId: toolCall.id
        };
      } catch (error) {
        return { error: `Failed to parse tool call: ${error.message}` };
      }
    },
    async processIndependentAgent(agent) {
      const editorStore = useEditorStore();

      // Generate full file content with node IDs
      const fullFileContent = this.generateFullFileWithNodeIds();
      if (!fullFileContent.trim()) {
        this.clearProjectAgent();
        return;
      }

      // Set up confirmation widget for independent agent
      this.confirmationWidgetData = {
        agentTitle: agent.title,
        paragraphRange: null, // Will be set after tool execution
        originalText: '',
        nodeId: null,
        conversationMessages: [...this.independentAgentChatHistory],
        isStreaming: true,
        originalAiSuggestion: '',
        aiSuggestion: '',
        promptResult: null,
        isIndependentAgent: true,
        fullFileContent: fullFileContent
      };

      let promiseResolve;
      const confirmationPromise = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      this.currentConfirmationPromise = { resolve: promiseResolve };

      try {
        const onOutput = (fullText, newText, isFinished, isError, request, result) => {
          if (this.shouldAbortStreaming() || !this.confirmationWidgetData) {
            return;
          }

          this.confirmationWidgetData.isStreaming = true;
          this.confirmationWidgetData.executingPromptRequest = request;
          this.confirmationWidgetData.promptResult = result;

          if (!request.isPromptAgent) {
            this.confirmationWidgetData.aiSuggestion = fullText;
          }

          if (isFinished) {
            debugger;
            this.confirmationWidgetData.isStreaming = false;

            if (!isError && !this.shouldAbortStreaming()) {
              // Parse the AI tool call response
              const toolCallResult = this.parseIndependentAgentToolCall(fullText);

              if (toolCallResult.error) {
                this.confirmationWidgetData.aiSuggestion = `Error parsing tool call: ${toolCallResult.error}`;
                return;
              }

              // Execute the tool
              const toolResult = this.executeIndependentAgentTool(toolCallResult);

              if (toolResult.error) {
                this.confirmationWidgetData.aiSuggestion = `Error executing tool: ${toolResult.error}`;
                return;
              }

              if (toolResult.action === 'stop') {
                // AI decided to stop
                this.confirmationWidgetData.aiSuggestion = `Agent completed processing.\n\nReasoning: ${toolResult.reasoning}`;
                this.confirmationWidgetData.isAgentStopped = true;

                // Add to chat history
                this.independentAgentChatHistory.push({
                  type: 'assistant',
                  text: `Used tool: stop\nReasoning: ${toolResult.reasoning}`
                });

                return;
              }

              if (toolResult.action === 'modify') {
                // Set up for user confirmation
                const targetNode = toolResult.targetNode;
                this.confirmationWidgetData.paragraphRange = { from: targetNode.from, to: targetNode.to };
                this.confirmationWidgetData.originalText = targetNode.text;
                this.confirmationWidgetData.nodeId = targetNode.nodeId;
                this.confirmationWidgetData.aiSuggestion = toolResult.newContent;
                this.confirmationWidgetData.reasoning = toolResult.reasoning;
                this.confirmationWidgetData.toolCallResult = toolResult;

                // Add decoration to target paragraph
                editorStore.addAgentDecoration(targetNode.from, targetNode.to, 'awaiting_confirmation');

                // Add to chat history
                this.independentAgentChatHistory.push({
                  type: 'assistant',
                  text: `Used tool: modifyParagraph\nTarget: ${targetNode.nodeId}\nReasoning: ${toolResult.reasoning}`
                });
              }
            }
          }
        };

        await this.executeIndependentAgentPrompt(onOutput, fullFileContent);
      } catch (error) {
        this.confirmationWidgetData.isStreaming = false;
        this.clearProjectAgent();
        return;
      }

      const userChoice = await confirmationPromise;

      if (userChoice === 'accepted' && !this.confirmationWidgetData.isAgentStopped) {
        // Continue with the agent for next iteration
        await this.processIndependentAgent(agent);
      }
    },
    async executeIndependentAgentPrompt(onOutput, fullFileContent) {
      const promptStore = usePromptStore();

      try {
        this.confirmationWidgetData.isStreaming = true;

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

        if (onOutput) {
          newRequest.onOutput = onOutput;
        }

        debugger;

        const result = await promptStore.promptInternal2(newRequest);
        debugger;
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
      const { nodeId, newContent, reasoning } = args;

      if (!nodeId || !newContent || !reasoning) {
        return { error: "Missing required arguments for modifyParagraph" };
      }

      // Find the target paragraph
      const targetNode = this.findParagraphByNodeId(nodeId);
      if (!targetNode) {
        return { error: `Paragraph with ID ${nodeId} not found` };
      }

      return {
        success: true,
        action: 'modify',
        targetNode,
        newContent,
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
  },
});
