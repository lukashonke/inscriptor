<template>
  <q-dialog v-model="layoutStore.browserDialogOpen" full-width full-height>
    <div>
      <iframe :src="layoutStore.browserDialogUrl" style="width: 100%; height: 100%; border: none;"></iframe>
    </div>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";

  const layoutStore = useLayoutStore();
</script>

<style scoped>

</style>
