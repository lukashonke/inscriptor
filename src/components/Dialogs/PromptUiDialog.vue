<template>
  <q-dialog v-model="layoutStore.promptUiDialogOpen" v-if="promptResult" full-width full-height transition-show="slide-down" transition-hide="slide-up">
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Close icon</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum repellendus sit voluptate voluptas eveniet porro. Rerum blanditiis perferendis totam, ea at omnis vel numquam exercitationem aut, natus minima, porro labore.
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed} from 'vue';

  const layoutStore = useLayoutStore();

  const promptResult = computed(() => layoutStore.promptUiDialogPromptResult);
  const prompt = computed(() => promptResult.value.prompt);
</script>

<style scoped>

</style>
