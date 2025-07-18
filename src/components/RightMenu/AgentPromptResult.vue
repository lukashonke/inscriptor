<template>
  <div ref="componentRef">
    <div v-if="!message && !isLoading"></div>

    <!-- User messages -->
    <div v-else-if="message && message.role === 'user'" class="row">
    <div class="chat-message chat-user-message q-mt-md fu">
      <div class="chat-message-header">
        <span class="chat-message-role">You:</span>
      </div>
      <div class="chat-message-content text-editor" :class="writeClasses" v-html="markdownToHtml(message.content)">
      </div>
    </div>
  </div>

  <!-- Assistant messages -->
  <div v-else-if="message && message.role === 'assistant' && message.content && message.content.trim()" class="row">
    <div class="chat-message chat-assistant-message q-mt-md full-width">
      <div class="chat-message-header">
        <span class="chat-message-role">AI:</span>
      </div>
      <div class="chat-message-content">
        <div v-if="message.content" :class="writeClasses" v-html="markdownToHtml(message.content)"></div>
      </div>
    </div>
  </div>

  <!-- System messages -->
  <div v-else-if="message && message.role === 'system'" class="row">
    <div class="chat-message chat-system-message q-mt-md">
      <div class="chat-message-header">
        <span class="chat-message-role">System:</span>
      </div>
      <div class="chat-message-content text-editor-non-indented text-red ">
        <div class="tiptap">
          {{ message.content }}
        </div>
      </div>
    </div>
  </div>

  <!-- Loading indicator when agent is processing -->
  <div v-else-if="isLoading" class="row">
    <div class="chat-message chat-assistant-message q-mt-md">
      <div class="chat-message-header">
        <span class="chat-message-role">Agent:</span>
      </div>
      <div class="chat-message-content text-editor">
        <span class="text-grey-7">{{ loadingText }}</span>
        <AnimatedDots :fixedWidth="'30px'" :speed="500" />
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUpdated, ref } from 'vue';
import { useFileStore } from 'stores/file-store';
import { useLayoutStore } from 'stores/layout-store';
import { useAiAgentStore } from 'stores/aiagent-store';
import {Notify, useQuasar} from 'quasar';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
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
const layoutStore = useLayoutStore();
const aiAgentStore = useAiAgentStore();
const componentRef = ref(null);

// Function to get tool result for a specific tool call
function getToolResult(toolCall) {
  if (!toolCall?.id) return null;
  return props.toolCallResults.get(toolCall.id) || null;
}

// Function to copy blockquote content to clipboard
async function copyBlockquoteToClipboard(blockquote) {
  if (!blockquote) return;

  // Extract text content from blockquote
  const textContent = blockquote.innerText || blockquote.textContent || '';

  try {
    if (layoutStore.runsInDesktopApp()) {
      await writeText(textContent);
    } else {
      await navigator.clipboard.writeText(textContent);
    }

    Notify.create({
      message: 'Copied to clipboard',
      color: 'positive',
      position: 'top-right',
      timeout: 1000,
    });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    Notify.create({
      message: 'Failed to copy to clipboard',
      color: 'negative',
      position: 'top-right',
      timeout: 2000,
    });
  }
}

// Function to add copy buttons to blockquotes
function addCopyButtonsToBlockquotes() {
  nextTick(() => {
    const blockquotes = document.querySelectorAll('.chat-message-content blockquote');
    blockquotes.forEach(blockquote => {
      // Check if copy button already exists
      if (blockquote.querySelector('.blockquote-copy-btn')) return;

      // Create copy button element
      const copyBtn = document.createElement('button');
      copyBtn.className = 'blockquote-copy-btn';
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
          <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" fill="currentColor"/>
        </svg>
      `;
      copyBtn.title = 'Copy to clipboard';

      // Add click handler
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyBlockquoteToClipboard(blockquote);
      });

      // Append to blockquote
      blockquote.appendChild(copyBtn);
    });
  });
}

// Handle paste button clicks via event delegation
function handlePasteClick(event) {
  const pasteBtn = event.target.closest('.prose-paste-btn');
  if (!pasteBtn) return;

  event.stopPropagation();

  const paragraphId = pasteBtn.dataset.paragraphId;
  const proseBlock = pasteBtn.closest('.prose-block');
  if (!proseBlock || !paragraphId) return;

  let newContent = '';

  // Check if we have a diff view
  const diffContent = proseBlock.querySelector('.prose-diff-content');
  if (diffContent) {
    // Extract only non-removed text from diff
    diffContent.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Plain text node - include it
        newContent += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('diff-removed')) {
        // Element node that's not removed - include it
        newContent += node.textContent;
      }
      // Skip diff-removed elements
    });
  } else {
    // No diff, just get the prose content
    const proseContent = proseBlock.querySelector('.prose-content');
    newContent = proseContent ? (proseContent.innerText || proseContent.textContent || '') : '';
  }

  // Call the store method to replace paragraph
  aiAgentStore.replaceParagraphWithContent(paragraphId, newContent.trim());
}

// Add copy buttons when component mounts and updates
onMounted(() => {
  addCopyButtonsToBlockquotes();
  // Add event listener for paste buttons
  if (componentRef.value) {
    componentRef.value.addEventListener('click', handlePasteClick);
  }
});

onUpdated(addCopyButtonsToBlockquotes);

// Computed property for markdown styling classes
const writeClasses = computed(() => {
  return {
    'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
    'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
    'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    'write-small': fileStore.selectedFile?.settings?.fontSize === 'small',
    'write-medium': (fileStore.selectedFile?.settings?.fontSize ?? 'medium') === 'medium',
    'write-large': fileStore.selectedFile?.settings?.fontSize === 'large',

    'text-editor-non-indented': true,

    'prompt-text-editor': true,
    'prompt-results': true,
    'tiptap': true,
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
  position: relative;
  margin: 0.5em 0;
  padding: 0.5em 1em;
  color: rgba(0, 0, 0, 0.75);
  background: linear-gradient(135deg, #ffffff 80%, #ededf8 100%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* Copy button for blockquotes */
.chat-message-content :deep(blockquote .blockquote-copy-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7e7e8e;
  padding: 0;
}

.chat-message-content :deep(blockquote):hover .blockquote-copy-btn {
  opacity: 1;
}

.chat-message-content :deep(blockquote .blockquote-copy-btn):hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  color: #7e7e8e;
}

.chat-message-content :deep(blockquote p) {
  margin: 0;
}

.chat-message-content :deep(blockquote p:not(:last-child)) {
  margin-bottom: 0.5em;
}

.chat-message-content :deep(p:not(:last-child)) {
  margin-bottom: 0.5em;
}

/* Prose blocks styling (similar to blockquotes) */
.chat-message-content :deep(.prose-block) {
  position: relative;
  margin: 0.5em 0;
  padding: 0.5em 1em;
  color: rgba(0, 0, 0, 0.75);
  background: linear-gradient(135deg, #ffffff 80%, #ededf8 100%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.chat-message-content :deep(.prose-block .blockquote-copy-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7e7e8e;
  padding: 0;
}

.chat-message-content :deep(.prose-block):hover .blockquote-copy-btn {
  opacity: 1;
}

.chat-message-content :deep(.prose-block .blockquote-copy-btn):hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  color: #7e7e8e;
}

/* Paste button styling */
.chat-message-content :deep(.prose-block .prose-paste-btn) {
  position: absolute;
  top: 8px;
  right: 42px; /* Position to the left of copy button */
  width: 28px;
  height: 28px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #7e7e8e;
}

.chat-message-content :deep(.prose-block):hover .prose-paste-btn {
  opacity: 1;
}

.chat-message-content :deep(.prose-block .prose-paste-btn):hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 1);
}

/* Dark mode markdown styles */
body.body--dark .chat-message-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .chat-message-content :deep(pre) {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .chat-message-content :deep(blockquote) {
  border-left: 4px solid rgba(107, 126, 214, 0.7);
  background: linear-gradient(135deg, rgba(107, 126, 214, 0.2) 80%, rgba(107, 126, 214, 0.3) 100%);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(107, 126, 214, 0.1);
}

/* Dark mode copy button styles */
body.body--dark .chat-message-content :deep(blockquote .blockquote-copy-btn) {
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

body.body--dark .chat-message-content :deep(blockquote .blockquote-copy-btn):hover {
  background-color: rgba(0, 0, 0, 0.8);
  color: rgba(255, 255, 255, 1);
}

/* Dark mode prose blocks */
body.body--dark .chat-message-content :deep(.prose-block) {
  background: linear-gradient(135deg, rgba(107, 126, 214, 0.2) 80%, rgba(107, 126, 214, 0.3) 100%);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(107, 126, 214, 0.1);
}

body.body--dark .chat-message-content :deep(.prose-block .blockquote-copy-btn) {
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

body.body--dark .chat-message-content :deep(.prose-block .blockquote-copy-btn):hover {
  background-color: rgba(0, 0, 0, 0.8);
  color: rgba(255, 255, 255, 1);
}

/* Dark mode paste button */
body.body--dark .chat-message-content :deep(.prose-block .prose-paste-btn) {
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #81c784; /* Light green for dark mode */
}

body.body--dark .chat-message-content :deep(.prose-block .prose-paste-btn):hover {
  background-color: rgba(0, 0, 0, 0.8);
  color: #a5d6a7; /* Lighter green on hover */
}

/* Dark mode diff styling - simplified to match PromptResult.vue */
body.body--dark .chat-message-content :deep(.prose-diff-content .diff-added) {
  color: #81c784; /* Light green for dark mode */
}

body.body--dark .chat-message-content :deep(.prose-diff-content .diff-removed) {
  color: rgba(229, 115, 115, 0.53); /* Light red for dark mode */
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
