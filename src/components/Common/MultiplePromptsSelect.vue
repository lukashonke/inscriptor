<template>
  <q-select filled dense :model-value="modelValue" :options="options" :hint="hint" multiple @update:model-value="$emit('update:modelValue', $event)" use-chips options-dense emit-value option-value="id" option-label="title" />
  TODO show name
</template>

<script setup>
  const props = defineProps({
    modelValue: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Array,
      default: () => [],
    },
    hint: {
      type: String,
      default: undefined,
    }
  });

  const emit = defineEmits(['update:modelValue']);
</script>

<style scoped>

</style>
