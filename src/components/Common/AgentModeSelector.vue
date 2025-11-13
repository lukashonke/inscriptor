<template>
  <q-btn-toggle
    v-model="layoutStore.currentChatAgentMode"
    :options="[
      { label: 'AI Chat', value: 'simple', icon: 'mdi-robot' },
      { label: 'Deep Agent', value: 'deep-agent', icon: 'mdi-brain' }
    ]"
    :toggle-color="layoutStore.currentChatAgentMode === 'deep-agent' ? 'purple' : 'primary'"
    unelevated
    no-caps
    size="sm"
    class="agent-mode-toggle"
  />
</template>

<script setup>
import { useLayoutStore } from 'stores/layout-store';

const layoutStore = useLayoutStore();
</script>

<style scoped>
.agent-mode-toggle {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

body.body--dark .agent-mode-toggle {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
