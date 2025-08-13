<template>
  <div class="input-with-chat-ai">
    <!-- Two-column layout -->
    <div class="row q-gutter-sm">
      <!-- Left Column - Current Input -->
      <div :class="showAiColumn ? 'col' : 'col-12'" class="input-column">
        <div class="current-input-section" >
          <div class="section-label text-caption text-grey-6 q-mb-sm flex items-center" style="height: 35px;">Current</div>
          <div class="relative-position">
            <q-input
              :label="label"
              v-bind="inputProps"
              v-model="internalText"
              :type="type"
              :borderless="borderless"
              :filled="filled"
              :dense="dense"
              :input-style="inputStyle"
              :autofocus="autofocus"
              :autogrow="autogrow"
              :spellcheck="automaticTextCorrection"
              @update:modelValue="onInput"
            />
          </div>
        </div>
      </div>

      <!-- Right Column - AI Proposal with Diff -->
      <transition name="ai-column">
        <div v-if="showAiColumn" class="col ai-column">
          <div class="ai-proposal-section">
            <div class="row items-center justify-between q-mb-sm " style="height: 35px;">
              <div class="section-label text-caption text-grey-6 flex items-center">
                <q-icon name="mdi-creation-outline" class="q-mr-xs" />
                AI Suggestion
              </div>
              <q-btn
                v-if="aiProposedValue"
                dense
                color="primary"
                padding="2px 8px"
                style="height: 30px; width: 70px;"
                no-caps
                @click="useAiProposal"
                class="text-caption"
              >
                <q-icon name="mdi-plus" size="16px" class="q-pr-sm" />
                Use
              </q-btn>
            </div>
            <div class="ai-proposal-content">
              <div
                v-if="aiProposedValue"
                class="diff-display q-pa-sm bordered scroll-y"
                style="max-height: 305px;"
                v-html="diffHtml"
              />
              <div
                v-else
                class="placeholder-text q-pa-sm bordered text-grey-5 text-center text-caption"
              >
                <q-spinner-grid size="16px" class="q-my-md"/>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Bottom Chat Input -->
    <div class="chat-input-section">
      <div class="row q-gutter-sm">
        <div class="col">
          <q-input
            v-model="chatInput"
            placeholder="Ask AI to modify..."
            autofocus
            borderless
            class="q-pl-xs"
            dense
            @keyup.enter="sendChatMessage"
            :disable="isProcessing"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-creation-outline" />
            </template>
          </q-input>
        </div>
        <div class="col-auto flex items-center">
          <q-btn
            icon="mdi-send"
            color="primary"
            flat
            dense
            @click="sendChatMessage"
            :disable="!chatInput.trim() || isProcessing"
            :loading="isProcessing"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { executePromptClick2 } from "src/common/helpers/promptHelper"
import { diffStrings, convertHtmlToText, trimInputWithAi } from "src/common/utils/textUtils"
import { createDynamicContext } from 'src/common/resources/promptContexts'
import {usePromptStore} from 'stores/prompt-store';

// Props
const props = defineProps({
  modelValue: String,
  label: String,
  type: String,
  systemPrompt: {
    type: String,
    default: null,
  },
  inputStyle: {
    type: String,
    default: null,
  },
  prompt: {
    type: Object,
    default: null,
  },
  borderless: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: true,
  },
  filled: {
    type: Boolean,
    default: true,
  },
  automaticTextCorrection: {
    type: Boolean,
    default: true,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  autogrow: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:modelValue']);

const promptStore = usePromptStore();

// Local state
const internalText = ref(props.modelValue || '')
const aiProposedValue = ref('')
const chatInput = ref('')
const isProcessing = ref(false)
const showAiColumn = ref(false)

// Chat history for AI context (hidden from user)
const chatHistory = ref([])

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  internalText.value = newValue || ''
})

// Computed for input props (excluding our custom props)
const inputProps = computed(() => {
  const { modelValue, prompt, ...rest } = props
  return rest
})

// Emit changes to parent
const onInput = (value) => {
  emit('update:modelValue', value)
}

// Calculate diff HTML
const diffHtml = computed(() => {
  if (!aiProposedValue.value) return ''

  const currentValue = internalText.value || ''
  const proposedValue = aiProposedValue.value || ''

  const diff = diffStrings(currentValue, proposedValue)

  let html = ''
  for (const part of diff) {
    let value = part.value
    if (part.added) {
      html += '<span class="diff-added">' + value + '</span>'
    } else if (part.removed) {
      //html += '<span class="diff-removed">' + value + '</span>'
    } else {
      html += value
    }
  }

  return html
})

// Use AI proposal
const useAiProposal = () => {
  if (aiProposedValue.value) {
    internalText.value = aiProposedValue.value
    onInput(aiProposedValue.value)

    // Hide AI panel and reset state
    showAiColumn.value = false
    chatHistory.value = []
    aiProposedValue.value = ''
  }
}

// Send chat message to AI
async function sendChatMessage() {
  if (!chatInput.value.trim() || !props.prompt || isProcessing.value) return;
  const model = promptStore.getModel(props.prompt.modelId);
  if(!model) return;

  try {
    isProcessing.value = true

    // Show AI column if not already visible
    if (!showAiColumn.value) {
      showAiColumn.value = true
    }

    if(chatHistory.value.length === 0) {
      chatHistory.value.push({
        type: 'system',
        text: props.prompt.systemPrompt,
      })
    }

    // Add user message to history with structured format
    chatHistory.value.push({
      type: 'user',
      text: `## Current Text
${internalText.value || '(empty)'}

## Requested Change
${chatInput.value.trim()}`
    })

    // Prepare the request
    const request = {
      prompt: props.prompt,
      text: null,
      contextTypes: [],
      agentMessages: chatHistory.value, // All messages from chat history
      agentMessagesOnly: true,
      silent: true,
      abortController: new AbortController(),
    }

    const result = await promptStore.promptInternalSimple(request)

    if (!result || !result.completionResponse) {
      throw new Error('No response from AI');
    }

    const completion = result.completionResponse;
    const message = completion.choices[0].message?.content;

    if (message) {
      const cleanedText = trimInputWithAi(convertHtmlToText(message, true))
      aiProposedValue.value = cleanedText

      // Add AI response to history
      chatHistory.value.push({
        type: 'assistant',
        text: cleanedText
      })
    }

    // Clear chat input
    chatInput.value = ''

  } catch (error) {
    console.error('Error processing AI request:', error)
  } finally {
    isProcessing.value = false
  }
}

// Initialize AI proposal if we have a prompt and initial value
const initializeAiProposal = async () => {
  if (props.prompt && internalText.value) {
    try {
      isProcessing.value = true

      const request = {
        prompt: props.prompt,
        text: internalText.value,
        clear: true,
        forceBypassMoreParameters: true,
        appendContext: [
          createDynamicContext("Current Input", internalText.value)
        ],
        silent: true
      }

      const result = await executePromptClick2(request)

      if (result && result.text) {
        const cleanedText = trimInputWithAi(convertHtmlToText(result.text, true))
        aiProposedValue.value = cleanedText

        // Initialize chat history with AI's first response
        chatHistory.value.push({
          type: 'assistant',
          text: cleanedText
        })
      }
    } catch (error) {
      console.error('Error initializing AI proposal:', error)
    } finally {
      isProcessing.value = false
    }
  }
}

// Don't auto-initialize AI proposal - wait for user to send first message
// watch(() => props.prompt, () => {
//   if (props.prompt && internalText.value) {
//     chatHistory.value = []
//     aiProposedValue.value = ''
//     initializeAiProposal()
//   }
// }, { immediate: true })
</script>

<style lang="scss" scoped>
.input-with-chat-ai {
  .section-label {
    font-weight: 500;
  }

  .input-column {
    transition: all 0.3s ease-in-out;
  }

  .ai-column {
    transition: all 0.3s ease-in-out;
  }

  .ai-proposal-content {
    min-height: 60px;

    .diff-display {
      white-space: pre-wrap;
      word-wrap: break-word;
      border-radius: 4px;

      :deep(.diff-added) {
        background-color: rgba(76, 175, 80, 0.2);
        color: #2e7d32;
      }

      :deep(.diff-removed) {
        background-color: rgba(244, 67, 54, 0.2);
        color: #c62828;
        text-decoration: line-through;
      }
    }

    .placeholder-text {
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      border: 1px dashed rgba(0, 0, 0, 0.12);
    }
  }

  .chat-input-section {
    padding-top: 12px;
  }
}

// AI column transition animations
.ai-column-enter-active,
.ai-column-leave-active {
  transition: all 0.3s ease-in-out;
}

.ai-column-enter-from {
  opacity: 0;
  transform: translateX(20px);
  width: 0;
}

.ai-column-leave-to {
  opacity: 0;
  transform: translateX(20px);
  width: 0;
}

// Dark mode support
body.body--dark .input-with-chat-ai {
  .ai-proposal-content {
    .diff-display {
      background-color: rgba(255, 255, 255, 0.05);

      :deep(.diff-added) {
        background-color: rgba(76, 175, 80, 0.15);
        color: #81c784;
      }

      :deep(.diff-removed) {
        background-color: rgba(244, 67, 54, 0.15);
        color: #e57373;
      }
    }

    .placeholder-text {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
    }
  }

  .chat-input-section {
    border-top-color: rgba(255, 255, 255, 0.12);
  }
}
</style>
