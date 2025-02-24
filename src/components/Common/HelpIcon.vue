<template>
  <q-badge color="secondary" text-color="white" label="?" rounded class="q-ma-xs cursor-pointer">
    <q-tooltip :delay="200"
    color>{{ tooltip }}</q-tooltip>
  </q-badge>
</template>

<script setup>
  const props = defineProps({
    tooltip: {
      type: String,
      required: true,
    },
  });

</script>

<style scoped>

</style>
