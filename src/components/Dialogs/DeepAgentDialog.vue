<template>
  <q-dialog full-width full-height v-model="layoutStore.deepAgentDialogShown">
    <DeepAgentChat />
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import DeepAgentChat from 'components/RightMenu/DeepAgentChat.vue';
  const layoutStore = useLayoutStore();
</script>
