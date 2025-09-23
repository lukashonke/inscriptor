<template>
  <q-icon :name="modelValue?.length > 0 ? modelValue : defaultIcon" :size="size" :color="color" class="cursor-pointer">
    <q-menu style="height: 440px; width: 364px">
      <!-- Current Selection Display -->
      <div class="q-pa-sm items-center row q-gutter-x-sm">
        <q-icon :name="modelValue" class="col-auto" size="sm" color="primary" />
        <q-input
          filled
          dense
          :model-value="modelValue"
          @update:model-value="choose"
          label="Selected Icon"
          class="col"
          clearable
        />
      </div>

      <q-separator class="q-my-sm"/>

      <!-- Search Input -->
      <div class="q-pt-sm q-px-sm">
        <q-input
          v-model="searchTerm"
          outlined
          dense
          placeholder="Search icons..."
          clearable
          @clear="searchTerm = ''"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Icons Grid -->
      <div class="q-pa-sm" style="min-height: 280px; overflow-y: auto;">
        <div v-if="currentPageIcons.length === 0" class="text-center q-pa-md text-grey-6">
          No icons found
        </div>
        <div v-else class="row q-gutter-xs">
          <div
            v-for="icon in currentPageIcons"
            :key="icon"
            class="col-auto"
          >
            <q-btn
              flat
              square
              size="sm"
              :class="modelValue === icon ? 'bg-primary text-white' : 'text-grey-8'"
              @click="choose(icon)"
              style="width: 40px; height: 40px;"
            >
              <q-icon :name="icon" size="20px"/>
              <q-tooltip>{{ icon }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="q-pa-sm" v-if="totalPages > 1">
        <div class="row items-center justify-between">
          <q-btn
            flat
            dense
            icon="chevron_left"
            :disable="currentPage === 1"
            @click="currentPage--"
            size="sm"
          />
          <div class="text-caption text-grey-6">
            Page {{ currentPage }} of {{ totalPages }} ({{ filteredIcons.length }} icons)
          </div>
          <q-btn
            flat
            dense
            icon="chevron_right"
            :disable="currentPage === totalPages"
            @click="currentPage++"
            size="sm"
          />
        </div>
      </div>
    </q-menu>
    <q-tooltip>
      Choose icon
    </q-tooltip>
  </q-icon>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import { allIcons } from "assets/icons";

  const props = defineProps({
    modelValue: {
      type: String,
      required: false,
    },
    defaultIcon: {
      type: String,
      default: 'mdi-circle-outline',
    },
    size: {
      type: String,
      default: 'md',
    },
    color: {
      type: String,
      default: 'grey',
    },
    shade: {
      type: String,
      default: '3',
    },
  });

  const emits = defineEmits(['update:modelValue']);

  // Reactive data
  const searchTerm = ref('');
  const currentPage = ref(1);
  const iconsPerPage = 48; // 5 rows × 7 columns

  // Computed properties
  const filteredIcons = computed(() => {
    if (!searchTerm.value) {
      return allIcons;
    }
    return allIcons.filter(icon =>
      icon.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
  });

  const totalPages = computed(() => {
    return Math.ceil(filteredIcons.value.length / iconsPerPage);
  });

  const currentPageIcons = computed(() => {
    const start = (currentPage.value - 1) * iconsPerPage;
    const end = start + iconsPerPage;
    return filteredIcons.value.slice(start, end);
  });

  // Watch for search changes and reset pagination
  watch(searchTerm, () => {
    currentPage.value = 1;
  });

  // Methods
  function choose(icon) {
    emits('update:modelValue', icon);
  }

</script>

<style scoped>
.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.q-dark .border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
