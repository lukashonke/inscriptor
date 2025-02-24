<template>
  <q-select filled dense :model-value="selectedPrompts"  :options="promptOptions" :hint="hint" multiple @update:model-value="updateModelValue" use-chips options-dense />
</template>

<script setup>
  import {computed} from "vue";
  import {usePromptStore} from "stores/prompt-store";

  const promptStore = usePromptStore();

  const props = defineProps({
    promptType: {
      type: String,
      required: true,
    },
    hint: {
      type: String,
      default: undefined,
    }
  });

  function updateModelValue(value) {
    promptStore.removePredefinedPrompts(props.promptType);
    for (const valueElement of value) {
      promptStore.addPredefinedPrompt(props.promptType, valueElement.value);
    }
  }

  const selectedPrompts = computed(() => {
    const promptIds = promptStore.getPredefinedPromptId(props.promptType);

    return promptIds.map((id) => {
      const prompt = promptStore.getPromptById(id);
      if(prompt) {
        return {
          label: prompt.title + ' (' + getModelById(prompt.modelId)?.name + ')',
          value: prompt.id,
        }
      }
    });
  });

  const promptOptions = computed(() => {
    return promptStore.prompts
      .map((prompt) => {
        return {label: prompt.title + ' (' + getModelById(prompt.modelId)?.name + ')', value: prompt.id};
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  function getModelById(modelId) {
    return promptStore.getModel(modelId);
  }

</script>



<style scoped>

</style>
