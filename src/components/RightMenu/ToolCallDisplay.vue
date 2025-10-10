<template>
  <div class="tool-call-display" :class="{ 'pending-approval': isPending }">
    <q-card flat bordered class="">
      <q-card-section class="q-pa-sm">
        <div class="row items-center q-gutter-x-sm">
          <div class="col-auto">
            <q-icon :name="toolIcon" :color="toolColor" size="xs" />
          </div>
          <div class="col-auto">
            <span class="text-caption">{{ toolName }}</span>
          </div>
          <div class="col">
            <q-space />
          </div>

          <!-- Approval controls (only show when pending) -->
          <template v-if="isPending">
            <div class="col-auto">
              <q-btn
                flat
                dense
                round
                :icon="isSelected ? 'mdi-close' : 'mdi-check'"
                :color="isSelected ? 'negative' : 'positive'"
                size="sm"
                @click="toggleSelection()"
              >
                <q-tooltip v-if="isSelected">Skip execution of this tool</q-tooltip>
                <q-tooltip v-if="!isSelected">Approve and execute this tool</q-tooltip>
              </q-btn>
            </div>
          </template>

          <div class="col-auto">
            <q-btn
              flat
              dense
              round
              :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="expanded = !expanded"
              size="sm"
            />
          </div>
        </div>

        <q-slide-transition>
          <div v-show="expanded" class="q-mt-sm">
            <!-- Special diff rendering for editDocument -->
            <div v-if="isEditDocument && editDocumentDiff" class="edit-document-diff row">
              <!-- Before section -->
              <div class="diff-section q-mb-sm">
                <div class="diff-section-header bg-red-1 q-pa-xs">
                  <span class="text-caption text-weight-bold">Before:</span>
                </div>
                <div class="diff-content bg-grey-1">
                  <div
                    v-for="(part, index) in beforeDiffParts"
                    :key="'before-' + index"
                    class="diff-part"
                    :class="{
                      'diff-removed': part.removed
                    }"
                  >{{ part.value }}</div>
                </div>
              </div>

              <!-- After section -->
              <div class="diff-section">
                <div class="diff-section-header bg-green-1 q-pa-xs">
                  <span class="text-caption text-weight-bold">After:</span>
                </div>
                <div class="diff-content bg-grey-1">
                  <div
                    v-for="(part, index) in afterDiffParts"
                    :key="'after-' + index"
                    class="diff-part"
                    :class="{
                      'diff-added': part.added
                    }"
                  >{{ part.value }}</div>
                </div>
              </div>
            </div>

            <!-- Regular parameters for non-editDocument tools -->
            <div v-if="hasParameters && !editDocumentDiff" class="tool-parameters q-pa-sm bg-grey-2 rounded-borders">
              <div class="text-caption text-grey-8 q-mb-xs">Parameters:</div>
              <pre class="tool-params-pre">{{ formattedArguments }}</pre>
            </div>

            <div v-if="hasToolResult" class="tool-result q-mt-sm q-pa-sm rounded-borders" :class="resultStatusClass">
              <div class="text-caption text-grey-8 q-mb-xs flex items-center">
                <q-icon :name="resultStatusIcon" :color="resultStatusColor" size="xs" class="q-mr-xs" />
                Result:
              </div>
              <div class="tool-result-content">
                <pre class="result-pre">{{ truncatedResult }}</pre>
                <div v-if="isResultLong" class="q-mt-xs">
                  <q-btn
                    flat
                    dense
                    size="sm"
                    :label="resultExpanded ? 'Show less' : 'Show more'"
                    @click="resultExpanded = !resultExpanded"
                    color="primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { truncate, diffStrings, htmlToMarkdown } from 'src/common/utils/textUtils';
import { useFileStore } from 'src/stores/file-store';
import { usePromptStore } from 'src/stores/prompt-store';
import { useAiAgentStore } from 'src/stores/aiagent-store';

const props = defineProps({
  toolCall: {
    type: Object,
    required: true
  },
  toolResult: {
    type: String,
    default: null
  },
  isPending: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  }
});

const fileStore = useFileStore();
const promptStore = usePromptStore();
const aiAgentStore = useAiAgentStore();

const expanded = ref(false);
const resultExpanded = ref(false);
const maxResultLength = 500;

const toolFriendlyNames = {
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
};

const toolName = computed(() => {
  const technicalName = props.toolCall?.function?.name;
  const prefix = 'AI wants to:';

  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');

    // Special handling for different tools to show specific details
    switch (technicalName) {
      case 'modifyParagraph':
        const action = args.action || 'modify';
        const position = args.position;
        switch (action) {
          case 'add':
            return position ? `${prefix} Add Paragraph (${position})` : `${prefix} Add Paragraph`;
          case 'remove':
            return `${prefix} Remove Paragraph`;
          case 'modify':
          default:
            return `${prefix} Modify Paragraph`;
        }

      case 'readFile':
        const readType = args.readType || 'full';
        const fileId = args.fileId;
        if (fileId) {
          const file = fileStore.getFile(fileId);
          const fileTitle = file?.title || `${fileId.substring(0, 8)}...`;
          return `${prefix} Read File - ${fileTitle} (${readType})`;
        }
        return `${prefix} Read File (${readType})`;

      case 'search':
        const searchQuery = args.searchQuery;
        const contextType = args.contextType;
        const searchType = args.searchType || 'all';
        let searchDesc = `${prefix} Search`;
        if (searchQuery) {
          searchDesc += ` - "${searchQuery}"`;
        }
        if (contextType) {
          searchDesc += ` in ${contextType}`;
        }
        if (searchType !== 'all') {
          searchDesc += ` (${searchType})`;
        }
        return searchDesc;

      case 'executeAIPrompt':
        const promptId = args.promptId;
        if (promptId) {
          const prompt = promptStore.prompts.find(p => p.id === promptId);
          const promptTitle = prompt?.title || promptId;
          return `${prefix} Execute AI Prompt - ${promptTitle}`;
        }
        return `${prefix} Execute AI Prompt`;

      case 'setFileSummary':
        const summaryFileId = args.fileId;
        if (summaryFileId) {
          const file = fileStore.getFile(summaryFileId);
          const fileTitle = file?.title || `${summaryFileId.substring(0, 8)}...`;
          return `${prefix} Set File Summary - ${fileTitle}`;
        }
        return `${prefix} Set File Summary (current file)`;

      case 'listProjectFiles':
        const listContextType = args.contextType;
        if (listContextType) {
          return `${prefix} List Project Files - ${listContextType}`;
        }
        return `${prefix} List Project Files`;

      case 'createFile':
        const title = args.title;
        const createContextType = args.contextType;
        let createDesc = `${prefix} Create File`;
        if (title) {
          createDesc += ` - "${title}"`;
        }
        if (createContextType) {
          createDesc += ` (${createContextType})`;
        }
        return createDesc;

      case 'editDocument':
        const editFileId = args.fileId;
        if (editFileId) {
          const file = fileStore.getFile(editFileId);
          const fileTitle = file?.title || `${editFileId.substring(0, 8)}...`;
          return `${prefix} Edit Document - ${fileTitle}`;
        }
        return `${prefix} Edit Document (current file)`;

      default:
        break;
    }
  } catch (e) {
    // If parsing fails, fall back to basic name
  }

  const baseName = toolFriendlyNames[technicalName] || technicalName || 'Unknown Tool';
  return `${prefix} ${baseName}`;
});

const toolIcon = computed(() => {
  const technicalName = props.toolCall?.function?.name;

  // Special handling for modifyParagraph to show specific action icons
  if (technicalName === 'modifyParagraph') {
    try {
      const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
      const action = args.action || 'modify'; // Default to 'modify' if no action specified

      switch (action) {
        case 'add':
          return 'mdi-plus';
        case 'remove':
          return 'mdi-delete';
        case 'modify':
        default:
          return 'mdi-pencil';
      }
    } catch (e) {
      return 'mdi-pencil';
    }
  } else if (technicalName === 'stop') {
    return 'mdi-stop';
  } else if (technicalName === 'getCurrentDocument') {
    return 'mdi-file-document-outline';
  } else if (technicalName === 'getAvailableAIPrompts') {
    return 'mdi-format-list-bulleted';
  } else if (technicalName === 'executeAIPrompt') {
    return 'mdi-play-circle-outline';
  } else if (technicalName === 'listProjectFiles') {
    return 'mdi-folder-open-outline';
  } else if (technicalName === 'readFile') {
    return 'mdi-file-search-outline';
  } else if (technicalName === 'search') {
    return 'mdi-magnify';
  } else if (technicalName === 'setFileSummary') {
    return 'mdi-file-edit-outline';
  } else if (technicalName === 'getAllContextTypes') {
    return 'mdi-tag-multiple-outline';
  } else if (technicalName === 'createFile') {
    return 'mdi-file-plus-outline';
  } else if (technicalName === 'editDocument') {
    return 'mdi-file-edit';
  }
  return 'mdi-tools';
});

const toolColor = computed(() => {
  const technicalName = props.toolCall?.function?.name;

  // Special handling for modifyParagraph to show specific action colors
  if (technicalName === 'modifyParagraph') {
    try {
      const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
      const action = args.action || 'modify'; // Default to 'modify' if no action specified

      switch (action) {
        case 'add':
          return 'green';
        case 'remove':
          return 'red';
        case 'modify':
        default:
          return 'primary';
      }
    } catch (e) {
      return 'primary';
    }
  } else if (technicalName === 'stop') {
    return 'red';
  } else if (technicalName === 'getCurrentDocument') {
    return 'blue';
  } else if (technicalName === 'getAvailableAIPrompts') {
    return 'purple';
  } else if (technicalName === 'executeAIPrompt') {
    return 'green';
  } else if (technicalName === 'listProjectFiles') {
    return 'orange';
  } else if (technicalName === 'readFile') {
    return 'teal';
  } else if (technicalName === 'search') {
    return 'indigo';
  } else if (technicalName === 'setFileSummary') {
    return 'amber';
  } else if (technicalName === 'getAllContextTypes') {
    return 'pink';
  } else if (technicalName === 'createFile') {
    return 'cyan';
  } else if (technicalName === 'editDocument') {
    return 'orange';
  }
  return 'grey';
});

const formattedArguments = computed(() => {
  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
    return JSON.stringify(args, null, 2);
  } catch (e) {
    return props.toolCall?.function?.arguments || '';
  }
});

const hasParameters = computed(() => {
  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
    return Object.keys(args).length > 0;
  } catch (e) {
    return false;
  }
});

const hasToolResult = computed(() => {
  return props.toolResult && props.toolResult.length > 0;
});

const isResultLong = computed(() => {
  return props.toolResult && props.toolResult.length > maxResultLength;
});

const truncatedResult = computed(() => {
  if (!props.toolResult) return '';
  if (resultExpanded.value || !isResultLong.value) {
    return props.toolResult;
  }
  return truncate(props.toolResult, maxResultLength);
});

const resultStatus = computed(() => {
  if (!hasToolResult.value) return 'none';

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(props.toolResult);
    if (parsed.success === false || parsed.error) return 'error';
  } catch (e) {
    // Check if result starts with error indicators (case insensitive)
    const result = props.toolResult.trim().toLowerCase();
    if (result.startsWith('error') || result.startsWith('failed')) {
      return 'error';
    }
  }

  // Default to success
  return 'success';
});

const resultStatusClass = computed(() => {
  switch (resultStatus.value) {
    case 'error':
      return 'bg-red-1';
    case 'success':
      return 'bg-green-1';
    default:
      return 'bg-blue-1';
  }
});

const resultStatusIcon = computed(() => {
  switch (resultStatus.value) {
    case 'error':
      return 'mdi-alert-circle';
    case 'success':
      return 'mdi-check-circle';
    default:
      return 'mdi-information';
  }
});

const resultStatusColor = computed(() => {
  switch (resultStatus.value) {
    case 'error':
      return 'red';
    case 'success':
      return 'green';
    default:
      return 'blue';
  }
});

// Computed properties for editDocument diff rendering
const isEditDocument = computed(() => {
  return props.toolCall?.function?.name === 'editDocument';
});

const editDocumentDiff = computed(() => {
  if (!isEditDocument.value) return null;

  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
    let oldString = args.old_string || '';
    let newString = args.new_string || '';

    if (!oldString && !newString) return null;

    // Try to convert HTML to markdown for better display
    try {
      oldString = htmlToMarkdown(oldString);
      newString = htmlToMarkdown(newString);
    } catch (conversionError) {
      // If conversion fails, use original HTML strings
      console.warn('Failed to convert HTML to markdown for diff display:', conversionError);
    }

    const diff = diffStrings(oldString, newString);
    return diff;
  } catch (e) {
    return null;
  }
});

const editDocumentArgs = computed(() => {
  if (!isEditDocument.value) return null;

  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');
    return {
      oldString: args.old_string || '',
      newString: args.new_string || '',
      fileId: args.fileId
    };
  } catch (e) {
    return null;
  }
});

// Computed property for "Before" section - shows unchanged + removed parts
const beforeDiffParts = computed(() => {
  if (!editDocumentDiff.value) return [];

  // Filter to show only unchanged and removed parts
  return editDocumentDiff.value.filter(part => !part.added);
});

// Computed property for "After" section - shows unchanged + added parts
const afterDiffParts = computed(() => {
  if (!editDocumentDiff.value) return [];

  // Filter to show only unchanged and added parts
  return editDocumentDiff.value.filter(part => !part.removed);
});

// Approval methods
function toggleSelection() {
  if (props.toolCall?.id) {
    aiAgentStore.toggleTool(props.toolCall.id);
  }
}

function setSelection(val) {
  if (props.toolCall?.id) {
    aiAgentStore.setTool(props.toolCall.id, val);
  }
}

function approveThis() {
  if (props.toolCall?.id) {
    // Ensure this tool is selected
    if (!props.isSelected) {
      aiAgentStore.toggleTool(props.toolCall.id);
    }
    // Execute only this tool (by filtering selectedTools to just this one)
    const previousSelection = [...aiAgentStore.selectedTools];
    aiAgentStore.selectedTools = [props.toolCall.id];
    aiAgentStore.executeBatch();
    // Note: executeBatch will clear the batch, so we don't need to restore selection
  }
}

function rejectThis() {
  if (props.toolCall?.id) {
    // Unselect this tool
    if (props.isSelected) {
      aiAgentStore.toggleTool(props.toolCall.id);
    }
  }
}
</script>

<style scoped>
.tool-call-display {
  width: 100%;
  margin-right: auto;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.87);
  padding: 0px 4px;
  border-radius: 8px;
}

.tool-call-display.pending-approval {
  background-color: rgba(78, 93, 212, 0.05);
  animation: agent-pulse-purple 2s ease-in-out infinite;
}

body.body--dark .tool-call-display {
  border-radius: 8px;
}

body.body--dark .tool-call-display.pending-approval {
  background-color: rgba(100, 181, 246, 0.12);
}

@keyframes agent-pulse-purple {
  0%, 100% {
    background-color: rgba(78, 93, 212, 0.05);
  }
  50% {
    background-color: rgba(78, 93, 212, 0.12);
  }
}

.tool-parameters {
  font-family: monospace;
  font-size: 0.85em;
}

.tool-params-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.tool-result-content {
  font-size: 0.9em;
}

.result-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 0.85em;
}

body.body--dark .tool-parameters {
  background-color: #1a1a1a;
}

body.body--dark .tool-result {
  background-color: #1a2332;
}

/* Diff rendering styles for editDocument */
.edit-document-diff {
  font-family: monospace;
  font-size: 0.85em;
}

.diff-section {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

body.body--dark .diff-section {
  border-color: #444;
}

.diff-section-header {
  padding: 4px 8px;
  border-bottom: 1px solid #e0e0e0;
}

body.body--dark .diff-section-header {
  border-bottom-color: #444;
}

body.body--dark .diff-section-header.bg-red-1 {
  background-color: #3d1f1f !important;
}

body.body--dark .diff-section-header.bg-green-1 {
  background-color: #1f3d1f !important;
}

.diff-content {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}

body.body--dark .diff-content {
  background-color: #1a1a1a !important;
}

.diff-part {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-added {
  background-color: #c8e6c9;
  padding: 2px 0;
}

body.body--dark .diff-added {
  background-color: #2d5016;
  color: #a5d6a7;
}

.diff-removed {
  background-color: #ffcdd2;
  padding: 2px 0;
}

body.body--dark .diff-removed {
  background-color: #423538;
  color: #d6a5a5 !important;
}

.diff-unchanged {
  color: inherit;
}

body.body--dark .diff-content.bg-grey-1 {
  background-color: #2a2a2a !important;
}
</style>
