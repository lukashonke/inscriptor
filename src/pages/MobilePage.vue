<template>
  <q-page class="mobile-page">
    <div class="full-width full-height">
      <FileDetail />
    </div>

    <!-- FAB for AI Agent -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="mdi-robot-outline"
        color="accent"
        @click="layoutStore.closeRightPanel()"
        aria-label="Open AI Agent"
      />
    </q-page-sticky>

    <!-- FAB for Prompts -->
    <q-page-sticky position="bottom-right" :offset="[18, 90]">
      <q-btn
        fab
        icon="mdi-creation-outline"
        color="primary"
        @click="layoutStore.promptResultsDialogOpened = true"
        aria-label="Open Prompts"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import {onMounted} from 'vue'
import {useLayoutStore} from "stores/layout-store";
import FileDetail from 'components/MainPanel/FileDetail.vue';

const layoutStore = useLayoutStore();

onMounted(() => {
  console.log('Mobile page mounted');
})

</script>

<style scoped>
.mobile-page {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
