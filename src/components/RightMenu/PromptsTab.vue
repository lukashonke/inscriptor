<template>
  <div :class="isMobile ? '' : 'q-mx-md'">
    <div class="flex justify-center q-mb-lg" v-if="maxResultsPage > 0">
      <div class="col-auto flex items-center" v-if="maxResultsPage > 0">
        <q-pagination :max="maxResultsPage" v-model="page" :max-pages="3"  :boundary-links="false" direction-links   />
      </div>

      <div class="col">
      </div>

      <div class="col-auto flex items-center">
        <q-btn dense flat color="negative" icon="mdi-delete-outline" size="md">
          <q-menu>
            <q-list dense>
              <q-item clickable v-ripple @click="removeConversation" class="text-negative">
                <q-item-section side>
                  <q-icon name="mdi-close" size="xs" />
                </q-item-section>
                <q-item-section>Delete current conversation</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="clearPromptHistory" class="text-negative">
                <q-item-section side>
                  <q-icon name="mdi-delete-outline" size="xs" />
                </q-item-section>
                <q-item-section>Delete all conversations</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

      </div>
    </div>

    <div class="q-gutter-y-sm q-ml-xs">

      <template v-for="(promptResult, index) in results" :key="index">
        <template v-if="index + 1 === results.length">

          <div>
            <transition
              appear
              enter-active-class="animated fadeInDown slower"
              leave-active-class="animated fadeOut delay-1s"
            >
              <div v-if="promptResult.isGenerating" class="menu-subtitle q-ml-xs q-my-lg">
                <q-spinner-ios></q-spinner-ios> <span>{{ (promptResult.isGenerating) ? 'generating...' : 'generated' }}</span>
                <q-btn dense @click="promptStore.stopPrompt(promptResult)" label="Abort" size="sm" class="no-margin q-py-none" color="negative"/>
              </div>

            </transition>
          </div>

        </template>

        <PromptResult :promptResult="promptResult" :allow-regenerate="index + 1 === results.length"/>

      </template>

      <div v-if="results.length === 0" class="text-center text-grey-8 q-mt-xl">
        No prompt results to display. Run AI prompts to view results here.
      </div>

      <transition
        appear
        enter-active-class="animated fadeIn slower"
        leave-active-class="animated fadeOut"
      >
        <div v-show="layoutStore.fakePromptResult">
          <FakePromptResult />
        </div>
      </transition>

    </div>


  </div>

</template>

<script setup>
import PromptResult from "components/RightMenu/PromptResult.vue";
import {usePromptStore} from "stores/prompt-store";
import {computed} from "vue";
import {Dialog} from "quasar";
import {useLayoutStore} from "stores/layout-store";
import FakePromptResult from "components/RightMenu/FakePromptResult.vue";
import {promptTabId} from 'src/common/resources/tabs';
import {useResponsive} from 'src/common/utils/screenUtils';

const promptStore = usePromptStore();
const layoutStore = useLayoutStore();
const { isMobile } = useResponsive();

const results = computed(() => {
  const index = promptStore.getTabData(promptTabId)?.promptResultsIndex ?? 0;
  return promptStore.getTabData(promptTabId)?.promptResultsHistory[index] ?? [];
});

const maxResultsPage = computed(() => {
  return promptStore.getTabData(promptTabId)?.promptResultsHistory.length ?? 0;
});

const page = computed({
  get: () => (promptStore.getTabData(promptTabId)?.promptResultsIndex ?? 0) + 1,
  set: (value) => {
    promptStore.setCurrentTabResultsIndex(promptTabId, value - 1);
  }
});

function removeConversation() {
  promptStore.removePromptResultsHistoryItem(promptTabId, promptStore.getTabData(promptTabId)?.promptResultsIndex ?? null);
}

function clearPromptHistory() {

  Dialog.create(
    {
      title: 'Confirm',
      message: 'Are you sure you want to delete whole prompt history?',
      cancel: true,
      persistent: true
    }).onOk(() => {
    promptStore.clearPromptHistory(promptTabId);
  }).onCancel(() => {
  }).onDismiss(() => {
    }
  )
}

</script>

<style scoped>

</style>
