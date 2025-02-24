
export const currentFilePromptContext = {id: 'Current File', contextType: 'Current File', parameters: {}, label: 'Current File', color: 'yellow', description: 'All text from the current file'};
export const selectedTextPromptContext = {id: 'Selected Text', contextType: 'Selected Text', parameters: {}, label: 'Selected Text', color: 'green', description: 'Selected text in the current file'};

export const previousCharactersPromptContext = {id: 'Previous Text', contextType: 'Previous Text', parameters: 2000, label: 'Previous Text', color: 'cyan', description: '2000 characters preceding your selected text'};

export const currentFileSummaryPromptContext = {id: 'Current File Summary', contextType: 'Current File Summary', parameters: {}, label: 'Current File (summary)', color: 'lime', description: 'Summary of the current file'};

export const allPromptContexts = [currentFilePromptContext, selectedTextPromptContext, previousCharactersPromptContext, currentFileSummaryPromptContext];
