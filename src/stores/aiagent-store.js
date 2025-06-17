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

    projectAgentCurrentProcessingItem: null,
    projectAgentProcessing: false,
    projectAgentContext: [],
    projectAgentRequest: null,
    projectAgentSkippedParagraphs: new Set(), // Track skipped paragraph text content

    projectAgentAborted: false, // Global flag to abort all streaming
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
    createAgentRequest(baseRequest, agentMessages = [], options = {}) {
      const newRequest = cloneRequest(baseRequest);
      newRequest.silent = options.silent ?? true;
      newRequest.agentMessages = [...agentMessages];

      if (options.appendMessages) {
        newRequest.appendMessages = [...options.appendMessages];
      }

      if (options.text !== undefined) {
        newRequest.text = options.text;
      }

      if (options.contextTypes) {
        newRequest.contextTypes = options.contextTypes;
      }

      if (options.onOutput) {
        newRequest.onOutput = options.onOutput;
      }

      return newRequest;
    },
    checkAbortStatus(result) {
      return result.analysisByAgentAborted || this.projectAgentAborted;
    },
    updateAgentProgress(result, agent, message) {
      result.analysingByAgent = agent;
      result.analysingByAgentMessage = message;
    },
    createStreamingCallback(onStreamingUpdate, onFinished) {
      return (fullText, newText, isFinished, isError) => {
        if (this.projectAgentAborted) {
          return;
        }

        if (onStreamingUpdate) {
          onStreamingUpdate(fullText, newText, isFinished, isError);
        }

        if (isFinished && onFinished) {
          onFinished(fullText, isError);
        }
      };
    },
    async executeAgentPrompt(request, options = {}) {
      const promptStore = usePromptStore();

      try {
        const result = await promptStore.promptInternal2(request);
        return result;
      } catch (error) {
        if (options.onError) {
          options.onError(error);
        }
        throw error;
      }
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

            if (!this.projectAgentSkippedParagraphs.has(text.trim()) && instruction.length > 0) {
              nextItem = {
                node,
                pos,
                from,
                to,
                text: text.trim(),
                instruction,
                originalContent: text
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
    shouldAbortStreaming(streamingAborted) {
      return streamingAborted || this.projectAgentAborted;
    },
    async runCriticAgent(request, result, agent) {
      const promptStore = usePromptStore();
      const agentMessages = [];
      const maxIterations = agent.maxRuns ?? 5;

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        if (this.checkAbortStatus(result)) return;

        // CREATE INSTRUCTIONS
        this.updateAgentProgress(result, agent, `${agent.title}: Evaluating...`);

        const instructionMessages = [...agentMessages,
          { type: 'assistant', text: result.originalText },
          { type: 'user', text: agent.prompt }
        ];

        const instructionRequest = this.createAgentRequest(request, instructionMessages);
        const criticResult = await this.executeAgentPrompt(instructionRequest);

        if (this.checkAbortStatus(result)) return;

        // Check if critic approves content
        if (this.shouldIgnoreAgentResult(criticResult.originalText, agent)) {
          console.log('runCriticAgent content approved, stopping');
          this.updateAgentProgress(result, agent, `${agent.title}: Content approved, no changes needed.`);
          return;
        }

        // GENERATE NEW TEXT
        this.updateAgentProgress(result, agent, `${agent.title}: Iter ${iteration}/${maxIterations} - Working...`);

        agentMessages.push(
          { type: 'assistant', text: result.originalText },
          { type: 'user', text: criticResult.originalText }
        );

        const refinementRequest = this.createAgentRequest(request, agentMessages);
        const refinementResult = await this.executeAgentPrompt(refinementRequest);

        if (this.checkAbortStatus(result)) return;

        this.addPreviousAgentResult(result, agent);
        result.text = refinementResult.text;
        result.originalText = refinementResult.originalText;
        promptStore.calculateDiffs(request, result);
      }
    },
    async runRefinerAgent(request, result, agent) {
      const promptStore = usePromptStore();
      const agentMessages = [];
      const maxRuns = agent.allowMultipleRuns ? (agent.maxRuns ?? 1) : 1;

      for (let run = 1; run <= maxRuns; run++) {
        if (this.checkAbortStatus(result)) return;

        this.updateAgentProgress(result, agent, `${agent.title}: Run ${run}/${maxRuns} - Working...`);

        agentMessages.push(
          { type: 'assistant', text: result.originalText },
          { type: 'user', text: agent.prompt }
        );

        const agentRequest = this.createAgentRequest(request, agentMessages);
        const newResult = await this.executeAgentPrompt(agentRequest);

        if (this.checkAbortStatus(result)) return;

        if (this.shouldIgnoreAgentResult(newResult.originalText, agent)) {
          this.updateAgentProgress(result, agent, `${agent.title}: Content refined successfully (${run} runs).`);
          break;
        }

        this.addPreviousAgentResult(result, agent);
        result.text = newResult.text;
        result.originalText = newResult.originalText;
        promptStore.calculateDiffs(request, result);
      }
    },
    addPreviousAgentResult(result, agent) {
      if (!result.prevResults) {
        result.prevResults = [];
      }

      result.prevResults.push({
        title: 'Result before ' + agent.title,
        request: result.request,
        prompt: result.prompt,
        text: result.text,
        originalText: result.originalText,
        diff: result.diff ? [...result.diff] : undefined,
        meta: result.meta,
        type: result.type,
        waitingForResponse: result.waitingForResponse,
        contextTypes: result.contextTypes,
        parametersValue: result.parametersValue,
        userInputs: result.userInputs,
        collapsed: false,
      });
    },
    async runAgentsOnPromptResult(request, result) {
      const promptStore = usePromptStore();

      if (request.prompt.agents?.length > 0) {
        for(let agent of request.prompt.agents) {

          const agentDefinition = promptStore.promptAgents.find(a => a.id === agent.agentId);
          if(!agentDefinition) {
            continue;
          }

          result.analysingByAgent = agentDefinition;
          result.analysingByAgentMessage = `${agentDefinition.title} is analysing...`;

          try {
            if (agentDefinition.type === 'Refiner') {
              await this.runRefinerAgent(request, result, agentDefinition);
            } else if (agentDefinition.type === 'Critic') {
              await this.runCriticAgent(request, result, agentDefinition);
            }
          } finally {
            result.analysingByAgent = undefined;
            result.analysingByAgentMessage = undefined;
          }
        }
      }
    },
    shouldIgnoreAgentResult(resultText, agent) {
      const cleanResultText = (resultText ?? '').trim().toLowerCase().replace(/^["']|["']$/g, '');
      const cleanIgnoreText = (agent.ignoreResultText ?? 'OK').trim().toLowerCase();
      return cleanResultText === cleanIgnoreText;
    },
    async openProjectAgent(agent) {
      const promptStore = usePromptStore();

      promptStore.promptContext = [ currentFilePromptContext ];
      promptStore.promptParametersValue = [];
      promptStore.promptParametersShown = true;
      const request = {
        prompt: promptStore.prompts.find(p => p.id === agent.promptId),
        text: '',
        clear: false,
        agent: agent,
        promptTimes: 1,
      };

      promptStore.currentPromptConfirmationRequest = request;
    },
    async confirmProjectAgent(request) {
      const editorStore = useEditorStore();
      const promptStore = usePromptStore();

      const agent = request.agent;

      this.projectAgentContext = [...promptStore.promptContext];
      this.projectAgentProcessing = true;
      this.projectAgentRequest = cloneRequest(request);
      this.projectAgentAborted = false;

      editorStore.clearAllAgentDecorations();
      this.projectAgentSkippedParagraphs.clear();

      const editor = editorStore.editor;
      if (!editor) {
        this.projectAgentProcessing = false;
        return;
      }

      await this.processNextParagraph(agent);
    },
    async processNextParagraph(agent) {
      const nextItem = this.findNextParagraph(agent);
      if (!nextItem) {
        this.projectAgentProcessing = false;
        return;
      }

      const result = await this.runAgentOnParagraph(agent, nextItem);
      if (result === 'stopped' || result === 'error' || !this.projectAgentProcessing) {
        return;
      }

      await this.processNextParagraph(agent);
    },
    onWidgetAccept(data) {
      console.log('User accepted changes:', data);
      const editorStore = useEditorStore();

      this.confirmationWidgetData.streamingAborted = true;
      this.confirmationWidgetData.isStreaming = false;

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
        debugger;
        this.currentConfirmationPromise.resolve('accepted');
        this.currentConfirmationPromise = null;
      }
    },
    onWidgetReject(data) {
      const editorStore = useEditorStore();
      console.log('User skipped paragraph:', data);
      this.confirmationWidgetData.streamingAborted = true;
      this.confirmationWidgetData.isStreaming = false;

      this.projectAgentSkippedParagraphs.add(data.originalText);

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      this.confirmationWidgetData.hidden = true;

      this.manageParagraphDecoration(this.projectAgentCurrentProcessingItem, 'remove');

      debugger;

      if (this.currentConfirmationPromise) {
        debugger;
        this.currentConfirmationPromise.resolve('skipped');
        this.currentConfirmationPromise = null;
      }
    },
    async onWidgetChat(userFeedback) {
      this.confirmationWidgetData.conversationMessages.push({ type: 'assistant', text: this.confirmationWidgetData.aiSuggestion });
      this.confirmationWidgetData.conversationMessages.push({ type: 'user', text: userFeedback });

      this.confirmationWidgetData.streamingText = '';
      this.confirmationWidgetData.isStreaming = true;

      this.manageParagraphDecoration(this.projectAgentCurrentProcessingItem, 'streaming');

      try {
        const onOutput = (fullText, newText, isFinished, isError) => {
          if (this.confirmationWidgetData.streamingAborted || this.projectAgentAborted) {
            console.log('Chat streaming aborted by user action');
            return;
          }

          this.confirmationWidgetData.streamingText = fullText;

          if (isFinished) {
            this.confirmationWidgetData.isStreaming = false;
            if (!isError && !this.shouldAbortStreaming(this.confirmationWidgetData.streamingAborted)) {
              this.confirmationWidgetData.aiSuggestion = fullText;
              this.manageParagraphDecoration(this.projectAgentCurrentProcessingItem, 'awaiting_confirmation');
            }
          }
        };

        this.confirmationWidgetData.aiResult = await this.executeProjectAgentPrompt(onOutput);

      } catch (error) {
        this.confirmationWidgetData.isStreaming = false;
      }
    },
    onWidgetUndo() {
      this.confirmationWidgetData.streamingAborted = true;
      this.confirmationWidgetData.isStreaming = false;

      this.confirmationWidgetData.aiSuggestion = this.confirmationWidgetData.originalAiSuggestion;
      this.confirmationWidgetData.conversationMessages = [];
      this.confirmationWidgetData.streamingAborted = false;

      this.manageParagraphDecoration(this.projectAgentCurrentProcessingItem, 'awaiting_confirmation');
    },
    async executeProjectAgentPrompt(onOutput) {
      const promptStore = usePromptStore();
      const editorStore = useEditorStore();

      try {
        const newRequest = cloneRequest(this.projectAgentRequest);
        newRequest.silent = true;
        newRequest.text = this.projectAgentCurrentProcessingItem.instruction;

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
        editorStore.removeAgentDecoration(this.projectAgentCurrentProcessingItem.from, this.projectAgentCurrentProcessingItem.to);
        this.projectAgentProcessing = false;
        this.projectAgentSkippedParagraphs.clear();

        throw error;
      }
    },
    async runAgentOnParagraph(agent, item) {
      const editorStore = useEditorStore();

      this.projectAgentCurrentProcessingItem = item;

      let conversationMessages = [];

      editorStore.updateAgentDecoration(item.from, item.to, 'processing');

      this.confirmationWidgetData = {
        agentTitle: agent.title,
        paragraphRange: { from: item.from, to: item.to },

        originalText: item.text,
        originalAiSuggestion: '',

        streamingText: '',
        isStreaming: true,
        chatLoading: false,
        streamingAborted: false,
        aiSuggestion: '',

        aiResult: null,
        conversationMessages: conversationMessages,
      };

      let promiseResolve;
      const confirmationPromise = new Promise((resolve) => {
        promiseResolve = resolve;
      });
      this.currentConfirmationPromise = { resolve: promiseResolve };

      try {
        let ignored = false;

        const onInitialOutput = (fullText, newText, isFinished, isError) => {
          if (this.confirmationWidgetData.streamingAborted || this.projectAgentAborted || ignored) {
            return;
          }

          this.confirmationWidgetData.streamingText = fullText;

          if (isFinished) {
            this.confirmationWidgetData.isStreaming = false;
            if (!isError && !this.shouldAbortStreaming(this.confirmationWidgetData.streamingAborted)) {
              this.confirmationWidgetData.aiSuggestion = fullText;

              if (!this.confirmationWidgetData.originalAiSuggestion) {
                this.confirmationWidgetData.originalAiSuggestion = fullText;
              }

              if (this.shouldIgnoreAgentResult(this.confirmationWidgetData.aiSuggestion, agent)) {
                console.log(`Agent result matches ignore text "${agent.ignoreResultText || 'OK'}", auto-skipping paragraph`);

                this.projectAgentSkippedParagraphs.add(item.text);
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
        this.confirmationWidgetData.aiResult = await this.executeProjectAgentPrompt(onInitialOutput);
      } catch (error) {
        this.confirmationWidgetData.isStreaming = false;
        return 'error';
      }

      const userChoice = await confirmationPromise;

      return userChoice;
    },
    stopAgentProcessing() {
      const editorStore = useEditorStore();

      this.projectAgentAborted = true;

      if(editorStore.editor) {
        editorStore.editor.commands.blur();
      }

      if (this.currentConfirmationPromise) {
        debugger;
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
      }

      if (this.projectAgentCurrentProcessingItem) {
        editorStore.removeAgentDecoration(this.projectAgentCurrentProcessingItem.from, this.projectAgentCurrentProcessingItem.to);
      }

      this.projectAgentCurrentProcessingItem = null;
      this.projectAgentProcessing = false;

      // Clean up remaining state
      this.projectAgentSkippedParagraphs.clear();
    }
  }
});
