<template>
  <q-dialog v-model="layoutStore.promptUiDialogOpen" v-if="promptResult" maximized transition-show="slide-down" transition-hide="slide-up" @show="onShow">
    <div class="gradient-bg-text-container">
      <q-card class="full-width full-height transparent">
        <q-card-section class="row items-center bg-accent text-white rounded-borders shadow-4 q-px-md q-py-xs q-my-md q-mx-md sticky">
          <div class="text-h6 text-aleo text-center">
            {{  prompt.title }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-mt-lg">
          <template v-if="prompt.promptStyle === 'brainstorm-ui'">
            <BrainstormPromptUi
              ref="brainstormUiRef"
              :prompt-result="layoutStore.promptUiDialogPromptResult"
            />
          </template>
        </q-card-section>
      </q-card>
    </div>

    <div class="gradient-bg" >
      <video
        style="opacity: 0.3;"
        class="full-width full-height"
        src="/brainstormbg.mp4"
        autoplay
        loop
        muted
        playsinline
      ></video>
    </div>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed, onMounted, ref} from 'vue';
  import BrainstormPromptUi from 'components/Common/PromptUis/BrainstormPromptUi.vue';

  const layoutStore = useLayoutStore();

  const brainstormUiRef = ref(null);

  const promptResult = computed(() => layoutStore.promptUiDialogPromptResult);
  const prompt = computed(() => promptResult.value.prompt);

  async function onShow() {
    if (brainstormUiRef.value) {
      brainstormUiRef.value.onShow('Data from parent');
    }
  }

  async function generate() {

  }
</script>

<style scoped>

</style>
