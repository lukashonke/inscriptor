import {allPromptContexts} from 'src/common/resources/promptContexts';
import {useFileStore} from 'stores/file-store';
import {usePromptStore} from 'stores/prompt-store';

export function transformContextIdsToContextObjects(contextIds) {
  const fileStore = useFileStore();
  const promptStore = usePromptStore();

  const contextTypes = [];
  if (contextIds && contextIds.length > 0) {
    for (const contextId of contextIds) {
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

  return contextTypes;
}
