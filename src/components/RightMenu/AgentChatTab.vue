<template>
  <div class="q-mx-md full-width">
    <div class="column full-height q-ml-md">

      <!-- Chat controls and pagination -->
      <div class="col-auto">
        <div class="row q-mb-md q-mt-md" v-if="maxChatsPage > 0">
          <div class="col flex">
            <div class="col-auto flex items-center justify-center">
              <q-pagination :max="maxChatsPage" v-model="page" :disable="aiAgentStore.agentChats.isAgentRunning || aiAgentStore.isAgentActive" direction-links :boundary-numbers="false" :boundary-links="false" :max-pages="isMobile ? 3 : 5" />
            </div>
            <div v-if="aiAgentStore.agentChats.isAgentRunning" class="col menu-subtitle flex items-center justify-center">
              <q-spinner-ios class="q-mr-xs"></q-spinner-ios>
              {{ aiAgentStore.agentState === 'waiting_for_user' ? 'AI is waiting for approval...' : 'AI is working...' }}
              <q-btn dense outline @click="aiAgentStore.stopAgentChatExecution()" label="Stop" size="sm" class="q-ml-xs q-py-none" color="red"/>
            </div>
            <!-- Current file indicator -->
            <div class="col flex items-center justify-center file-indicator mobile-hide" v-else-if="currentFile" >
              <q-chip>
                <FileDetailItem :file="currentFile" hide-context-type />
              </q-chip>
            </div>
          </div>
          <div class="col-auto flex items-center" v-if="maxChatsPage > 0">
            <div class="col-auto flex items-center">
              <q-btn color="accent" @click="newChat" :disable="aiAgentStore.agentChats.isAgentRunning || aiAgentStore.isAgentActive" size="md" icon="mdi-pencil-box-outline" class="" :label="isMobile ? undefined : 'chat'" :padding="isMobile ? 'xs md' : undefined">
                <q-tooltip>
                  Start a new AI conversation
                </q-tooltip>
              </q-btn>
            </div>

            <div class="col-auto flex items-center">
              <q-btn flat color="negative" icon="mdi-delete-outline" size="md" :padding="isMobile ? 'xs md' : undefined">
                <q-menu>
                  <q-list dense>
                    <q-item clickable @click="removeCurrentChat" v-close-popup>
                      <q-item-section side>
                        <q-icon name="mdi-close" />
                      </q-item-section>
                      <q-item-section>
                        Remove current conversation
                      </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="removeAllChats">
                      <q-item-section side>
                        <q-icon name="mdi-delete-outline" color="negative" />
                      </q-item-section>
                      <q-item-section>
                        Remove all AI conversations
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
        </div>
        <div v-else class="flex justify-center q-mb-md q-mt-lg">
          <q-btn color="accent" @click="newChat" size="md" icon="mdi-robot" class="" label="New AI chat">
            <q-tooltip>
              Start a new conversation with AI
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Chat messages -->
      <div class="col">
        <template v-if="!currentChatMessages || currentChatMessages.length === 0">
          <div class="q-gutter-y-sm q-ml-xs chat-history-container justify-center q-mt-xl" style="margin-bottom: 100px;">
            <div class="row full-width justify-center" style="">
              <q-card flat bordered class="col" style="max-width: 400px;">
                <q-card-section class="q-gutter-y-xs">
                  <div class="row text-caption">
                    Prompt for this chat:
                  </div>
                  <div class="row">
                    <div class="col">
                      <q-select v-model="promptForAgentChatId" filled dense :options="mergedPrompts" >
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps">
                            <q-item-section>
                              <q-item-label>{{ scope.opt.label }}</q-item-label>
                              <q-item-label caption v-if="scope.opt.description?.length > 0 ?? false">{{ scope.opt.description }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>
                  </div>
                  <template v-if="promptForAgentChatId && supportsReasoning(promptStore.getModel(promptStore.currentModelForAgentChatId))">
                    <div class="row text-caption q-mt-md">
                      Reasoning Effort:
                    </div>
                    <div class="row">
                      <div class="col">
                        <q-select
                          dense
                          outlined
                          class="mobile-only"
                          :options="reasoningEffortOptions"
                          v-model="reasoningEffortForAgentChat"
                        />
                        <q-btn-toggle
                          unelevated
                          no-caps
                          class="bordered mobile-hide"
                          :options="reasoningEffortOptions"
                          v-model="reasoningEffortForAgentChat"
                        />
                      </div>
                    </div>
                  </template>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </template>

        <div class="q-gutter-y-sm q-ml-xs chat-history-container" style="margin-bottom: 100px;">
          <div class="chat-messages-container-unhinged">
            <div v-for="message in currentChatMessages" :key="message.id" class="full-width">
              <!-- Display message content -->
              <AgentPromptResult
                :message="message"
                :tool-call-results="toolCallResults"
              />

              <!-- Display tool calls separately with assistant styling -->
              <div v-if="message.toolCalls && message.toolCalls.length > 0" class="q-mt-sm">
                <div v-for="(toolCall, index) in message.toolCalls" :key="index" class="tool-call-container q-mb-sm">
                  <ToolCallDisplay
                    :toolCall="toolCall"
                    :toolResult="getToolResult(toolCall)"
                    :isPending="isToolPending(toolCall)"
                    :isSelected="isToolSelected(toolCall)"
                  />
                </div>
              </div>
            </div>

            <!-- Loading indicator when agent is processing -->
            <AgentPromptResult
              v-if="aiAgentStore.agentChats.isAgentRunning && !aiAgentStore.pendingToolBatch"
              :is-loading="true"
              :loading-text="aiAgentStore.agentState === 'waiting_for_user' ? 'Waiting for approval' : 'Thinking'"
              :tool-call-results="toolCallResults"
            />

            <!-- Batch Tool Approval Widget (moved here, after messages) -->
            <div v-if="aiAgentStore.pendingToolBatch" class="row q-mt-sm">
              <div class="batch-approval-message chat-assistant-message agent-awaiting-confirmation-simple">
                <div class="chat-message-header">
                  <span class="chat-message-role">AI:</span>
                  <span v-if="isSingleToolApproval" class="text-caption">wants to use a tool</span>
                  <span v-else class="text-caption">
                    wants to use {{ aiAgentStore.pendingToolBatch.length }} tools
                  </span>
                </div>
                <div class="chat-message-content">
                  <!-- Tool List -->
                  <div class="tool-list q-mt-sm">
                    <div
                      v-for="tool in aiAgentStore.pendingToolBatch"
                      :key="tool.id"
                      class="tool-item q-pa-sm q-mb-xs rounded-borders"
                      :class="{ 'tool-item-selected': aiAgentStore.selectedTools.includes(tool.id) }"
                    >
                      <div class="flex items-center">
                        <!-- Checkbox for multiple tools only -->
                        <q-checkbox
                          v-if="!isSingleToolApproval"
                          :model-value="aiAgentStore.selectedTools.includes(tool.id)"
                          @update:model-value="aiAgentStore.toggleTool(tool.id)"
                          class="q-mr-sm"
                          size="sm"
                        >
                          <div class="flex items-center">
                            <q-icon :name="getToolIcon(tool.function.name)" class="q-mr-xs q-ml-sm" size="xs" />
                            <span class="text-caption">{{ getToolFriendlyName(tool) }}</span>
                            <span class="text-caption text-grey-7 q-ml-sm">
                              {{ getToolDescription(tool) }}
                            </span>
                          </div>
                        </q-checkbox>

                        <!-- Single tool: show without checkbox -->
                        <div v-else class="flex items-center">
                          <q-icon :name="getToolIcon(tool.function.name)" class="q-mr-xs" size="xs" />
                          <span class="text-caption">{{ getToolFriendlyName(tool) }}</span>
                          <span class="text-caption text-grey-7 q-ml-sm">
                            {{ getToolDescription(tool) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action buttons -->
                  <div class="batch-actions q-mt-sm">
                    <div class="row q-gutter-sm">
                      <!-- Batch Controls (only for multiple tools) -->
                      <template v-if="!isSingleToolApproval">
                        <div class="col-auto">
                          <q-btn
                            flat
                            dense
                            @click="aiAgentStore.selectAll"
                            label="Select All"
                            no-caps
                            size="sm"
                            class="text-caption"
                          />
                        </div>
                        <div class="col-auto">
                          <q-btn
                            flat
                            dense
                            no-caps
                            @click="aiAgentStore.selectNone"
                            label="Select None"
                            size="sm"
                            class="text-caption"
                          />
                        </div>
                      </template>

                      <div class="col"></div>

                      <!-- Execute/Refuse -->
                      <div class="col-auto">
                        <q-btn
                          flat
                          color="negative"
                          @click="aiAgentStore.cancelBatch"
                          label="Refuse"
                          size="sm"
                        />
                      </div>
                      <div class="col-auto">
                        <q-btn
                          color="accent"
                          @click="aiAgentStore.executeBatch"
                          :label="isSingleToolApproval ? 'Allow' : (selectedToolCount === aiAgentStore.pendingToolBatch.length ? `Allow All (${selectedToolCount})` : `Allow Selected (${selectedToolCount})`)"
                          size="sm"
                          :disable="selectedToolCount === 0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="col-auto"  >
        <div class="full-width" style="position: absolute; bottom: 0; right: 0; z-index: 1000;">
          <div class="q-mr-lg">
            <div class="">

              <div class="text-caption q-pa-md q-pb-sm q-pt-sm text-grey-7" v-if="currentChatMessages.length === 0">
                <div class="bordered q-pa-sm help-text-area">
                  <q-icon name="mdi-robot" class="text-accent q-mb-xs" />
                  AI Agent Chat:
                  <div class="q-mt-sm">
                    It can analyze, look for context in project and modify your document, asking for your approvals before. Start by describing what you want the AI to do.
                  </div>
                  <div class="q-mt-sm">
                    <q-icon name="mdi-cloud-outline" />
                    Agent uses Inscriptor AI cloud, consuming AI credits.
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col q-ml-sm rounded-borders q-px-sm">
                  <q-input
                    v-model="inputText"
                    :label="currentModelName && currentPromptName ? `Message ${currentModelName} • ${currentPromptName}...` : 'Message AI...'"
                    borderless
                    class="full-width"
                    rows="4"
                    type="textarea"
                    lines
                    autofocus
                    dense
                    ref="inputRef"
                    @keydown="onInputKey"
                    :disable="aiAgentStore.agentChats.isAgentRunning"
                  />
                </div>
                <div class="col-auto q-ml-sm">
                  <div class="column">
                    <div class="col">
                      <q-btn
                        icon="mdi-send"
                        color="accent"
                        @click="sendMessage()"
                        :disable="!inputText.trim() || aiAgentStore.agentChats.isAgentRunning || promptForAgentChatId === null"
                      />
                    </div>
                    <div class="col q-mt-md mobile-hide">
                      <q-btn flat icon="mdi-cog" @click="settingsOpen = !settingsOpen" />
                    </div>
                  </div>
                </div>
              </div>

              <q-slide-transition>
                <q-card-section v-if="settingsOpen" class="q-gutter-y-xs">
                  <div class="row">
                    <div class="col">
                      <q-select v-model="promptForAgentChatId" filled dense label="Select AI Prompt" :options="mergedPrompts" >
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps">
                            <q-item-section>
                              <q-item-label>{{ scope.opt.label }}</q-item-label>
                              <q-item-label caption v-if="scope.opt.description?.length > 0 ?? false">{{ scope.opt.description }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>
                  </div>
                  <template v-if="promptForAgentChatId && supportsReasoning(promptStore.getModel(promptStore.currentModelForAgentChatId))">
                    <div class="row text-caption q-mt-md">
                      <q-icon name="mdi-thought-bubble" size="15px" class="q-mr-xs" />
                      Reasoning Effort:
                    </div>
                    <div class="row">
                      <div class="col">
                        <q-btn-toggle
                          unelevated
                          no-caps
                          class="bordered"
                          :options="reasoningEffortOptions"
                          v-model="reasoningEffortForAgentChat"
                        />
                      </div>
                    </div>
                  </template>
                </q-card-section>
              </q-slide-transition>

            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useAiAgentStore } from 'stores/aiagent-store';
import { usePromptStore } from 'stores/prompt-store';
import { useFileStore } from 'stores/file-store';
import { Dialog } from 'quasar';
import ToolCallDisplay from './ToolCallDisplay.vue';
import AgentPromptResult from './AgentPromptResult.vue';
import FileDetailItem from 'components/Common/Files/FileDetailItem.vue';
import {isImageGenerationModel, reasoningEffortValuesLabeled, supportsReasoning} from 'src/common/helpers/modelHelper';
import {useLayoutStore} from 'stores/layout-store';
import {useResponsive} from 'src/common/utils/screenUtils';

const aiAgentStore = useAiAgentStore();
const promptStore = usePromptStore();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const { isMobile } = useResponsive();

const inputText = ref('');
const inputRef = ref(null);
const settingsOpen = ref(false);

// Computed properties
const currentChat = computed(() => aiAgentStore.getActiveAgentChat());

const currentFile = computed(() => fileStore.selectedFile);

const currentChatMessages = computed(() => {
  const messages = currentChat.value?.messages || [];
  // Filter out hidden messages (initial system and user prompts)
  return messages.filter(msg => !msg.hidden);
});

// Create a map of tool call IDs to their results
const toolCallResults = computed(() => {
  const messages = currentChat.value?.messages || [];
  const results = new Map();

  messages.forEach(msg => {
    if (msg.role === 'tool' && msg.toolCallId) {
      results.set(msg.toolCallId, msg.content);
    }
  });

  return results;
});

// Enhanced function to get tool result for a specific tool call
function getToolResult(toolCall) {
  if (!toolCall?.id) return null;
  return toolCallResults.value.get(toolCall.id) || null;
}

const allChats = computed(() => aiAgentStore.agentChats.chats);

const maxChatsPage = computed(() => allChats.value.length);

const page = computed({
  get: () => {
    const index = allChats.value.findIndex(c => c.id === aiAgentStore.agentChats.activeChat);
    return index >= 0 ? index + 1 : 1;
  },
  set: (value) => {
    const chatIndex = value - 1;
    if (chatIndex >= 0 && chatIndex < allChats.value.length) {
      aiAgentStore.setActiveAgentChat(allChats.value[chatIndex].id);
    }
  }
});

// Model and prompt selection
const models = computed(() => promptStore.models.filter(m => !isImageGenerationModel(m)).map(tab => ({label: tab.name, value: tab.id})));

const modelForAgentChatId = computed({
  get: () => {
    const t = promptStore.getModel(promptStore.currentModelForAgentChatId);
    if(!t) return null;
    return {
      label: t.name,
      value: t.id,
    };
  },
  set: (value) => {
    promptStore.currentModelForAgentChatId = value.value;

    promptStore.currentPromptForAgentChatId = null;
    if(promptStore.currentPromptForAgentChatId === null) {
      // find first prompt of promptType === 'chat'
      promptStore.currentPromptForAgentChatId = promptStore.prompts.find(p => p.modelId === promptStore.currentModelForAgentChatId && p.promptType === 'chat')?.id;
    }
  }
});

// Merged prompts from all models
const mergedPrompts = computed(() => {
  const allChatPrompts = [];

  promptStore.models
    .filter(m => !isImageGenerationModel(m))
    .forEach(model => {
      const modelPrompts = promptStore.prompts
        .filter(p => p.modelId === model.id && p.promptType === 'chat')
        .map(prompt => ({
          label: `${prompt.title} (${model.name})`,
          value: prompt.id,
          modelId: model.id,
          modelName: model.name,
          description: prompt.description
        }));
      allChatPrompts.push(...modelPrompts);
    });

  return allChatPrompts;
});

const promptForAgentChatId = computed({
  get: () => {
    const t = promptStore.prompts.find(p => p.id === promptStore.currentPromptForAgentChatId);
    if(!t) return null;
    return {
      label: t.title,
      value: t.id,
    };
  },
  set: (value) => {
    const selectedPrompt = mergedPrompts.value.find(p => p.value === value.value);
    if (selectedPrompt) {
      promptStore.currentModelForAgentChatId = selectedPrompt.modelId;
      promptStore.currentPromptForAgentChatId = value.value;
      // Reset reasoning effort when prompt changes
      promptStore.currentReasoningEffortForAgentChat = null;
    }
  }
});

// Computed properties for displaying current model and prompt names
const currentModelName = computed(() => {
  const model = promptStore.getModel(promptStore.currentModelForAgentChatId);
  return model?.name || null;
});

const currentPromptName = computed(() => {
  const prompt = promptStore.prompts.find(p => p.id === promptStore.currentPromptForAgentChatId);
  return prompt?.title || null;
});

// Reasoning effort options with "Unset" as default
const reasoningEffortOptions = computed(() => {
  return [
    { label: 'Default', value: null },
    ...reasoningEffortValuesLabeled
  ];
});

// Reasoning effort computed property
const reasoningEffortForAgentChat = computed({
  get: () => {
    return promptStore.currentReasoningEffortForAgentChat;
  },
  set: (value) => {
    promptStore.currentReasoningEffortForAgentChat = value;
  }
});

// Batch approval computed properties
const isSingleToolApproval = computed(() => {
  return aiAgentStore.pendingToolBatch && aiAgentStore.pendingToolBatch.length === 1;
});

const selectedToolCount = computed(() => {
  return aiAgentStore.selectedTools ? aiAgentStore.selectedTools.length : 0;
});

// Methods
async function onInputKey(e) {
  if (!e) return;

  if ((e.key === 'Enter' && !e.shiftKey)) {
    if (inputText.value.trim().length > 0) {
      e.stopPropagation();
      e.preventDefault();
      await sendMessage();
    }
  }
}

async function sendMessage() {
  if (!inputText.value.trim() || aiAgentStore.agentChats.isAgentRunning || !promptForAgentChatId.value) {
    return;
  }

  const prompt = promptStore.prompts.find(p => p.id === promptForAgentChatId.value.value);
  if (!prompt) {
    return;
  }

  const message = inputText.value.trim();

  await aiAgentStore.executeAgentPrompt(message, prompt, promptStore.currentReasoningEffortForAgentChat);

  // Clear input and restore focus after the async operation
  inputText.value = '';
  nextTick(() => {
    inputRef.value?.focus();
  });

  // Scroll to bottom after sending message
  setTimeout(() => {
    const container = document.querySelector('.ai-panel.scroll');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 100);
}

function newChat() {
  aiAgentStore.createAgentChat();
  layoutStore.notifyNewChat();
}

function removeCurrentChat() {
  if (aiAgentStore.agentChats.activeChat) {
    aiAgentStore.deleteAgentChat(aiAgentStore.agentChats.activeChat);
  }
}

function removeAllChats() {
  Dialog.create({
    title: 'Confirm',
    message: 'Are you sure you want to delete all AI conversations?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    aiAgentStore.deleteAllAgentChats();
  });
}

// Initialize on mount
onMounted(() => {
  // Create initial chat if none exists
  if (allChats.value.length === 0) {
    aiAgentStore.createAgentChat();
  }

  if (promptStore.currentModelForAgentChatId && !promptStore.getModel(promptStore.currentModelForAgentChatId)) {
    promptStore.currentModelForAgentChatId = null;
    promptStore.currentPromptForAgentChatId = null;
  }

  if (promptStore.currentPromptForAgentChatId && !promptStore.getPromptById(promptStore.currentPromptForAgentChatId)) {
    promptStore.currentModelForAgentChatId = null;
    promptStore.currentPromptForAgentChatId = null;
  }

  // Auto-select first model and prompt if none selected
  if (!promptStore.currentModelForAgentChatId && promptStore.models.length > 0) {
    const firstModel = promptStore.models[0];
    modelForAgentChatId.value = {
      label: firstModel.name,
      value: firstModel.id
    };
    // The modelForAgentChatId setter will auto-select the first chat prompt
  }
});

// Auto-scroll to bottom when new messages arrive
watch(currentChatMessages, () => {
  setTimeout(() => {
    const container = document.querySelector('.ai-panel.scroll');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 100);
}, { deep: true });

// Also auto-scroll when batch approval widget appears
watch(() => aiAgentStore.pendingToolBatch, () => {
  if (aiAgentStore.pendingToolBatch) {
    setTimeout(() => {
      const container = document.querySelector('.ai-panel.scroll');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
});

// Helper methods for batch approval widget
function getToolIcon(toolName) {
  const icons = {
    'stop': 'mdi-stop-circle',
    'getCurrentDocument': 'mdi-file-document-outline',
    'getAvailableAIPrompts': 'mdi-lightbulb-outline',
    'executeAIPrompt': 'mdi-play-circle-outline',
    'listProjectFiles': 'mdi-folder-outline',
    'readFile': 'mdi-file-eye-outline',
    'search': 'mdi-magnify',
    'setFileSummary': 'mdi-file-edit-outline',
    'getAllContextTypes': 'mdi-shape-outline',
    'editDocument': 'mdi-file-edit',
    'createFile': 'mdi-file-plus-outline'
  };
  return icons[toolName] || 'mdi-tools';
}

function getToolFriendlyName(tool) {
  const names = {
    'stop': 'Stop Processing',
    'getCurrentDocument': 'Get Current Document',
    'getAvailableAIPrompts': 'Get Available AI Prompts',
    'executeAIPrompt': 'Execute AI Prompt',
    'listProjectFiles': 'List Project Files',
    'readFile': 'Read File',
    'search': 'Search',
    'setFileSummary': 'Set File Summary',
    'getAllContextTypes': 'Get Context Types',
    'editDocument': 'Edit Document',
    'createFile': 'Create File'
  };
  return names[tool.function.name] || tool.function.name;
}

function getToolDescription(tool) {
  const { name } = tool.function;
  const args = JSON.parse(tool.function.arguments || '{}');

  switch (name) {
    case 'readFile':
      const readType = args.readType || 'full';
      const fileId = args.fileId;
      if (fileId && fileStore.getFile) {
        const file = fileStore.getFile(fileId);
        const fileTitle = file?.title || `${fileId.substring(0, 8)}...`;
        return `Read ${readType} content of "${fileTitle}"`;
      }
      return `Read ${readType} content of file`;

    case 'search':
      const query = args.searchQuery;
      const context = args.contextType;
      const searchType = args.searchType || 'all';
      let desc = `"${query}"`;
      if (context) desc += ` in ${context} files`;
      if (searchType !== 'all') desc += ` (${searchType} only)`;
      return desc;

    case 'listProjectFiles':
      const filterType = args.contextType;
      return filterType ? `List ${filterType} files` : 'List all project files';

    case 'executeAIPrompt':
      const promptId = args.promptId;
      if (promptId && promptStore.prompts) {
        const prompt = promptStore.prompts.find(p => p.id === promptId);
        return `Execute prompt "${prompt?.title || promptId}"`;
      }
      return 'Execute AI prompt';

    case 'editDocument':
      const editFileId = args.fileId;
      if (editFileId && fileStore.getFile) {
        const file = fileStore.getFile(editFileId);
        const fileTitle = file?.title || `${editFileId.substring(0, 8)}...`;
        return `Edit text in "${fileTitle}"`;
      }
      return 'Edit text in current file';

    case 'setFileSummary':
      return args.fileId ? 'Update file summary' : 'Update current file summary';

    case 'getCurrentDocument':
      return 'Get current document content with paragraph IDs';

    case 'getAvailableAIPrompts':
      return 'Get list of available AI prompts';

    case 'getAllContextTypes':
      return 'Get available context types in project';

    case 'createFile':
      const title = args.title || 'Untitled';
      const contextType = args.contextType;
      let createDesc = `Create "${title}"`;
      if (contextType) {
        createDesc += ` in ${contextType}`;
      }
      return createDesc;

    default:
      return `Execute ${name} tool`;
  }
}

// Check if a tool call is pending approval
function isToolPending(toolCall) {
  if (!toolCall?.id || !aiAgentStore.pendingToolBatch) return false;
  return aiAgentStore.pendingToolBatch.some(t => t.id === toolCall.id);
}

// Check if a tool call is selected for execution
function isToolSelected(toolCall) {
  if (!toolCall?.id || !aiAgentStore.selectedTools) return false;
  return aiAgentStore.selectedTools.includes(toolCall.id);
}
</script>

<style scoped>
.chat-history-container {
}

.left-border {
  border-left: 2px solid var(--q-primary);
}

.help-text-area {
  background-color: rgba(0, 0, 0, 0.02);
  color: rgba(0, 0, 0, 0.87);
}

body.body--dark .help-text-area {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

.file-indicator {
}

body.body--dark .file-indicator {
}


.tool-call-container {
  max-width: 80%;
}

.batch-approval-message {
  max-width: 80%;
  margin-right: auto;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 8px;
}

.batch-approval-message .chat-message-header {
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 4px;
}

.batch-approval-message .tool-list {
  max-height: 300px;
  overflow-y: auto;
}

.batch-approval-message .tool-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.batch-approval-message .tool-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.batch-approval-message .tool-item-selected {
}

.batch-approval-message .batch-actions {
}

body.body--dark .batch-approval-message {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

body.body--dark .batch-approval-message .tool-item {
  background-color: rgba(255, 255, 255, 0.05);
}

body.body--dark .batch-approval-message .tool-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

body.body--dark .batch-approval-message .batch-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tool-call-container :deep(.q-card) {
  background-color: transparent;
  border: none;
  box-shadow: none;
}

body.body--dark .tool-call-container {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
  border-radius: 8px;
}
</style>
