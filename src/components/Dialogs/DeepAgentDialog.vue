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
          :color="deepAgentStore.isStreaming ? 'orange' : 'positive'"
          text-color="white"
          size="sm"
          class="q-mr-sm"
        >
          <q-icon
            :name="deepAgentStore.isStreaming ? 'mdi-loading mdi-spin' : 'mdi-check-circle'"
            size="xs"
            class="q-mr-xs"
          />
          {{ deepAgentStore.isStreaming ? 'Streaming...' : 'Ready' }}
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

        <div v-else class="chat-messages">
          <!-- Loop through all messages -->
          <div
            v-for="message in currentChat.messages"
            :key="message.id"
            :class="['message-wrapper', message.role === 'user' ? 'user-message' : 'agent-message', 'q-mb-md']"
          >
            <div class="message-bubble">
              <!-- Message header for assistant messages -->
              <div v-if="message.role === 'assistant'" class="message-header q-mb-xs">
                <q-icon name="mdi-robot" size="xs" class="q-mr-xs" />
                <span class="text-caption text-weight-medium">Deep Agent</span>
              </div>

              <!-- Message content -->
              <div class="message-content">{{ message.content }}</div>

              <!-- Streaming indicator for empty assistant messages -->
              <q-spinner-dots v-if="message.isStreaming && !message.content" color="primary" size="md" />

              <!-- Tool calls section -->
              <div
                v-if="message.metadata?.tool_calls && message.metadata.tool_calls.filter(t => t.name).length > 0"
                class="tool-calls-section q-mt-sm q-pa-sm"
              >
                <div class="text-caption text-weight-medium">
                  <q-icon name="mdi-tools" size="xs" />
                  {{ message.metadata.tool_calls.filter(t => t.name).length }} tool call{{ message.metadata.tool_calls.filter(t => t.name).length !== 1 ? 's' : '' }}
                  ({{ message.metadata.tool_calls.filter(t => t.name).map(t => t.name).join(', ') }})
                </div>
              </div>

              <!-- Metadata footer for assistant messages -->
              <div
                v-if="message.role === 'assistant' && message.metadata && Object.keys(message.metadata).length > 0"
                class="message-footer text-caption text-grey-6 q-mt-xs"
              >
                <span v-if="message.metadata.tokens">
                  <q-icon name="mdi-counter" size="xs" /> {{ message.metadata.tokens }} tokens
                </span>
                <span v-if="message.metadata.model" class="q-ml-sm">
                  <q-icon name="mdi-brain" size="xs" /> {{ message.metadata.model }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty state when no messages -->
          <div v-if="currentChat.messages.length === 0" class="text-center text-grey-6 q-mt-xl">
            <q-icon name="mdi-chat-outline" size="48px" class="q-mb-md" />
            <div class="text-body2">Start a conversation with the Deep Agent</div>
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

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();
  const deepAgentStore = useDeepAgentStore();
  const { isMobile } = useResponsive();

  const userInput = ref('');
  const chatScrollArea = ref(null);

  const currentChat = computed(() => deepAgentStore.getCurrentChat);

  // Initialize with a chat if none exists
  watch(() => layoutStore.deepAgentDialogShown, (shown) => {
    if (shown && !currentChat.value) {
      handleNewChat();
    }
  });

  function scrollToUserMessage() {
    if (chatScrollArea.value && currentChat.value?.messages) {
      nextTick(() => {
        const scrollElement = chatScrollArea.value.$el || chatScrollArea.value;
        const messages = scrollElement.querySelectorAll('.message-wrapper');

        if (messages.length > 0) {
          // Get all user messages
          const userMessages = Array.from(messages).filter(msg =>
            msg.classList.contains('user-message')
          );

          if (userMessages.length > 0) {
            // Get the last user message (most recent)
            const lastUserMessage = userMessages[userMessages.length - 1];
            // Scroll so user message is at top of visible area
            lastUserMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
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

      // Scroll so the new user message is at the top (Gemini-style)
      scrollToUserMessage();
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

.user-message {
  align-items: flex-end;
  margin-left: auto;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 18px 18px 4px 18px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.agent-message {
  align-items: flex-start;
  margin-right: auto;
}

.agent-message .message-bubble {
  background: var(--q-dark);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

body.body--light .agent-message .message-bubble {
  background: #f5f5f5;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.message-header {
  display: flex;
  align-items: center;
  opacity: 0.8;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

body.body--light .message-footer {
}

.tool-calls-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid var(--q-primary);
}

body.body--light .tool-calls-section {
  background: rgba(0, 0, 0, 0.03);
}

.tool-call-item {
  font-family: monospace;
  font-size: 12px;
}


</style>
