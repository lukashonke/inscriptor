<template>
  <div class="agent-confirmation-widget q-my-sm inscriptor-shadow-1 gradient-variation-1">
    <q-card bordered class="hoverable-card idea-card gradient-variation-1">
      <!-- Header with agent info -->
      <div class="q-pa-sm bg-accent text-white">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-body2 text-weight-medium">
              <q-icon :name="getOperationIcon()" class="q-mr-xs q-ml-xs" />
              {{ widgetData.agentTitle }}
              <span v-if="widgetData.isIndependentAgent" class="q-ml-xs text-caption">(Independent)</span>
              {{ widgetData.isAgentStopped ? 'completed:' : getOperationLabel() }}
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="mdi-close"
              @click="onReject"
              class="text-white"
            >
            </q-btn>
          </div>
        </div>
      </div>

      <q-card-section class="q-pa-sm q-mb-none">
        <div class="comparison-container">
          <!-- Operation type indicator -->
          <div v-if="getOperationType() !== 'modify'" class="operation-indicator q-mb-sm">
            <q-chip 
              :color="getOperationColor()" 
              text-color="white" 
              :icon="getOperationIcon()"
              size="sm"
            >
              {{ getOperationDescription() }}
            </q-chip>
          </div>
          
          <!-- Content display for different operations -->
          <div v-if="getOperationType() === 'remove'" class="removal-preview q-mb-sm">
            <div class="text-caption text-grey-6 q-mb-xs">Content to be removed:</div>
            <div class="q-pa-xs rounded border-negative bg-negative-1 text-grey-8">
              <del>{{ widgetData.originalText }}</del>
            </div>
          </div>
          
          <div v-else-if="getOperationType() === 'add'" class="addition-preview q-mb-sm">
            <div class="text-caption text-grey-6 q-mb-xs">{{ getPositionDescription() }}:</div>
            <div class="q-pa-xs rounded border-positive bg-positive-1">
              <div class="text-grey-6 text-caption">{{ widgetData.originalText }}</div>
            </div>
            <div class="text-caption text-grey-6 q-mb-xs q-mt-sm">New content to insert:</div>
            <div
              v-if="!isEditingNow"
              class="q-pa-xs rounded border-accent bg-accent-1"
              :class="writeClasses"
              contenteditable
              @focus="startEditing"
            >
              {{ widgetData.aiSuggestion }}
            </div>
            <div
              v-else
              class="q-pa-xs rounded border-accent bg-accent-1"
              :class="writeClasses"
              contenteditable
              ref="editableDiv"
              @input="handleInput"
              @blur="finishEditing"
            ></div>
          </div>
          
          <div v-else class="suggested-text q-mb-sm">
            <div
              v-if="!isEditingNow"
              class="q-pa-xs rounded border-accent"
              :class="writeClasses"
              v-html="diffHtml"
              contenteditable
              @focus="startEditing"
            >
            </div>
            <div
              v-else
              class="q-pa-xs rounded border-accent"
              :class="writeClasses"
              contenteditable
              ref="editableDiv"
              @input="handleInput"
              @blur="finishEditing"
            ></div>
          </div>
        </div>
      </q-card-section>

      <!-- AI Message Section -->
      <q-card-section class="q-pa-sm" v-if="widgetData.aiMessage">
        <div class="ai-message-container">
          <div class="ai-message-header q-mb-xs">
            <q-icon name="mdi-message-text-outline" class="q-mr-xs text-primary" size="sm" />
            <span class="text-weight-medium text-primary text-caption">AI Response</span>
          </div>
          <div class="ai-message-content">
            <p class="q-ma-none text-body2" v-html="formatMessage(widgetData.aiMessage)"></p>
          </div>
        </div>
      </q-card-section>

      <!-- Reasoning Section -->
      <q-card-section class="q-pa-sm q-mb-sm" v-if="widgetData.reasoning">
        <div class="reasoning-container q-pa-md">
          <div class="reasoning-header q-mb-xs">
            <q-icon name="mdi-lightbulb-outline" class="q-mr-xs text-amber-7" size="sm" />
            <span class="text-weight-medium text-amber-7 text-caption">Reasoning</span>
          </div>
          <div class="reasoning-content">
            <div class="text-body2 text-grey-8 text-caption">
              {{widgetData.reasoning}}
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Agent analysis status -->
      <div v-if="(widgetData.executingPromptRequest?.promptAgent && widgetData.isStreaming) || widgetData.isLoading" class="q-pa-sm">
        <div class="row items-center">
          <div class="q-ml-xs col-auto flex items-center">
            <q-spinner-grid class="q-mr-sm" size="16px" />
          </div>
          <div class="col flex items-center">
            <div class="text-caption">
              <span v-if="widgetData.executingPromptRequest?.promptAgent?.title">
                Analysing by {{ widgetData.executingPromptRequest.promptAgent.title }}...
              </span>
              <span v-else>
                Loading...
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="widgetData.promptResult && widgetData.promptResult.prevResults && widgetData.promptResult.prevResults.length > 0" class="text-center">
        <q-btn class="text-weight-bold hoverable-btn-semi" :label="previousResultsExpanded ? 'Hide results before agents' : 'Show results before agents (' + widgetData.promptResult.prevResults.length + ')'" flat color="grey-7" unelevated size="sm" no-caps @click="previousResultsExpanded = !previousResultsExpanded" />
      </div>

      <template v-if="widgetData.promptResult && previousResultsExpanded && widgetData.promptResult.prevResults && widgetData.promptResult.prevResults.length > 0">
        <template v-for="(previousResult, index) in widgetData.promptResult.prevResults" :key="index">
          <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut">
            <div class="q-mx-md q-mb-sm">
              <PromptResult :prompt-result="previousResult" :showPromptInfo="false" :isPreviousPromptResult="true" :show-menu="false" :insert-func="acceptReplyBeforeAgent" :has-copy="false"/>
            </div>
          </transition>
        </template>
      </template>

      <!-- Chat input section -->
      <q-card-section
        class="q-px-sm q-py-none q-pb-sm q-mb-none"
        v-if="!widgetData.isStreaming && (widgetData.aiSuggestion ?? '').trim() && !widgetData.isAgentStopped"
      >
        <div class="row">
          <div class="col">
            <q-input
              v-model="chatInput"
              dense
              borderless
              flat
              class="q-ml-xs"
              autofocus
              label="Reply to AI..."
              placeholder="e.g., Make it shorter, Add more detail, Change tone..."
              @keyup.enter="onChat"
              :disable="widgetData.isStreaming"
            />
          </div>
          <div class="col-auto flex items-center">
            <q-spinner-grid v-if="widgetData.isStreaming"></q-spinner-grid>
            <q-btn
              v-else-if="chatInput && chatInput.length > 0"
              icon="mdi-reply-outline"
              color="primary"
              @click="onChat"
              :disable="!chatInput.trim()"
              :loading="widgetData.isStreaming"
            >
              <q-tooltip>Send feedback to improve suggestion</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Action buttons -->
      <q-card-actions class="q-pa-sm">
        <!-- Regular agent buttons -->
        <div v-if="!widgetData.isIndependentAgent" class="row full-width">
          <div class="col-auto">
            <q-btn
              flat
              color="negative"
              :label="widgetData.isAgentChat ? 'Reject change' : 'Skip paragraph'"
              @click="onReject"
              class="full-width"
              no-caps
              :disable="widgetData.isStreaming"
            />
          </div>
          <div class="col-auto q-ml-sm" v-if="widgetData.conversationMessages && widgetData.conversationMessages.length > 0">
            <q-btn
              flat
              color="primary"
              icon="mdi-undo"
              label="Undo Chat"
              @click="onUndo"
              class="full-width q-ml-sm"
              no-caps
              :disable="widgetData.isStreaming"
            >
              <q-tooltip>Revert to original AI suggestion</q-tooltip>
            </q-btn>
          </div>
          <div class="col"/>
          <div class="col-auto">
            <q-btn
              color="accent"
              icon="mdi-check"
              label="Accept"
              @click="onAccept"
              class="full-width"
              no-caps
              :disable="widgetData.isStreaming"
            />
          </div>
        </div>

        <!-- Independent agent buttons -->
        <div v-else class="row full-width">
          <!-- Agent stopped - only close button -->
          <div v-if="widgetData.isAgentStopped" class="col">
            <q-btn
              color="primary"
              icon="mdi-check"
              label="Close"
              @click="onReject"
              class="full-width"
              no-caps
            >
              <q-tooltip>Agent completed all tasks</q-tooltip>
            </q-btn>
          </div>

          <!-- Agent has suggestions -->
          <template v-else>
            <div class="col-auto">
              <q-btn
                flat
                color="negative"
                label="Skip"
                @click="onReject"
                class="full-width"
                no-caps
                :disable="widgetData.isStreaming || widgetData.isLoading"
              >
                <q-tooltip>Skip this paragraph</q-tooltip>
              </q-btn>
            </div>
            <div class="col-auto q-ml-sm" v-if="widgetData.aiSuggestion != widgetData.originalAiSuggestion">
              <q-btn
                flat
                color="primary"
                icon="mdi-undo"
                label="Undo Chat"
                @click="onUndo"
                class="full-width q-ml-sm"
                no-caps
                :disable="widgetData.isStreaming || widgetData.isLoading"
              >
                <q-tooltip>Revert to original AI suggestion</q-tooltip>
              </q-btn>
            </div>
            <div class="col"/>
            <div class="col-auto">
              <q-btn
                color="accent"
                icon="mdi-check"
                label="Accept & Continue"
                @click="onAccept"
                class="full-width"
                no-caps
                :disable="widgetData.isStreaming || widgetData.isLoading"
              >
                <q-tooltip>Accept this change</q-tooltip>
              </q-btn>
            </div>
          </template>
        </div>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import {diffStrings, markdownToHtml} from 'src/common/utils/textUtils'
import { useFileStore } from 'stores/file-store'
import PromptResult from 'components/RightMenu/PromptResult.vue';
import {useAiAgentStore} from 'stores/aiagent-store';

const props = defineProps({
  widgetData: {
    type: Object,
    required: true
  },
})

const aiAgentStore = useAiAgentStore();

const emits = defineEmits(['accept', 'reject', 'chat', 'undo'])

// Store instance
const fileStore = useFileStore()

const previousResultsExpanded = ref(false);
const editableContent = ref('');
const isEditingNow = ref(false);

const aiSuggestionEdit = computed({
  get() {
    return props.widgetData.aiSuggestion;
  },
  set(value) {
    // eslint-disable-next-line vue/no-mutating-props
    props.widgetData.aiSuggestion = value;
  }
})

// Chat input reactive data
const chatInput = ref('')

// CSS classes for text rendering to match PromptResult and TextEditor user preferences
const writeClasses = computed(() => {
  return {
    'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
    'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
    'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    'write-small': fileStore.selectedFile?.settings?.fontSize === 'small',
    'write-medium': (fileStore.selectedFile?.settings?.fontSize ?? 'medium') === 'medium',
    'write-large': fileStore.selectedFile?.settings?.fontSize === 'large',

    'text-editor': (fileStore.selectedFile?.settings?.editorType ?? 'regular') === 'regular',
    'text-editor-condensed': fileStore.selectedFile?.settings?.editorType === 'condensed',
    'text-editor-non-indented': fileStore.selectedFile?.settings?.editorType === 'non-indented',

    'text-editor-base': true,
  }
})

// Calculate diff and render it with highlighting
const diffHtml = computed(() => {
  // Use streaming text if available and streaming, otherwise use final suggested text
  const textToCompare = props.widgetData.aiSuggestion;

  const diff = diffStrings(props.widgetData.originalText ?? '', textToCompare ?? '');

  let html = '';
  for (const part of diff) {
    let value = part.value;
    if (part.added) {
      html += '<span class="diff-added">' + value + '</span>';
    } else if (!part.added && !part.removed) {
      html += value;
    }
  }

  // Add typing indicator when streaming
  if (props.widgetData.isStreaming) {
    html += '<span class="streaming-cursor">|</span>';
  }

  return html;
})

function onAccept() {
  emits('accept', {
    paragraphRange: props.widgetData.paragraphRange,
    originalText: props.widgetData.originalText,
    aiSuggestion: props.widgetData.aiSuggestion
  })
}

function acceptReplyBeforeAgent(result) {
  aiAgentStore.onWidgetReplaceText(result);
  onAccept();
}

function onReject() {
  emits('reject', {
    paragraphRange: props.widgetData.paragraphRange,
    originalText: props.widgetData.originalText,
    nodeId: props.widgetData.nodeId
  })
}

function onChat() {
  if (!chatInput.value.trim()) return

  if (props.widgetData.isAgentChat) {
    // For agent chat, emit reject with feedback (feedback will be stored in onWidgetChat before rejection)
    emits('reject', {
      paragraphRange: props.widgetData.paragraphRange,
      originalText: props.widgetData.originalText,
      nodeId: props.widgetData.nodeId,
      userFeedback: chatInput.value.trim()
    })
  } else {
    // For other agents, use normal chat
    emits('chat', chatInput.value.trim())
  }

  // Clear the input after sending
  chatInput.value = ''
}

function onUndo() {
  // Clear chat input when undoing to reset state
  chatInput.value = ''
  emits('undo')
}

function handleInput(event) {
  editableContent.value = event.target.innerText;
}

function startEditing() {
  editableContent.value = props.widgetData.aiSuggestion;
  isEditingNow.value = true;
  // Focus the editable div after Vue updates the DOM and set its content
  nextTick(() => {
    const editableDiv = document.querySelector('.suggested-text div[contenteditable]');
    if (editableDiv) {
      editableDiv.innerText = editableContent.value;
      editableDiv.focus();
    }
  });
}

function finishEditing() {
  aiSuggestionEdit.value = editableContent.value;
  isEditingNow.value = false;
}

function formatMessage(text) {
  if (!text) return '';

  // Basic formatting: convert line breaks to <br>, preserve whitespace
  return markdownToHtml(text);
}

// Operation type helpers
function getOperationType() {
  return props.widgetData.toolCallResult?.action || 'modify';
}

function getOperationIcon() {
  const type = getOperationType();
  switch (type) {
    case 'add':
      return 'mdi-plus-circle-outline';
    case 'remove':
      return 'mdi-minus-circle-outline';
    case 'modify':
    default:
      return 'mdi-robot-outline';
  }
}

function getOperationColor() {
  const type = getOperationType();
  switch (type) {
    case 'add':
      return 'positive';
    case 'remove':
      return 'negative';
    case 'modify':
    default:
      return 'accent';
  }
}

function getOperationLabel() {
  const type = getOperationType();
  switch (type) {
    case 'add':
      return 'suggests adding:';
    case 'remove':
      return 'suggests removing:';
    case 'modify':
    default:
      return 'suggestions:';
  }
}

function getOperationDescription() {
  const type = getOperationType();
  const position = props.widgetData.toolCallResult?.position;
  switch (type) {
    case 'add':
      return `Add paragraph ${position || 'after'}`;
    case 'remove':
      return 'Remove paragraph';
    case 'modify':
    default:
      return 'Modify paragraph';
  }
}

function getPositionDescription() {
  const position = props.widgetData.toolCallResult?.position;
  return position === 'before' 
    ? 'Insert new paragraph before this content' 
    : 'Insert new paragraph after this content';
}
</script>

<style lang="scss" scoped>
.agent-confirmation-widget {
  min-width: 650px;
  max-width: 50vw;
  margin: 0 auto;

  .comparison-container {
    .suggested-text > div {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    max-height: 30vh;
    overflow-y: auto;
  }

  // Streaming cursor animation
  .streaming-cursor {
    animation: blink 1s infinite;
    color: var(--q-accent);
    font-weight: bold;
  }

  // AI Message styling
  .ai-message-container {
    border-radius: 8px;
    padding: 12px;
    border-left: 3px solid;

    .ai-message-header {
      display: flex;
      align-items: center;
    }

    .ai-message-content {
      padding-left: 20px; // Align with header text
      line-height: 1.5;

      p {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  }

  // Reasoning styling
  .reasoning-container {
    border-radius: 8px;

    .reasoning-header {
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
    }

    .reasoning-content {
      padding-left: 28px; // Align with header text
      line-height: 1.5;

      div {
        white-space: pre-wrap;
        word-wrap: break-word;
        padding-bottom: 0px;
      }
    }
  }

  // Dark mode support handled by global CSS
}

.agent-confirmation-widget {
  position: relative;
  z-index: 10;
}

// Keyframe for streaming cursor
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
