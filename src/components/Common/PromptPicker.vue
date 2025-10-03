<template>
  <q-btn
    :label="modelValue?.label || placeholder"
    outlined
    flat
    dense
    no-caps
    class="full-width justify-start"
  >
    <q-menu style="width: 500px; max-height: 400px">
      <!-- Current Selection Display -->
      <div class="q-pa-sm items-center row q-gutter-x-sm" v-if="modelValue">
        <q-icon name="mdi-creation-outline" class="col-auto" size="sm" color="primary" />
        <div class="col text-weight-medium">{{ modelValue.label }}</div>
      </div>

      <q-separator class="q-my-sm" v-if="modelValue" />

      <!-- Search Input -->
      <div class="q-pa-sm">
        <q-input
          v-model="searchTerm"
          outlined
          dense
          placeholder="Search prompts..."
          clearable
          @clear="searchTerm = ''"
          autofocus
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Prompts List -->
      <div class="scroll" style="max-height: 300px;">
        <div v-if="filteredPrompts.length === 0" class="text-center q-pa-md text-grey-6">
          No prompts found
        </div>
        <q-list v-else dense>
          <q-item
            v-for="prompt in filteredPrompts"
            :key="prompt.value"
            clickable
            v-close-popup
            @click="selectPrompt(prompt)"
            :class="modelValue?.value === prompt.value ? 'bg-primary text-white' : ''"
          >
            <q-item-section>
              <q-item-label>{{ prompt.label }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="modelValue?.value === prompt.value">
              <q-icon name="check" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: false,
  },
  prompts: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Select prompt...',
  },
});

const emits = defineEmits(['update:modelValue']);

// Reactive data
const searchTerm = ref('');

// Computed properties
const filteredPrompts = computed(() => {
  if (!searchTerm.value) {
    return props.prompts;
  }
  return props.prompts.filter(prompt =>
    prompt.label.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Methods
function selectPrompt(prompt) {
  emits('update:modelValue', prompt);
  searchTerm.value = '';
}
</script>

