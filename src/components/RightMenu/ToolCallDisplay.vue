<template>
  <div class="tool-call-display">
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
            <div v-if="hasParameters" class="tool-parameters q-pa-sm bg-grey-2 rounded-borders">
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
import { truncate } from 'src/common/utils/textUtils';
import { useFileStore } from 'src/stores/file-store';
import { usePromptStore } from 'src/stores/prompt-store';

const props = defineProps({
  toolCall: {
    type: Object,
    required: true
  },
  toolResult: {
    type: String,
    default: null
  }
});

const fileStore = useFileStore();
const promptStore = usePromptStore();

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
  'getAllContextTypes': 'Get Available Context Types'
};

const toolName = computed(() => {
  const technicalName = props.toolCall?.function?.name;

  try {
    const args = JSON.parse(props.toolCall?.function?.arguments || '{}');

    // Special handling for different tools to show specific details
    switch (technicalName) {
      case 'modifyParagraph':
        const action = args.action || 'modify';
        const position = args.position;
        switch (action) {
          case 'add':
            return position ? `AI wants to: Add Paragraph (${position})` : 'AI wants to: Add Paragraph';
          case 'remove':
            return 'AI wants to: Remove Paragraph';
          case 'modify':
          default:
            return 'AI wants to: Modify Paragraph';
        }

      case 'readFile':
        const readType = args.readType || 'full';
        const fileId = args.fileId;
        if (fileId) {
          const file = fileStore.getFile(fileId);
          const fileTitle = file?.title || `${fileId.substring(0, 8)}...`;
          return `AI wants to: Read File - ${fileTitle} (${readType})`;
        }
        return `AI wants to: Read File (${readType})`;

      case 'search':
        const searchQuery = args.searchQuery;
        const contextType = args.contextType;
        const searchType = args.searchType || 'all';
        let searchDesc = `AI wants to: Search`;
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
          return `AI wants to: Execute AI Prompt - ${promptTitle}`;
        }
        return 'AI wants to: Execute AI Prompt';

      case 'setFileSummary':
        const summaryFileId = args.fileId;
        if (summaryFileId) {
          const file = fileStore.getFile(summaryFileId);
          const fileTitle = file?.title || `${summaryFileId.substring(0, 8)}...`;
          return `AI wants to: Set File Summary - ${fileTitle}`;
        }
        return 'AI wants to: Set File Summary (current file)';

      case 'listProjectFiles':
        const listContextType = args.contextType;
        if (listContextType) {
          return `AI wants to: List Project Files - ${listContextType}`;
        }
        return 'AI wants to: List Project Files';

      default:
        break;
    }
  } catch (e) {
    // If parsing fails, fall back to basic name
  }

  const baseName = toolFriendlyNames[technicalName] || technicalName || 'Unknown Tool';
  return `AI wants to: ${baseName}`;
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

body.body--dark .tool-call-display {
  border-radius: 8px;
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
</style>
