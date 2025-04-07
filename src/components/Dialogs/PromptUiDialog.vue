<template>
  <q-dialog v-model="layoutStore.promptUiDialogOpen" v-if="promptResult" full-width full-height transition-show="slide-down" transition-hide="slide-up" @show="onShow">
    <q-card class="pattern-bg">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ prompt.title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <template v-if="prompt.promptStyle === 'brainstorm-ui'">
          <BrainstormPromptUi
            ref="brainstormUiRef"
            :prompt-result="layoutStore.promptUiDialogPromptResult"
          />
        </template>
      </q-card-section>
    </q-card>
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

  onMounted(() => {
    console.log('START!!');
  })

  async function onShow() {
    console.log('GENERATING in PromptUiDialog!!');
    if (brainstormUiRef.value) {
      brainstormUiRef.value.onShow('Data from parent');
    } else {
      console.error('Brainstorm UI component ref not available');
    }
  }

  async function generate() {

  }
</script>

<style scoped>

</style>
