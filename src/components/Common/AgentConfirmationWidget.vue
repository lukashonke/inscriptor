<template>
  <div class="agent-confirmation-widget q-my-sm inscriptor-shadow-1 gradient-variation-1">
    <q-card bordered class="hoverable-card idea-card gradient-variation-1">
      <!-- Header with agent info -->
      <div class="q-pa-sm bg-accent text-white">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-body2 text-weight-medium">
              <q-icon name="mdi-robot-outline" class="q-mr-xs" />
              {{ agentTitle }} suggestions:
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
              <q-tooltip>Skip this paragraph</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Changes comparison -->
      <q-card-section class="q-pa-sm">
        <!-- Proposed changes with diff highlighting -->
        <div class="comparison-container">
          <div class="suggested-text q-mb-sm">
            <div class="q-pa-xs rounded border-accent" :class="writeClasses" v-html="diffHtml">
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Chat input section -->
      <q-card-section class="q-px-sm q-pt-none q-pb-sm q-mb-sm" v-if="!chatLoading && !isStreaming && suggestedText.trim()">
        <div class="row q-gutter-sm">
          <div class="col">
            <q-input
              v-model="chatInput"
              dense
              filled
              autofocus
              outlined
              label="Reply to AI"
              placeholder="e.g., Make it shorter, Add more detail, Change tone..."
              @keyup.enter="onChat"
              :disable="chatLoading || isStreaming"
            />
          </div>
          <div class="col-auto flex items-center">
            <q-spinner-grid v-if="isStreaming"></q-spinner-grid>
            <q-btn
              v-else
              icon="mdi-send-outline"
              flat
              color="primary"
              @click="onChat"
              :disable="!chatInput.trim() || chatLoading"
              :loading="chatLoading"
              dense
            >
              <q-tooltip>Send feedback to improve suggestion</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Action buttons -->
      <q-card-actions class="q-pa-sm">
        <div class="row full-width q-gutter-sm">
          <div class="col-auto">
            <q-btn
              flat
              color="negative"
              label="Skip paragraph"
              @click="onReject"
              class="full-width"
              no-caps
              :disable="chatLoading || isStreaming"
            />
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
              :disable="chatLoading || isStreaming"
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
  agentTitle: {
    type: String,
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  suggestedText: {
    type: String,
    required: true
  },
  paragraphRange: {
    type: Object,
    required: true // { from, to }
  },
  chatLoading: {
    type: Boolean,
    default: false
  },
  streamingText: {
    type: String,
    default: ''
  },
  isStreaming: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['accept', 'reject', 'chat'])

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
  const textToCompare = props.isStreaming && props.streamingText
    ? props.streamingText
    : props.suggestedText;

  const diff = diffStrings(props.originalText, textToCompare);

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
  if (props.isStreaming) {
    html += '<span class="streaming-cursor">|</span>';
  }

  return html;
})

function onAccept() {
  emits('accept', {
    paragraphRange: props.paragraphRange,
    originalText: props.originalText,
    suggestedText: props.suggestedText
  })
}

function onReject() {
  emits('reject', {
    paragraphRange: props.paragraphRange,
    originalText: props.originalText
  })
}

function onChat() {
  if (!chatInput.value.trim()) return

  emits('chat', chatInput.value.trim())

  // Clear the input after sending
  chatInput.value = ''
}
</script>

<style lang="scss" scoped>
.agent-confirmation-widget {
  width: 500px;
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
