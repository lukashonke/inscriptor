/**
 * User-friendly display names for AI agent tool calls
 * Maps technical tool names to readable descriptions
 */
export const toolFriendlyNames = {
  // Inscriptor-specific tools
  'stop': 'Stop Processing',
  'getCurrentDocument': 'Get Current Document',
  'getAvailableAIPrompts': 'Get Available AI Prompts',
  'executeAIPrompt': 'Execute AI Prompt',
  'listProjectFiles': 'List Project Files',
  'readFile': 'Read File',
  'search': 'Search Project Files',
  'setFileSummary': 'Set File Summary',
  'getAllContextTypes': 'Get Available Context Types',
  'createFile': 'Create New File',
  'modifyParagraph': 'Modify Paragraph',
  'editDocument': 'Edit Document',

  // Common system tools (LangChain/Claude Code)
  'ls': 'List Files',
  'cd': 'Change Directory',
  'grep': 'Search Content',
  'cat': 'View File',
  'bash': 'Run Command',
  'file_str_replace': 'Edit File',
  'write_file': 'Write File',
  'read_file': 'Read File',
  'list_dir': 'List Directory',
  'tavily_search': 'Web Search',
  'web_search': 'Web Search',
  'find': 'Find Files',
  'sed': 'Edit Text',
  'awk': 'Process Text',
  'mkdir': 'Create Directory',
  'mv': 'Move File',
  'cp': 'Copy File',
  'rm': 'Remove File',
};

/**
 * Get user-friendly display name for a tool
 * @param {string} toolName - Technical tool name
 * @returns {string} User-friendly display name, or original name if not mapped
 */
export function getFriendlyToolName(toolName) {
  return toolFriendlyNames[toolName] || toolName;
}
