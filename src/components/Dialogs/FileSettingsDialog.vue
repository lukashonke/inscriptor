<template>
  <q-dialog v-model="layoutStore.fileSettingsOpen">
    <q-card style="max-width: 800px; min-width: 50vw;">
      <q-card-section class="row q-pa-xs">
        <FileSettings :file="props.file" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";

  const props = defineProps({
    file: {
      type: Object,
      required: false,
    },
  });

  const layoutStore = useLayoutStore();
</script>

<style scoped>

</style>
