<template>
  <q-page class="mobile-page">
    <div class="full-width full-height">
      <FileDetail />
    </div>

    <!-- Collapsible FAB with actions -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-fab
        v-model="fabOpen"
        icon="mdi-creation-outline"
        direction="up"
        color="accent"
        aria-label="Actions"
      >
        <q-fab-action
          @click="openPrompts"
          icon="mdi-creation-outline"
          color="primary"
          label="Prompts"
          aria-label="Open Prompts"
        />
        <q-fab-action
          @click="openAgent"
          icon="mdi-robot-outline"
          color="accent"
          label="Agent"
          aria-label="Open AI Agent"
        />
      </q-fab>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useLayoutStore} from "stores/layout-store";
import FileDetail from 'components/MainPanel/FileDetail.vue';

const layoutStore = useLayoutStore();
const fabOpen = ref(false);

function openPrompts() {
  layoutStore.promptResultsDialogOpened = true;
  fabOpen.value = false;
}

function openAgent() {
  layoutStore.closeRightPanel();
  fabOpen.value = false;
}

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
