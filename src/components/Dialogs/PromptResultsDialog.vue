<template>
  <q-dialog v-model="layoutStore.promptResultsDialogOpened"
            transition-show="slide-down"
            full-width full-height
            transition-hide="fadeOut">
    <q-card>
      <q-card-section class="row items-center">
        <q-btn size="md" dense icon="mdi-creation-outline" color="accent" label="New Prompt">
          <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" anchor="bottom start">
            <q-card v-show="showPrompts">
              <PromptSelector prompt-types="insert" @promptClick="promptClick" />
            </q-card>
          </q-popup-proxy>
          <q-tooltip  :delay="1000">
            AI prompts
          </q-tooltip>
        </q-btn>
        <q-space />

        <q-btn icon="close" flat round dense @click="layoutStore.promptResultsDialogOpened = false" />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm q-px-sm">
        <PromptsTab />
      </q-card-section>

    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {useCurrentUser} from "vuefire";
  import PromptsTab from 'components/RightMenu/PromptsTab.vue';
  import PromptSelector from 'components/Common/PromptSelector/PromptSelector.vue';
  import {ref} from 'vue';
  import {getAllMarkdown} from 'src/common/utils/editorUtils';
  import {executePromptClick2} from 'src/common/helpers/promptHelper';
  const showPrompts = ref(true);

  const user = useCurrentUser();

  async function promptClick(promptClickData, forceAllFileText) {
    const prompt = promptClickData.prompt;

    const request = {
      prompt: prompt,
      text: getAllMarkdown(),
      forceModelId: promptClickData.forceModelId,
      forceTemperature: promptClickData.forceTemperature,
      reasoningEffort: promptClickData.reasoningEffort,
    }

    await executePromptClick2(request);
  }

  const layoutStore = useLayoutStore();
</script>

<style scoped>

</style>
