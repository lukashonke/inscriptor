<template>
  <div>
    <div class="relative-position">
      <div class="" style="position: absolute; top: 5px; right: 5px; z-index: 10; ">
        <q-btn @click.prevent.stop icon="mdi-creation-outline" flat outline dense color="primary" size="11px" :loading="prompting">
          <q-menu v-model="visible">
            <q-list dense>
              <q-item dense v-for="prompt in promptSelection" :key="prompt.id" clickable @click="runPrompt(prompt); visible = false;">
                <q-item-section>
                  <q-item-label>{{ prompt.title }} ({{ getModelById(prompt.modelId)?.name }})</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator v-if="promptSelection && promptSelection.length > 0"/>
              <q-item clickable v-close-popup @click="layoutStore.openConfiguration('predefinedPrompts')">
                <q-item-section side>
                  <q-icon name="mdi-playlist-edit" color="primary"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Edit...</q-item-label>
                </q-item-section>
              </q-item>

            </q-list>
          </q-menu>
        </q-btn>
      </div>

    </div>
    <q-input
      :label="label"
      v-bind="props"
      v-model="internalText"
      :type="type"
      :borderless="borderless"
      :filled="filled"
      :dense="dense"
      :autofocus="autofocus"
      :autogrow="autogrow"
      :spellcheck="automaticTextCorrection"
      @update:modelValue="onInput"
    >
    </q-input>


    <div style="position: relative;" v-if="promptResult && promptResult.prompt === promptExecuted" class="q-mt-xs">
      <div class="bordered" style="position: absolute; top: 100%; left: 0; z-index: 10; ">
        <q-spinner v-if="prompting" />
        <PromptResult :promptResult="promptResult" :insert-target="(text) => onInput(trimInputWithAi(convertHtmlToText(text, true)))" type="inline" :has-close="true" @close="promptResult = null" @replace-self="replacePromptResult" disableFollowupActions/>
      </div>

    </div>

  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue'
import {usePromptStore} from "stores/prompt-store";
import {executePromptClick2} from "src/common/helpers/promptHelper";
import PromptResult from "components/RightMenu/PromptResult.vue";
import {convertHtmlToText, trimInputWithAi} from "src/common/utils/textUtils";
import {useLayoutStore} from "stores/layout-store";
import {createDynamicContext} from 'src/common/resources/promptContexts';

const promptStore = usePromptStore();
const layoutStore = useLayoutStore();

const promptResultOpen = ref(false);
const promptExecuted = ref(null);
const prompting = ref(false);

const promptResult = ref(null);

const visible = ref(false);

// Props
const props = defineProps({
  modelValue: String,
  label: String,
  type: String,
  promptIds: Array,
  promptInput: String,
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
const emit = defineEmits(['update:modelValue'])

// Local state
const internalText = ref(props.modelValue)

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  internalText.value = newValue
})

// Emit changes to parent
const onInput = (value) => {
  emit('update:modelValue', value)
}

const promptSelection = computed(() => {
  return promptStore.prompts.filter(prompt => {
    return props.promptIds?.includes(prompt.id) ?? false
  })
});

async function runPrompt(prompt) {
  try {
    prompting.value = true;
    promptResultOpen.value = true;
    promptExecuted.value = prompt;

    const request = {
      prompt: prompt,
      text: props.promptInput,
      clear: true,
      forceBypassMoreParameters: true,
      appendContext: [ createDynamicContext("Input text", props.promptInput) ],
      silent: true
    }

    const result = await executePromptClick2(request);

    promptResult.value = result;

  } finally {
    prompting.value = false;
  }
}

function replacePromptResult(result) {
  promptResult.value = result;
}

function getModelById(id) {
  return promptStore.getModel(id);
}
</script>

<style scoped>

</style>
