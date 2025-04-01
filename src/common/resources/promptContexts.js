
export const currentFilePromptContext = {id: 'Current File', contextType: 'Current File', parameters: {}, label: 'Current File', color: 'yellow', description: 'All text from the current file'};
export const currentAndChildrenFilePromptContext = {id: 'Current & Children Files', contextType: 'Current & Children Files', parameters: {}, label: 'Current & Children Files', color: 'orange', description: 'All text from the current file and its children.'};

export const selectedTextPromptContext = {id: 'Selected Text', contextType: 'Selected Text', parameters: {}, label: 'Selected Text', color: 'green', description: 'Selected text in the current file'};

export const previousCharactersPromptContext = {id: 'Previous Text', contextType: 'Previous Text', parameters: 2000, label: 'Previous Text', color: 'cyan', description: '2000 characters preceding your selected text'};

export const currentFileSummaryPromptContext = {id: 'Current File Summary', contextType: 'Current File Summary', parameters: {}, label: 'Current File (summary)', color: 'lime', description: 'Summary of the current file'};
export const currentAndChildrenFileSummaryPromptContext = {id: 'Current & Children File Summary', contextType: 'Current & Children File Summary', parameters: {}, label: 'Current & Children File (summaries)', color: 'orange', description: 'Summaries of the current file and its children'};

export const allPromptContexts = [currentFilePromptContext, selectedTextPromptContext, previousCharactersPromptContext, currentFileSummaryPromptContext];
