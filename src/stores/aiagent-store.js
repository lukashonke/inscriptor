import { defineStore } from 'pinia';
import {
  cloneRequest,
} from "src/common/helpers/promptHelper";
import {usePromptStore} from 'stores/prompt-store';

export const useAiAgentStore = defineStore('ai-agent', {
  state: () => ({
  }),
  getters: {
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
    async runAutonomousAgent(request) {

      // Import editor utils to work with nodes
      const { getEditor, editorTextBetween } = await import('src/common/utils/editorUtils');

      // Get the editor instance
      const editor = getEditor();
      if (!editor) {
        console.log('No editor instance found');
        this.autonomousAgentProcessing = false;
        return [];
      }

      const doc = editor.state.doc;
      const commentNodes = [];

      // Find all paragraphs starting with "//"
      doc.nodesBetween(0, doc.content.size, (node, pos, parent, index) => {
        if (node.type.name === 'paragraph') {
          const from = pos;
          const to = pos + node.nodeSize;
          const text = editorTextBetween(doc, { from, to }, '\n', '\n');

          // Check if paragraph starts with "//"
          if (text.trim().startsWith('//') && text.trim().length > 2) {
            const instruction = text.trim().substring(2).trim();

            if (instruction.length > 0) {
              commentNodes.push({
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

    },
  }
});
