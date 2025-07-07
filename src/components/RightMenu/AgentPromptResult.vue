<template>
  <div v-if="!message && !isLoading"></div>

  <!-- User messages -->
  <div v-else-if="message && message.role === 'user'" class="row">
    <div class="chat-message chat-user-message q-mt-md">
      <div class="chat-message-header">
        <span class="chat-message-role">You:</span>
      </div>
      <div class="chat-message-content" :class="writeClasses" v-html="markdownToHtml(message.content)">
      </div>
    </div>
  </div>

  <!-- Assistant messages -->
  <div v-else-if="message && message.role === 'assistant'" class="row">
    <div class="chat-message chat-assistant-message q-mt-md">
      <div class="chat-message-header">
        <span class="chat-message-role">Agent:</span>
      </div>
      <div class="chat-message-content">
        <div v-if="message.content" :class="writeClasses" v-html="markdownToHtml(message.content)"></div>

        <!-- Tool calls display -->
        <div v-if="message.toolCalls && message.toolCalls.length > 0" class="q-mt-md">
          <ToolCallDisplay
            v-for="(toolCall, index) in message.toolCalls"
            :key="index"
            :toolCall="toolCall"
            :toolResult="getToolResult(toolCall)"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- System messages -->
  <div v-else-if="message && message.role === 'system'" class="row">
    <div class="chat-message chat-system-message q-mt-md">
      <div class="chat-message-header">
        <span class="chat-message-role">System:</span>
      </div>
      <div class="chat-message-content text-red">
        {{ message.content }}
      </div>
    </div>
  </div>

  <!-- Loading indicator when agent is processing -->
  <div v-else-if="isLoading" class="row">
    <div class="chat-message chat-assistant-message q-mt-md">
      <div class="chat-message-header">
        <span class="chat-message-role">Agent:</span>
      </div>
      <div class="chat-message-content">
        <span class="text-grey-7">{{ loadingText }}</span>
        <AnimatedDots :fixedWidth="'30px'" :speed="500" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFileStore } from 'stores/file-store';
import { markdownToHtml } from 'src/common/utils/textUtils';
import AnimatedDots from 'src/components/Common/AnimatedDots.vue';
import ToolCallDisplay from './ToolCallDisplay.vue';

const props = defineProps({
  message: {
    type: Object,
    required: false,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Agent is thinking'
  },
  toolCallResults: {
    type: Map,
    default: () => new Map()
  }
});

const fileStore = useFileStore();

// Function to get tool result for a specific tool call
function getToolResult(toolCall) {
  if (!toolCall?.id) return null;
  return props.toolCallResults.get(toolCall.id) || null;
}

// Computed property for markdown styling classes
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

    'prompt-text-editor': true,
    'prompt-results': true,
  }
});
</script>

<style scoped>
.chat-message {
  max-width: 80%;
  margin-bottom: 8px;
}

.chat-user-message {
  margin-left: auto;
  background-color: rgba(79, 94, 214, 0.1);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
}

.chat-assistant-message {
  margin-right: auto;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
}

.chat-system-message {
  margin: 0 auto;
  background-color: rgba(244, 67, 54, 0.1);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
}

.chat-message-header {
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 4px;
}

.chat-message-content {
  word-break: break-word;
}

/* Markdown content styles */
.chat-message-content :deep(p) {
  margin: 0 0 0.5em 0;
}

.chat-message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-message-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: monospace;
}

.chat-message-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.chat-message-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.chat-message-content :deep(blockquote) {
  border-left: 4px solid rgba(79, 94, 214, 0.3);
  margin: 0.5em 0;
  padding: 0.5em 1em;
  background-color: rgb(253, 253, 253);
  color: rgba(0, 0, 0, 0.75);
}

.chat-message-content :deep(blockquote p) {
  margin: 0;
}

/* Dark mode markdown styles */
body.body--dark .chat-message-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .chat-message-content :deep(pre) {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .chat-message-content :deep(blockquote) {
  border-left: 4px solid rgba(107, 126, 214, 0.5);
  background-color: rgba(107, 126, 214, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

/* Dark mode overrides */
body.body--dark .chat-user-message {
  background-color: rgba(107, 126, 214, 0.2);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .chat-assistant-message {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .chat-system-message {
  background-color: rgba(244, 67, 54, 0.15);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .chat-message-header {
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .text-grey-7 {
  color: rgba(255, 255, 255, 0.6);
}
</style>
