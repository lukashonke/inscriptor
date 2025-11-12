<template>
  <q-dialog v-model="layoutStore.deepAgentDialogShown">
    <q-card :style="isMobile ? 'width: 100%; height: 100%;' : 'min-width: 800px; height: 80vh;'" class="column">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6">Inscriptor Deep Agent</div>
        <q-space />

        <!-- Status indicator -->
        <q-chip
          v-if="currentChat"
          :color="deepAgentStore.isStreaming ? 'accent' : 'positive'"
          text-color="white"
          size="sm"
          class="q-mr-sm"
        >
          <q-icon
            :name="deepAgentStore.isStreaming ? 'mdi-loading mdi-spin' : 'mdi-check-circle'"
            size="xs"
            class="q-mr-xs"
          />
          {{ deepAgentStore.getStatusMessage }}
        </q-chip>

        <q-btn icon="close" flat round dense @click="layoutStore.deepAgentDialogShown = false" />
      </q-card-section>

      <q-separator />

      <!-- Chat messages area -->
      <q-card-section ref="chatScrollArea" class="col scroll-area q-pa-md">
        <div v-if="!currentChat" class="text-center text-grey-6 q-mt-xl">
          <q-icon name="mdi-robot" size="64px" class="q-mb-md" />
          <div class="text-h6">No active chat</div>
          <div class="text-body2 q-mt-sm">Create a new chat to get started</div>
          <q-btn
            color="primary"
            label="New Chat"
            class="q-mt-md"
            @click="handleNewChat"
          />
        </div>

        <div v-else class="chat-history-container" style="margin-bottom: 100px;">
          <!-- Help text for empty chat -->
          <div v-if="currentChat.messages.length === 0" class="text-caption q-pa-md q-pb-sm q-pt-sm text-grey-7">
            <div class="bordered q-pa-sm help-text-area">
              <q-icon name="mdi-robot" class="text-accent q-mb-xs" />
              Deep Agent Chat:
              <div class="q-mt-sm">
                The Deep Agent has comprehensive planning and reasoning abilities and will analyse your project, understand context and assist with complex writing, planning or brainstorming tasks.
              </div>
              <div class="q-mt-sm">
                <q-icon name="mdi-cloud-outline" />
                Uses Inscriptor AI cloud, consuming AI credits. Note that it is more demanding on credits than the regular Chat.
              </div>
            </div>
          </div>

          <div class="chat-messages">
          <!-- Loop through all messages -->
          <div
            v-for="(message, index) in currentChat.messages"
            :key="message.id"
            :class="['message-wrapper', message.role === 'user' ? 'da-user-message' : 'da-agent-message', 'q-mb-md']"
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
              v-if="message.role === 'user' && index === currentChat.messages.length - 1 && deepAgentStore.isStreaming"
              class="streaming-indicator q-mt-xs"
            >
              <q-spinner-dots color="primary" size="md" />
            </div>
          </div>

          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Input area -->
      <q-card-section class="q-pt-sm q-pb-sm">
        <div class="row q-gutter-sm">
          <q-input
            v-model="userInput"
            outlined
            dense
            placeholder="Ask the Deep Agent anything..."
            class="col"
            :disable="!currentChat || deepAgentStore.isStreaming"
            @keydown.enter.exact="handleSend"
            autogrow
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
            color="primary"
            :disable="!currentChat || deepAgentStore.isStreaming || !userInput.trim()"
            @click="handleSend"
            rounded
          >
            <q-tooltip>Send message</q-tooltip>
          </q-btn>
        </div>

        <!-- Action buttons -->
        <div class="row q-gutter-xs q-mt-sm">
          <q-btn
            v-if="currentChat"
            icon="mdi-plus"
            label="New Chat"
            size="sm"
            flat
            dense
            @click="handleNewChat"
            :disable="deepAgentStore.isStreaming"
          />
          <q-btn
            v-if="currentChat"
            icon="mdi-delete"
            label="Clear"
            size="sm"
            flat
            dense
            color="negative"
            @click="handleClearChat"
            :disable="deepAgentStore.isStreaming"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {ref, computed, watch, nextTick} from "vue";
  import {useFileStore} from "stores/file-store";
  import {useLayoutStore} from "stores/layout-store";
  import {useResponsive} from "src/common/utils/screenUtils";
  import {useDeepAgentStore} from 'stores/deepagent-store';
  import {Notify} from 'quasar';
  import {markdownToHtml} from 'src/common/utils/textUtils';

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();
  const deepAgentStore = useDeepAgentStore();
  const { isMobile } = useResponsive();

  const userInput = ref('');
  const chatScrollArea = ref(null);

  const currentChat = computed(() => deepAgentStore.getCurrentChat);

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

  // Initialize with a chat if none exists
  watch(() => layoutStore.deepAgentDialogShown, (shown) => {
    if (shown && !currentChat.value) {
      handleNewChat();
    }
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

    Notify.create({
      message: 'New chat created',
      color: 'positive',
      position: 'top',
      timeout: 1000
    });
  }

  function handleClearChat() {
    if (!currentChat.value) return;

    currentChat.value.messages = [];
    currentChat.value.streamMetadata = {
      tokens: null,
      completionReason: null,
    };

    Notify.create({
      message: 'Chat cleared',
      color: 'info',
      position: 'top',
      timeout: 1000
    });
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

    Notify.create({
      message: 'Streaming cancelled',
      color: 'warning',
      position: 'top',
      timeout: 1500
    });
  }

</script>

<style scoped>
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
</style>
