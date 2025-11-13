<template>
  <div class="column fit deep-agent-gradient-variation-1">
    <!-- Header with controls -->
    <div class="row items-center q-mx-md q-mb-sm q-mt-xs" style="height: 61px">
      <div class="col flex">
        <div class="col-auto flex items-center" v-if="deepAgentStore.isStreaming || isErrorStatus">
          <div class="menu-subtitle flex items-center" :class="{ 'status-error': isErrorStatus }">
            <q-spinner-ios v-if="deepAgentStore.isStreaming" class="q-mr-xs"></q-spinner-ios>
            <q-icon v-else-if="isErrorStatus" name="mdi-alert-circle" class="q-mr-xs" />
            {{ deepAgentStore.getStatusMessage }}
            <q-btn v-if="deepAgentStore.isStreaming" dense outline @click="handleCancel" label="Stop" size="sm" class="q-ml-xs q-py-none" color="red"/>
          </div>
        </div>
      </div>
      <div class="col flex items-center justify-center q-mr-xs">
        <AgentModeSelector />
      </div>
      <div class="col flex items-center justify-end">
        <q-btn color="negative" flat no-caps @click="handleNewChat" :disable="deepAgentStore.isStreaming" size="md" icon="mdi-delete-outline" class="" :label="isMobile ? undefined : 'Clear'" dense :padding="isMobile ? 'xs md' : 'xs md'">
          <q-tooltip :delay="500">
            Start a new Deep Agent conversation
          </q-tooltip>
        </q-btn>
        <!--<div class="col-auto flex items-center"> not needed for Deep Agent - the New button supplies it
          <q-btn flat color="negative" icon="mdi-delete-outline" size="md" :padding="isMobile ? 'xs md' : undefined">
            <q-menu>
              <q-list dense>
                <q-item clickable @click="handleClearChat" v-close-popup>
                  <q-item-section side>
                    <q-icon name="mdi-close" />
                  </q-item-section>
                  <q-item-section>
                    Clear current conversation
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>-->
      </div>
    </div>

    <!-- Chat messages area -->
    <div ref="chatScrollArea" class="col scroll-area q-px-md">
      <div class="chat-history-container" style="margin-bottom: 100px;">
        <div class="chat-messages">
          <!-- Loop through all messages -->
          <div
            v-for="(message, index) in currentChat?.messages || []"
            :key="message.id"
            :class="[
              'message-wrapper',
              message.role === 'user' ? 'da-user-message' : 'da-agent-message',
              message.role === 'system' ? 'da-system-message' : '',
              'q-mb-md'
            ]"
          >
          <div class="message-bubble">
            <!-- Message header for assistant messages -->
            <div v-if="message.role === 'assistant'" class="message-header q-mb-sm items-center text-grey-9">
              <q-icon name="mdi-robot" size="xs" class="q-mr-xs" />
              <span class="text-caption text-weight-medium">Deep Agent</span>
            </div>

            <!-- Message content -->
            <div class="message-content text-editor no-p-margin-0 write-serif write-medium prompt-test-editor prompt-results tiptap" v-html="markdownToHtml(message.content)"></div>

            <!-- Tool calls section -->
            <div
              v-if="message.metadata?.tool_calls && message.metadata.tool_calls.filter(t => t.name).length > 0"
              class="tool-calls-section q-mt-sm q-pa-sm"
            >
              <div class="text-caption text-weight-medium">
                <q-icon name="mdi-tools" size="xs" color="primary" />
                {{ message.metadata.tool_calls.filter(t => t.name).length }} tool call{{ message.metadata.tool_calls.filter(t => t.name).length !== 1 ? 's' : '' }}
                ({{ message.metadata.tool_calls.filter(t => t.name).map(t => t.name).join(', ') }})
              </div>
            </div>

            <!-- Metadata footer for assistant messages -->
            <div
              v-if="message.role === 'assistant' && message.metadata && Object.keys(message.metadata).length > 0"
              class="message-footer text-caption text-grey-5 q-mt-xs justify-end"
            >
              <span v-if="message?.metadata?.usage?.total_tokens">
                {{ message.metadata.usage.total_tokens }} total tokens
              </span>
            </div>
          </div>

          <!-- Streaming indicator below last user message -->
          <div
            v-if="message.role === 'user' && currentChat && currentChat.messages && index === currentChat.messages.length - 1 && deepAgentStore.isStreaming"
            class="streaming-indicator q-mt-xs"
          >
            <q-spinner-dots color="primary" size="md" />
          </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="currentChat && currentChat.messages && currentChat.messages.length === 0" class="text-caption q-px-md q-pb-lg text-grey-7">
      <div class="bordered q-pa-sm help-text-area">
        <q-icon name="mdi-robot" class="text-accent q-mb-xs" />
        Deep Agent Chat:
        <div class="q-mt-sm">
          The Deep Agent has comprehensive planning and reasoning abilities and will analyse your project, understand context deeply and then assist with writing, planning or brainstorming tasks.
        </div>
        <div class="q-mt-sm">
          <q-icon name="mdi-cloud-outline" />
          Uses Inscriptor AI cloud, consuming AI credits. Note: it is more demanding on credits than the regular Chat.
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="q-px-md">
      <div class="row q-gutter-sm items-start">
        <q-input
          v-model="userInput"
          borderless
          dense
          placeholder="Ask the Deep Agent anything..."
          class="col"
          rows="4"
          type="textarea"
          autofocus
          :disable="!currentChat || deepAgentStore.isStreaming"
          @keydown.enter.exact="handleSend"
          :max-height="100"
        >
          <template v-slot:append>
            <q-btn
              v-if="deepAgentStore.isStreaming"
              icon="mdi-stop"
              flat
              dense
              color="negative"
              @click="handleCancel"
              size="sm"
            >
              <q-tooltip>Cancel streaming</q-tooltip>
            </q-btn>
          </template>
        </q-input>

        <q-btn
          icon="mdi-send"
          color="accent"
          :disable="!currentChat || deepAgentStore.isStreaming || !userInput.trim()"
          @click="handleSend"
          rounded
        >
          <q-tooltip>Send message</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {ref, computed, watch, nextTick, onMounted, onUpdated} from "vue";
  import {useFileStore} from "stores/file-store";
  import {useLayoutStore} from "stores/layout-store";
  import {useResponsive} from "src/common/utils/screenUtils";
  import {useDeepAgentStore} from 'stores/deepagent-store';
  import {Notify} from 'quasar';
  import {markdownToHtml} from 'src/common/utils/textUtils';
  import {writeText} from '@tauri-apps/plugin-clipboard-manager';
  import AgentModeSelector from 'components/Common/AgentModeSelector.vue';

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();
  const deepAgentStore = useDeepAgentStore();
  const { isMobile } = useResponsive();

  const userInput = ref('');
  const chatScrollArea = ref(null);
  const componentRef = ref(null);

  const currentChat = computed(() => deepAgentStore.getCurrentChat);

  // Check if current status indicates an error
  const isErrorStatus = computed(() => {
    const status = deepAgentStore.getStatusMessage;
    return status && (status.toLowerCase().includes('error') || status.toLowerCase().includes('failed'));
  });

  // Auto-scroll to bottom when new message is added (only for user messages)
  watch(() => currentChat.value?.messages?.length, (newLength, oldLength) => {
    if (newLength > (oldLength || 0)) {
      // New message was added
      const lastMessage = currentChat.value.messages[newLength - 1];

      // Only scroll if last message is from user (user just sent a message)
      if (lastMessage.role === 'user') {
        nextTick(() => {
          scrollToBottom();
        });
      }
    }
  });

  // Initialize with a chat if none exists and add copy buttons
  onMounted(() => {
    if (!currentChat.value) {
      handleNewChat();
    }
    addCopyButtonsToBlockquotes();
  });

  function scrollToBottom() {
    if (chatScrollArea.value) {
      const scrollElement = chatScrollArea.value.$el || chatScrollArea.value;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }

  function handleNewChat() {
    const threadId = `thread-${Date.now()}`;
    deepAgentStore.createDeepAgentChat(threadId);
    userInput.value = '';
  }

  function handleClearChat() {
    if (!currentChat.value) return;

    currentChat.value.messages = [];
    currentChat.value.streamMetadata = {
      tokens: null,
      completionReason: null,
    };
  }

  async function handleSend() {
    if (!userInput.value.trim() || !currentChat.value || deepAgentStore.isStreaming) {
      return;
    }

    const query = userInput.value.trim();
    userInput.value = '';

    // TODO: Get actual project ID from fileStore or context
    const projectId = fileStore.projectId;

    try {
      await deepAgentStore.streamDeepAgent(currentChat.value.id, query, projectId);
    } catch (error) {
      Notify.create({
        message: `Error: ${error.message}`,
        color: 'negative',
        position: 'top',
        timeout: 3000
      });
    }
  }

  function handleCancel() {
    deepAgentStore.cancelStream();
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
      const blockquotes = document.querySelectorAll('.message-content blockquote');
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

  // Add copy buttons when DOM updates with new messages
  onUpdated(addCopyButtonsToBlockquotes);

</script>

<style scoped>
/* Status error styling in header */
.status-error {
  color: #ef5350 !important;
}

body.body--dark .status-error {
  color: #ff6b6b !important;
}

.scroll-area {
  overflow-y: auto;
  overflow-x: hidden;
}

.chat-history-container {
}

.chat-messages {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 20px;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.da-user-message {
  align-items: flex-end;
  margin-left: auto;
}

.da-user-message .message-bubble {
  background-color: rgba(79, 94, 214, 0.1);
  color: rgba(0, 0, 0, 0.87);
  border-radius: 8px;
  padding: 8px 12px;
}

body.body--dark .da-user-message .message-bubble {
  background-color: rgba(107, 126, 214, 0.2);
  color: rgba(255, 255, 255, 0.87);
}

.da-agent-message {
  align-items: flex-start;
  margin-right: auto;
}

.da-agent-message .message-bubble {
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.87);
  border-radius: 8px;
  padding: 8px 12px;
}

body.body--dark .da-agent-message .message-bubble {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

.message-header {
  display: flex;
  align-items: center;
  align-content: center;
  opacity: 0.8;
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 8px;
}

.message-content {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  margin-top: 4px;
}

body.body--dark .message-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tool-calls-section {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: background-color 0.2s;
}

body.body--dark .tool-calls-section {
  background-color: rgba(255, 255, 255, 0.05);
}

.tool-calls-section:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

body.body--dark .tool-calls-section:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.help-text-area {
  background-color: rgba(0, 0, 0, 0.02);
  color: rgba(0, 0, 0, 0.87);
}

body.body--dark .help-text-area {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

.streaming-indicator {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-right: 8px;
}

/* Code and pre tag styles */
.message-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: monospace;
}

.message-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.message-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

/* Blockquote styles */
.message-content :deep(blockquote) {
  position: relative;
  margin: 0.5em 0;
  padding: 0.5em 1em;
  color: rgba(0, 0, 0, 0.75);
  background: linear-gradient(135deg, #ffffff 80%, #ededf8 100%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* Copy button for blockquotes */
.message-content :deep(blockquote .blockquote-copy-btn) {
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

.message-content :deep(blockquote):hover .blockquote-copy-btn {
  opacity: 1;
}

.message-content :deep(blockquote .blockquote-copy-btn):hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  color: #7e7e8e;
}

.message-content :deep(blockquote p) {
  margin: 0;
}

.message-content :deep(blockquote p:not(:last-child)) {
  margin-bottom: 0.5em;
}

.message-content :deep(p:not(:last-child)) {
  margin-bottom: 0.5em;
}

/* Dark mode code and pre styles */
body.body--dark .message-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .message-content :deep(pre) {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Dark mode blockquote styles */
body.body--dark .message-content :deep(blockquote) {
  border-left: 4px solid rgba(107, 126, 214, 0.7);
  background: linear-gradient(135deg, rgba(107, 126, 214, 0.2) 80%, rgba(107, 126, 214, 0.3) 100%);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(107, 126, 214, 0.1);
}

/* Dark mode copy button styles */
body.body--dark .message-content :deep(blockquote .blockquote-copy-btn) {
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

body.body--dark .message-content :deep(blockquote .blockquote-copy-btn):hover {
  background-color: rgba(0, 0, 0, 0.8);
  color: rgba(255, 255, 255, 1);
}

/* System message styles (for errors) */
.da-system-message .message-content {
  color: #ef5350;
  font-weight: 500;
}

body.body--dark .da-system-message .message-content {
  color: #ff6b6b;
}

.da-system-message .message-bubble {
  background-color: rgba(239, 83, 80, 0.1);
}

body.body--dark .da-system-message .message-bubble {
  background-color: rgba(255, 107, 107, 0.15);
}
</style>
