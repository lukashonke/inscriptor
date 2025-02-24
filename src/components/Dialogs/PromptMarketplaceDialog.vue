<template>
  <q-dialog v-model="layoutStore.promptMarketplaceOpen" >
    <PromptMarketplace />
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import PromptMarketplace from "components/Common/Marketplace/PromptMarketplace.vue";

  const layoutStore = useLayoutStore();
</script>

<style scoped>

</style>
