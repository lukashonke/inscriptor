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
    autonomousAgentProcessing: false,
    autonomousAgentContext: [],
    autonomousAgentRequest: null,
    currentConfirmationPromise: null,
    currentProcessingItem: null,
    skippedParagraphs: new Set(), // Track skipped paragraph text content
    globalStreamingAborted: false, // Global flag to abort all streaming
  }),
  getters: {
    agentState: (state) => {
      if (!state.autonomousAgentProcessing) {
        return 'idle';
      }
      if (state.currentConfirmationPromise) {
        return 'waiting_for_user';
      }
      return 'processing';
    },
    isAgentActive: (state) => state.autonomousAgentProcessing,
  },
  actions: {
    async runCriticAgent(request, result, agent) {
      const promptStore = usePromptStore();

      const agentMessages = [];
      let iterations = 0;
      const maxIterations = agent.maxRuns ?? 5;

      // Keep applying follow-up instructions until stop word is reached or max iterations
      while (iterations < maxIterations) {
        iterations++;

        if(result.analysisByAgentAborted) {
          return;
        }

        // CREATE INSTRUCTIONS:
        result.analysingByAgentMessage = `${agent.title}: Evaluating...`;

        let newRequest = cloneRequest(request);
        newRequest.silent = true;
        newRequest.agentMessages = [...agentMessages];

        newRequest.agentMessages.push({ type: 'assistant', text: result.originalText });
        newRequest.agentMessages.push({ type: 'user', text: agent.prompt });

        let criticResult = await promptStore.promptInternal2(newRequest);

        if(result.analysisByAgentAborted) {
          return;
        }

        // If the critic says to ignore (result is OK), stop execution
        if (this.shouldIgnoreAgentResult(criticResult.originalText, agent)) {
          console.log('runCriticAgent content approved, stopping');
          result.analysingByAgentMessage = `${agent.title}: Content approved, no changes needed.`;
          return; // No further action needed
        }

        const followUpInstruction = criticResult.originalText;


        // GENERATE NEW TEXT:
        result.analysingByAgentMessage = `${agent.title}: Iter ${iterations}/${maxIterations} - Working...`;
        // Create new request with original result and current follow-up instruction
        newRequest = cloneRequest(request);
        newRequest.silent = true;

        agentMessages.push({ type: 'assistant', text: result.originalText });
        agentMessages.push({ type: 'user', text: followUpInstruction });

        newRequest.agentMessages = agentMessages;

        const refinementResult = await promptStore.promptInternal2(newRequest);

        if (result.analysisByAgentAborted) {
          return;
        }

        this.addPreviousAgentResult(result, agent);

        // Update the result with the refined content
        result.text = refinementResult.text;
        result.originalText = refinementResult.originalText;

        promptStore.calculateDiffs(request, result);
      }
    },
    async runRefinerAgent(request, result, agent) {
      const promptStore = usePromptStore();

      const agentMessages = [];
      const maxRuns = agent.allowMultipleRuns ? (agent.maxRuns ?? 1) : 1;

      for (let run = 0; run < maxRuns; run++) {
        if(result.analysisByAgentAborted) {
          return;
        }

        result.analysingByAgentMessage = `${agent.title}: Run ${run + 1}/${maxRuns} - Working...`;

        const newRequest = cloneRequest(request);
        newRequest.silent = true;

        agentMessages.push({ type: 'assistant', text: result.originalText });
        agentMessages.push({ type: 'user', text: agent.prompt });

        newRequest.agentMessages = agentMessages;

        const newResult = await promptStore.promptInternal2(newRequest);

        if (result.analysisByAgentAborted) {
          return;
        }

        if (this.shouldIgnoreAgentResult(newResult.originalText, agent)) {
          result.analysingByAgentMessage = `${agent.title}: Content refined successfully (${run + 1} runs).`;
          // already good, break
          break;
        } else {
          this.addPreviousAgentResult(result, agent);

          // change the result
          result.text = newResult.text;
          result.originalText = newResult.originalText;

          promptStore.calculateDiffs(request, result);
        }
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
      const agent = request.agent;
      const editorStore = useEditorStore();
      const promptStore = usePromptStore();

      this.autonomousAgentContext = [...promptStore.promptContext];
      this.autonomousAgentProcessing = true;
      this.autonomousAgentRequest = cloneRequest(request);
      this.globalStreamingAborted = false; // Reset global abort flag

      editorStore.clearAllAgentDecorations();
      this.skippedParagraphs.clear();

      // Get the editor instance
      const editor = editorStore.editor;
      if (!editor) {
        console.log('No editor instance found');
        this.autonomousAgentProcessing = false;
        return [];
      }

      const doc = editor.state.doc;
      const toProcess = [];

      // Find all paragraphs starting with search prefix
      doc.nodesBetween(0, doc.content.size, (node, pos, parent, index) => {
        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\n', '\n');

          // Check if paragraph starts with search prefix
          if (text.trim().startsWith(agent.searchPrefix) && text.trim().length > agent.searchPrefix.length) {
            const instruction = text.trim().substring(agent.searchPrefix.length).trim();

            if (instruction.length > 0) {
              toProcess.push({
                node: node,
                pos: pos,
                from: from,
                to: to,
                text: text.trim(),
                instruction: instruction,
                originalContent: text
              });
            }
          }
        }
      });

      console.log(`Found ${toProcess.length} paragraphs to process with agent: ${agent.title}`);

      if (toProcess.length === 0) {
        this.autonomousAgentProcessing = false;
        return;
      }

      // Start processing paragraphs one by one (dynamically find next)
      await this.processNextParagraph(agent);
    },
    async runAgentOnParagraph(agent, item) {
      const editorStore = useEditorStore();
      const promptStore = usePromptStore();

      this.currentProcessingItem = item;

      // Track conversation history for this paragraph
      let conversationMessages = [];

      // Mark paragraph as pending
      console.log(`Marking paragraph as pending: ${item.from}-${item.to}`, item.text);
      editorStore.addAgentDecoration(item.from, item.to, 'pending');

      // Update to processing
      await new Promise(resolve => setTimeout(resolve, 500));
      editorStore.updateAgentDecoration(item.from, item.to, 'processing');

      // Function to execute AI prompt with current conversation
      const executeAiPrompt = async (onOutput = null) => {
        try {
          // Clone the autonomous agent request and prepare for prompt execution
          const newRequest = cloneRequest(this.autonomousAgentRequest);
          newRequest.silent = true;
          newRequest.text = item.instruction;

          // Set the prompt context from saved agent context
          newRequest.contextTypes = this.autonomousAgentContext;

          // Add conversation history if exists
          if (conversationMessages.length > 0) {
            newRequest.appendMessages = [...conversationMessages];
          }

          // Add streaming callback if provided
          if (onOutput) {
            newRequest.onOutput = onOutput;
          }

          console.log(`Executing AI agent prompt for: "${item.instruction.substring(0, 50)}..."`);

          // Execute the prompt
          const result = await promptStore.promptMultiple2(newRequest);
          return result.originalText;

        } catch (error) {
          console.error('Error executing AI agent prompt:', error);

          // Stop processing on failure
          editorStore.removeAgentDecoration(item.from, item.to);
          this.autonomousAgentProcessing = false;
          this.skippedParagraphs.clear();

          // Show error to user (optional)
          console.log(`Agent processing stopped due to error: ${error.message || error}`);

          throw error;
        }
      };

      // Set editor selection to the target paragraph for BubbleMenu positioning
      // Select the first few characters of the paragraph content to create a valid text selection
      const paragraphContentStart = item.from + 1; // Skip the paragraph opening tag
      const paragraphContentEnd = Math.min(paragraphContentStart + 10, item.to - 1); // Select first 10 chars, don't include closing tag

      editorStore.editor.commands.setTextSelection({
        from: paragraphContentStart,
        to: paragraphContentEnd
      });

      // Streaming state for widget
      let streamingText = '';
      let isStreaming = true; // Start with streaming for initial processing
      let aiSuggestion = '';
      let streamingAborted = false; // Flag to stop streaming when user takes action

      // Small delay to ensure selection is processed before showing widget
      await new Promise(resolve => setTimeout(resolve, 100));

      // Show confirmation widget
      const showWidget = () => {
        editorStore.showConfirmationWidget({
          agentTitle: agent.title,
          originalText: item.text,
          suggestedText: aiSuggestion,
          paragraphRange: { from: item.from, to: item.to },
          streamingText: streamingText,
          isStreaming: isStreaming,
          onAccept: (data) => {
            console.log('User accepted changes:', data);

            // Stop any ongoing streaming
            streamingAborted = true;
            isStreaming = false;

            // Apply the suggested text to the editor
            const { from, to } = data.paragraphRange;
            const { suggestedText } = data;

            // Remove the existing decoration first
            editorStore.removeAgentDecoration(from, to);

            // Use Tiptap command to replace the paragraph content
            const result = editorStore.editor
              .chain()
              .focus()
              .command(({ tr, state }) => {
                // Replace the content at the specified range
                tr.replaceWith(from, to, state.schema.text(suggestedText));
                return true;
              })
              .run();

            // Calculate new range after replacement (text length might have changed)
            const lengthDiff = suggestedText.length - (to - from);
            const newTo = to + lengthDiff;

            // Remove the decoration since text was replaced
            // (No need to add completion decoration - the replacement is the completion)

            // Hide confirmation widget
            editorStore.hideConfirmationWidget();

            // Clear selection
            editorStore.editor.commands.blur();

            // Resolve the confirmation promise to continue processing
            if (this.currentConfirmationPromise) {
              this.currentConfirmationPromise.resolve('accepted');
              this.currentConfirmationPromise = null;
            }
          },
          onReject: (data) => {
            console.log('User skipped paragraph:', data);

            // Stop any ongoing streaming
            streamingAborted = true;
            isStreaming = false;

            // Add this paragraph to skipped set
            this.skippedParagraphs.add(data.originalText);

            // Remove decoration and hide widget
            editorStore.removeAgentDecoration(item.from, item.to);
            editorStore.hideConfirmationWidget();

            // Clear selection
            editorStore.editor.commands.blur();

            // Resolve the confirmation promise to continue processing
            if (this.currentConfirmationPromise) {
              this.currentConfirmationPromise.resolve('skipped');
              this.currentConfirmationPromise = null;
            }
          },
          onChat: async (userFeedback) => {
            console.log('User provided feedback:', userFeedback);

            // Add current AI suggestion as assistant message
            conversationMessages.push({ type: 'assistant', text: aiSuggestion });
            // Add user feedback as user message
            conversationMessages.push({ type: 'user', text: userFeedback });

            // Reset streaming state
            streamingText = '';
            isStreaming = true;

            // Update to streaming state and show streaming widget
            editorStore.updateAgentDecoration(item.from, item.to, 'streaming');
            showWidget();

            try {
              // Create streaming callback
              const onOutput = (fullText, newText, isFinished, isError) => {
                // Check if streaming was aborted locally or globally
                if (streamingAborted || this.globalStreamingAborted) {
                  console.log('Chat streaming aborted by user action');
                  return;
                }

                streamingText = fullText;

                if (isFinished) {
                  isStreaming = false;
                  if (!isError && !streamingAborted && !this.globalStreamingAborted) {
                    aiSuggestion = fullText;
                    console.log(`AI agent updated suggestion: "${aiSuggestion.substring(0, 100)}..."`);
                    // Update back to awaiting confirmation
                    editorStore.updateAgentDecoration(item.from, item.to, 'awaiting_confirmation');
                  }
                }

                // Refresh widget with updated streaming text only if not aborted
                if (!streamingAborted && !this.globalStreamingAborted) {
                  showWidget();
                }
              };

              // Re-execute AI prompt with streaming
              await executeAiPrompt(onOutput);

            } catch (error) {
              // Handle error - will stop processing via executeAiPrompt
              isStreaming = false;
              return;
            }
          }
        });
      };

      showWidget();

      // Execute initial AI prompt with streaming
      try {
        // Create streaming callback for initial processing
        const onInitialOutput = (fullText, newText, isFinished, isError) => {
          // Check if streaming was aborted locally or globally
          if (streamingAborted || this.globalStreamingAborted) {
            console.log('Initial streaming aborted by user action');
            return;
          }

          streamingText = fullText;

          if (isFinished) {
            isStreaming = false;
            if (!isError && !streamingAborted && !this.globalStreamingAborted) {
              aiSuggestion = fullText;
              console.log(`AI agent generated suggestion: "${aiSuggestion.substring(0, 100)}..."`);
              
              // Check if agent result should be ignored (auto-skip)
              if (this.shouldIgnoreAgentResult(aiSuggestion, agent)) {
                console.log(`Agent result matches ignore text "${agent.ignoreResultText || 'OK'}", auto-skipping paragraph`);
                
                // Add to skipped paragraphs and clean up
                this.skippedParagraphs.add(item.text);
                editorStore.removeAgentDecoration(item.from, item.to);
                editorStore.hideConfirmationWidget();
                
                // Auto-resolve as skipped
                if (this.currentConfirmationPromise) {
                  this.currentConfirmationPromise.resolve('skipped');
                  this.currentConfirmationPromise = null;
                }
                return;
              }
              
              // Update to awaiting confirmation
              editorStore.updateAgentDecoration(item.from, item.to, 'awaiting_confirmation');
            }
          }

          // Refresh widget with updated streaming text only if not aborted
          if (!streamingAborted && !this.globalStreamingAborted) {
            showWidget();
          }
        };

        // Execute AI prompt with streaming
        await executeAiPrompt(onInitialOutput);

      } catch (error) {
        // Handle error - will stop processing via executeAiPrompt
        isStreaming = false;
        return 'error';
      }

      console.log(`Paragraph awaiting confirmation: ${item.from}-${item.to}`);

      // Create a promise that will be resolved when user makes a choice
      const confirmationPromise = new Promise((resolve) => {
        this.currentConfirmationPromise = { resolve };
      });

      // Wait for user confirmation
      const userChoice = await confirmationPromise;
      console.log(`User choice: ${userChoice} for paragraph ${item.from}-${item.to}`);

      return userChoice;
    },
    async processNextParagraph(agent) {
      const editorStore = useEditorStore();

      // Get the editor instance
      const editor = editorStore.editor;
      if (!editor) {
        console.log('No editor instance found');
        this.autonomousAgentProcessing = false;
        return;
      }

      // Dynamically find the next paragraph to process
      const doc = editor.state.doc;
      let nextItem = null;

      doc.nodesBetween(0, doc.content.size, (node, pos, parent, index) => {
        if (nextItem) return false; // Stop if we found one

        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\\n', '\\n');

          // Check if paragraph starts with search prefix and hasn't been processed or skipped
          if (text.trim().startsWith(agent.searchPrefix) && text.trim().length > agent.searchPrefix.length) {
            const instruction = text.trim().substring(agent.searchPrefix.length).trim();

            // Skip if this paragraph was previously skipped
            if (!this.skippedParagraphs.has(text.trim()) && instruction.length > 0) {
              nextItem = {
                node: node,
                pos: pos,
                from: from,
                to: to,
                text: text.trim(),
                instruction: instruction,
                originalContent: text
              };
            }
          }
        }
      });

      if (!nextItem) {
        // No more paragraphs to process
        this.autonomousAgentProcessing = false;
        console.log(`Project agent ${agent.title} completed processing`);
        return;
      }

      console.log(`Processing next paragraph: ${nextItem.text.substring(0, 50)}...`);

      // Process the current paragraph and wait for user confirmation
      const userChoice = await this.runAgentOnParagraph(agent, nextItem);

      // Check if agent was stopped or failed before continuing
      if (userChoice === 'stopped' || userChoice === 'error' || !this.autonomousAgentProcessing) {
        console.log('Agent processing stopped, not continuing to next paragraph');
        return;
      }

      // Process the next paragraph
      await this.processNextParagraph(agent);
    },
    stopAgentProcessing() {
      console.log('Agent processing stop requested by user');

      const editorStore = useEditorStore();

      // Abort all streaming immediately
      this.globalStreamingAborted = true;

      // Clear confirmation promise to stop processing
      if (this.currentConfirmationPromise) {
        this.currentConfirmationPromise.resolve('stopped');
        this.currentConfirmationPromise = null;
      }

      if (this.currentProcessingItem) {
        editorStore.removeAgentDecoration(this.currentProcessingItem.from, this.currentProcessingItem.to);
      }

      // Clear current processing item
      this.currentProcessingItem = null;

      // Update reactive state to hide UI elements and stop processing
      this.autonomousAgentProcessing = false;

      // Clean up remaining state
      this.skippedParagraphs.clear();

      console.log('Agent processing stopped - use Skip button to remove current paragraph highlight');
    }
  }
});
