<template>
  <div class="agent-confirmation-widget q-my-sm inscriptor-shadow-1 gradient-variation-1">
    <q-card bordered class="hoverable-card idea-card gradient-variation-1">
      <!-- Header with agent info -->
      <div class="q-pa-sm bg-accent text-white">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-body2 text-weight-medium">
              <q-icon name="mdi-robot-outline" class="q-mr-xs q-ml-xs" />
              {{ agentTitle || promptResult.agentTitle }} suggestions:
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

      <!-- Agent analysis status -->
      <div v-if="promptResult.aiResult?.analysingByAgent" class="q-pa-sm bg-blue-grey-1">
        <div class="row items-center">
          <div class="col-auto">
            <q-spinner-grid class="q-mr-sm" size="16px" />
          </div>
          <div class="col">
            <div class="text-caption text-blue-grey-8">
              <span v-if="promptResult.aiResult.analysingByAgentMessage">
                {{ promptResult.aiResult.analysingByAgentMessage }}
              </span>
              <span v-else>
                Analysing by {{ promptResult.aiResult.analysingByAgent.title }}...
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Changes comparison -->
      <q-card-section class="q-pa-sm q-mb-none">
        <!-- Proposed changes with diff highlighting -->
        <div class="comparison-container">
          <div class="suggested-text q-mb-sm">
            <div class="q-pa-xs rounded border-accent" :class="writeClasses" v-html="diffHtml">
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Chat input section -->
      <q-card-section class="q-px-sm q-py-none q-pb-sm q-mb-none" v-if="!promptResult.chatLoading && !promptResult.isStreaming && (promptResult.aiSuggestion || '').trim()">
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
              :disable="promptResult.chatLoading || promptResult.isStreaming"
            />
          </div>
          <div class="col-auto flex items-center">
            <q-spinner-grid v-if="promptResult.isStreaming"></q-spinner-grid>
            <q-btn
              v-else-if="chatInput && chatInput.length > 0"
              icon="mdi-reply-outline"
              color="primary"
              @click="onChat"
              :disable="!chatInput.trim() || promptResult.chatLoading"
              :loading="promptResult.chatLoading"
            >
              <q-tooltip>Send feedback to improve suggestion</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Action buttons -->
      <q-card-actions class="q-pa-sm">
        <div class="row full-width">
          <div class="col-auto">
            <q-btn
              flat
              color="negative"
              label="Skip paragraph"
              @click="onReject"
              class="full-width"
              no-caps
              :disable="promptResult.chatLoading || promptResult.isStreaming"
            />
          </div>
          <div class="col-auto" v-if="promptResult.conversationMessages && promptResult.conversationMessages.length > 0">
            <q-btn
              flat
              color="orange"
              icon="mdi-undo"
              label="Undo to Original"
              @click="onUndo"
              class="full-width q-ml-sm"
              no-caps
              :disable="promptResult.chatLoading || promptResult.isStreaming"
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
              :disable="promptResult.chatLoading || promptResult.isStreaming"
            />
          </div>
        </div>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { diffStrings } from 'src/common/utils/textUtils'
import { useFileStore } from 'stores/file-store'

const props = defineProps({
  promptResult: {
    type: Object,
    required: true
  },
  // Legacy props for backward compatibility
  agentTitle: {
    type: String,
    default: ''
  },
  paragraphRange: {
    type: Object,
    default: () => ({ from: 0, to: 0 })
  }
})

const emits = defineEmits(['accept', 'reject', 'chat', 'undo'])

// Store instance
const fileStore = useFileStore()

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
  const textToCompare = props.promptResult.isStreaming && props.promptResult.streamingText
    ? props.promptResult.streamingText
    : props.promptResult.aiSuggestion;

  const diff = diffStrings(props.promptResult.originalText ?? '', textToCompare ?? '');

  let html = '';
  for (const part of diff) {
    let value = part.value;
    if (part.added) {
      html += '<span class="text-green-7">' + value + '</span>';
    } else if (!part.added && !part.removed) {
      html += value;
    }
    // Skip removed parts (like PromptResult.vue does)
  }

  // Add typing indicator when streaming
  if (props.promptResult.isStreaming) {
    html += '<span class="streaming-cursor">|</span>';
  }

  return html;
})

function onAccept() {
  emits('accept', {
    paragraphRange: props.paragraphRange || props.promptResult.paragraphRange,
    originalText: props.promptResult.originalText,
    aiSuggestion: props.promptResult.aiSuggestion
  })
}

function onReject() {
  emits('reject', {
    paragraphRange: props.paragraphRange || props.promptResult.paragraphRange,
    originalText: props.promptResult.originalText
  })
}

function onChat() {
  if (!chatInput.value.trim()) return

  emits('chat', chatInput.value.trim())

  // Clear the input after sending
  chatInput.value = ''
}

function onUndo() {
  // Clear chat input when undoing to reset state
  chatInput.value = ''
  emits('undo')
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

  // Dark mode support for accent border
  .body--dark & {
    .suggested-text > div {
      background-color: rgba(var(--q-primary-rgb), 0.1);
    }
  }
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
