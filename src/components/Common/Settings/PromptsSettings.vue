<template>
  <div class="row">
    <div class="col-auto" style="width: 150px">
      <q-tabs
        v-model="layoutStore.settingsTab"
        vertical
        class="text-primary"
      >
        <q-tab name="prompts" icon="mdi-creation-outline" label="Promps" />
        <q-tab name="models" icon="mdi-chip" label="Models" />
        <q-tab name="agents" icon="mdi-robot" label="Agents" />
        <q-tab name="apikeys" icon="mdi-cloud-outline" label="API Keys" />
        <q-tab name="files" icon="mdi-tools" label="Other" />
      </q-tabs>
    </div>
    <div class="col">
      <q-tab-panels
        v-model="layoutStore.settingsTab"
        animated
        swipeable
        vertical
        transition-prev="jump-up"
        transition-next="jump-up"
      >
        <q-tab-panel name="apikeys">
          <div class="">
            <div class="row q-mb-lg">
              <div class="col-6">
              <div class="q-mb-sm text-caption">
                You can decide to use your own Cloud AI provider, which you will connect using API key. Refer to the documentation of the provider to get the API key. Using such API keys will not consume your Inscriptor AI credits.
              </div>
              <div class="q-mb-sm text-caption">
                These tokens are stored only in your internet browser or Inscriptor desktop application, ensuring no data including your prompts leave your computer. If you access Inscriptor from another device, make sure the re-enter the tokens there as well.
              </div>
              <div class="q-mb-sm text-caption">
                <q-icon name="info" size="xs" class="q-mr-xs" />
                Note: AI agents are not affected by these API key settings and will always use Inscriptor AI Cloud
              </div>
              </div>
            </div>

            <div class="row q-gutter-x-sm q-gutter-y-lg">
              <template v-for="(key) in localDataStore.apiKeys" :key="key">
                <div class="col-6 items-center">
                  <q-input :model-value="key.key" :label="key.name" @update:modelValue="(val) => localDataStore.setApiKey(key.name, val)" filled dense clearable :hint="key.description" />
                </div>
              </template>
            </div>

          </div>
          <!-- <q-btn color="primary" label="Add model" @click="promptStore.addNewModel" /> -->
        </q-tab-panel>

        <q-tab-panel name="models" class="q-pt-xs">
          <div class="q-mb-sm" v-if="!anyModelImported">
            <div class="q-mb-sm bg-negative text-white q-pa-md rounded-borders full-width">
              <span class="text-caption text-bold">You have not added any AI models yet. Visit Inscriptor Hub to get started!</span>
            </div>
          </div>

          <div class="q-mb-md">
            <q-btn color="accent" label="Inscriptor Hub" icon="mdi-storefront-outline" @click="layoutStore.promptMarketplaceOpen = true; layoutStore.settingsOpen = false;"/>
          </div>

          <div v-for="model in models" :key="model.id">
            <ModelSettingsItem :model="model" />
          </div>


          <!-- <q-btn color="primary" label="Add model" @click="promptStore.addNewModel" /> -->
        </q-tab-panel>

        <q-tab-panel name="prompts" class="q-pt-xs">
          <div class="q-mb-md" v-if="!anyModelImported">
            <div class="q-mb-sm bg-negative text-white q-pa-md rounded-borders full-width">
              <span class="text-caption text-bold">You have not added any AI models yet. Visit Inscriptor Hub to get started!</span>
            </div>
            <div>
              <q-btn color="primary" label="Inscriptor Hub" icon="mdi-storefront-outline" @click="layoutStore.promptMarketplaceOpen = true; layoutStore.settingsOpen = false;"/>
            </div>
          </div>

          <div class="q-gutter-x-sm q-mb-md" v-else>
            <q-btn color="accent" label="Inscriptor Hub" icon="mdi-storefront-outline" @click="layoutStore.promptMarketplaceOpen = true; layoutStore.settingsOpen = false;"/>
            <q-btn color="primary" icon="mdi-plus" label="Add prompt" @click="layoutStore.openAddPromptDialog(true, promptModel)" />
          </div>

          <div class="q-mb-md">
            <div class="row q-col-gutter-sm">
              <div class="col-7">
                <q-input
                  v-model="searchFilter"
                  dense
                  filled
                  :placeholder="'Search in ' + prompts.length + ' prompts...'"
                  clearable
                  autofocus
                  class="q-mb-sm"
                >
                  <template v-slot:prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col">
                <q-select
                  v-model="selectedModel"
                  :options="modelOptions"
                  dense
                  filled
                  clearable
                  options-dense
                  emit-value
                  map-options
                  label="AI model"
                />
              </div>
              <div class="col">
                <q-select
                  v-model="selectedCategory"
                  :options="categoryOptions"
                  dense
                  filled
                  clearable
                  options-dense
                  emit-value
                  map-options
                  label="Category"
                />
              </div>

            </div>
          </div>

          <div v-for="prompt in paginatedPrompts" :key="prompt.id">
            <PromptSettingsItem :prompt="prompt" />
          </div>

          <div class="row justify-center q-mt-md">
            <q-pagination
              v-model="currentPage"
              :max="totalPages"
              :max-pages="6"
              boundary-numbers
              direction-links
            />
          </div>

         </q-tab-panel>

         <q-tab-panel name="files" class="q-pt-xs">
           <PagePropertiesSettings />
         </q-tab-panel>

        <q-tab-panel name="agents" class="q-pt-xs">
          <div class="q-mb-lg" v-if="!anyModelImported">
            <div class="q-mb-sm bg-negative text-white q-pa-md rounded-borders full-width">
              <span class="text-caption text-bold">You have not added any AI models yet. Visit Inscriptor Hub to get started!</span>
            </div>
            <div>
              <q-btn color="primary" label="Inscriptor Hub" icon="mdi-storefront-outline" @click="layoutStore.promptMarketplaceOpen = true; layoutStore.settingsOpen = false;"/>
            </div>
          </div>
          <AgentSettings v-else />
        </q-tab-panel>

      </q-tab-panels>
    </div>

  </div>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {computed, ref, watch, onMounted} from "vue";
  import PromptSettingsItem from "components/Common/Settings/PromptSettingsItem.vue";
  import ModelSettingsItem from "components/Common/Settings/ModelSettingsItem.vue";
  import PagePropertiesSettings from "components/Common/Settings/PagePropertiesSettings.vue";
  import {useQuasar} from "quasar";
  import {useLayoutStore} from "stores/layout-store";
  import {useLocalDataStore} from "stores/localdata-store";
  import AgentSettings from 'components/Common/Settings/AgentSettings.vue';

  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();
  const localDataStore = useLocalDataStore();

  const $q = useQuasar();

  const prompts = computed(() => promptStore.prompts);
  const tabs = computed(() => promptStore.tabs);
  const models = computed(() => promptStore.models);
  const lastPromptUpdate = computed(() => promptStore.lastPromptUpdate);

  // Pagination
  const currentPage = ref(1);
  const itemsPerPage = 12;
  const searchFilter = ref('');
  const selectedModel = ref(null);
  const selectedCategory = ref(null);

  // Stable filtered prompt IDs that only update when search filter changes
  const stableFilteredPromptIds = ref(null);

  const modelOptions = computed(() => models.value.map(m => ({
    label: m.name,
    value: m.id
  })));

  const categoryOptions = computed(() => {
    const categories = promptStore.getCategories();
    return categories.map(category => ({
      label: category,
      value: category
    }));
  });

  // Method to update stable filtered prompt IDs based on search filter
  const updateStableFilteredPromptIds = () => {
    if (searchFilter.value) {
      const searchLower = searchFilter.value.toLowerCase();
      const filtered = prompts.value.filter(prompt =>
        prompt.title.toLowerCase().includes(searchLower)
      );
      stableFilteredPromptIds.value = new Set(filtered.map(p => p.id));
    } else {
      stableFilteredPromptIds.value = null;
    }
  };

  const filteredPrompts = computed(() => {
    let filtered = prompts.value;

    // Apply model filter
    if (selectedModel.value) {
      filtered = filtered.filter(prompt => prompt.modelId === selectedModel.value);
    }

    // Apply category filter
    if (selectedCategory.value) {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory.value);
    }

    // Apply search filter using stable prompt IDs
    if (stableFilteredPromptIds.value) {
      filtered = filtered.filter(prompt => stableFilteredPromptIds.value.has(prompt.id));
    }

    return filtered;
  });

  const totalPages = computed(() => Math.ceil(filteredPrompts.value.length / itemsPerPage));

  const paginatedPrompts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPrompts.value.slice(start, end);
  });

  // Watch for search filter changes to update stable filtered IDs
  watch(searchFilter, () => {
    updateStableFilteredPromptIds();
    currentPage.value = 1;
  });

  // Reset to first page when model or category filters change
  watch([selectedModel, selectedCategory], () => {
    currentPage.value = 1;
  });

  // Refresh filters when prompts are updated (e.g., after cloning)
  watch(lastPromptUpdate, () => {
    if (searchFilter.value) {
      updateStableFilteredPromptIds();
    }
  });

  const promptType = ref('general');
  const systemPrompt = ref('Perform the task to the best of your ability');
  const userPrompt = ref('$textOrSelection');

  watch(promptType, (value) => {
    console.log(value);
    if (value.value === 'inline' && userPrompt.value === '$text') {
      userPrompt.value = '$selection';
    } else if (value.value === 'insert' && userPrompt.value === '$selection'){
      userPrompt.value = '$text';
    }
  });

  const promptModel = ref(models.value.length > 0 ? models.value[0].id : '');

  const anyModelImported = computed(() => {
    return promptStore.models.length > 0
  });

  // Initialize stable filtered IDs on mount if there's already a search filter
  onMounted(() => {
    if (searchFilter.value) {
      updateStableFilteredPromptIds();
    }
  });

</script>

<style scoped>

</style>
