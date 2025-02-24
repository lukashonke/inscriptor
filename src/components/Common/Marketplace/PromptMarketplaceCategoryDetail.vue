C<template>
  <div class="q-pr-lg q-pl-lg q-ml-sm q-py-lg">
    <div v-if="!hasAnyModels && category === 'Prompt_Packages'" class="text-bold text-center flex">
      <q-chip>No models available. Add a model first.</q-chip>
    </div>

    <div class="row q-gutter-x-md" v-if="category === 'Models'">
      <div class="col">
        <div class="text-h5 text-weight-bold text-aleo">AI models</div>
        <div class="text-h6 text-aleo">Import models to execute your prompts.</div>
      </div>
      <div class="col-auto flex items-center" style="width: 150px">
        <q-select
          filled
          v-model="modelCategory"
          :options="modelCategories"
          emit-value
          dense
          stack-label
          label="Model Type"
          class="full-width"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-3 flex items-center">
        <q-select
          filled
          v-model="modelTags"
          multiple
          :options="allModelTags"
          use-chips
          dense
          options-dense
          stack-label
          label="Tags"
          class="full-width"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps" dense>
              <q-item-section side>
                <q-icon :name="scope.opt.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-auto flex items-center">
        <q-btn flat dense round icon="las la-times" @click="layoutStore.promptMarketplaceOpen = !layoutStore.promptMarketplaceOpen" />
      </div>
    </div>

    <div class="row q-gutter-x-md" v-if="category === 'Prompt_Packages'">
      <div class="col">
        <div class="text-h5 text-weight-bold text-aleo">Prompt packs</div>
        <div class="text-h6 text-aleo">Various prompts for different use-cases.</div>
      </div>
      <div class="col-4 flex items-center" v-if="hasAnyModels">
        <q-select
          filled
          v-model="promptTags"
          multiple
          :options="allPromptTags"
          use-chips
          dense
          options-dense
          stack-label
          label="Tags"
          class="full-width"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps" dense>
              <q-item-section side>
                <q-icon :name="scope.opt.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-auto flex items-center">
        <q-btn flat dense round icon="las la-times" @click="layoutStore.promptMarketplaceOpen = !layoutStore.promptMarketplaceOpen" />
      </div>
    </div>

    <template  v-if="category === 'Packs'">
      <div class="row q-gutter-x-md q-mb-sm text-aleo">
        <div class="col">
          <div class="text-h5 text-weight-bold">
            Welcome to Inscriptor Hub
          </div>
          <div class="text-h6 text-weight-regular">
            Get Prompts + AI model combination packs to get started quickly or browse individual sections yourself.
          </div>
        </div>
        <div class="col-auto flex items-center">
          <q-btn flat dense round icon="las la-times" @click="layoutStore.promptMarketplaceOpen = !layoutStore.promptMarketplaceOpen" />
        </div>
      </div>
    </template>

    <div class="q-mb-lg row items-center">

      <template v-if="category === 'Models' && modelCategory === 'Ollama'" >

        <div class="col">
          <q-card flat class="bg-primary-1 q-mt-md">
            <q-expansion-item
              expand-separator
              header-class="text-caption"
              icon="las la-info-circle"
              label="Info about Local AI models"
            >
              <q-card style="" v-if="category === 'Models' && modelCategory === 'Ollama'" class="row bg-primary-1">

                <q-card-section class="q-gutter-y-sm col">
                  <div class="text-h6">
                    Local AI Models
                  </div>
                  <div>
                    Local models can be run on your computer, if your computer has the resources.
                  </div>
                  <div>
                    You can use <span class="text-weight-medium">Ollama (easier setup)</span> or <span class="text-weight-medium">LM Studio (advanced usage)</span>.
                  </div>

                  <div class="row bordered q-pa-sm bg-blue-grey-1 q-mt-lg">
                    <div class="col">
                      <div class="text-subtitle2">Advantages:</div>
                      <div>No data leave your computer</div>
                      <div>No content restriction</div>
                      <div>Run any model you want</div>
                    </div>
                    <div class="col">
                      <div class="text-subtitle2">Negatives:</div>
                      <div>Requires strong computer</div>
                      <div>Not as fast as cloud</div>
                      <div>Drains laptop battery</div>
                    </div>
                  </div>
                </q-card-section>

                <div class="col-auto" style="width: 10px;">
                </div>

                <q-card-section class="col">
                  <div class="text-subtitle2">
                    How to choose the right model?
                  </div>
                  <div>
                    For example, you can see read leaderboard to see which models are popular and have a good performance. Then decide based on cost and speed.
                  </div>
                  <div>

                    <a href="https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard" target="_blank">
                      Chatbot Arena Leaderboard
                      <q-icon name="las la-external-link-alt" />
                    </a>
                  </div>

                  <div class="q-mt-md bordered q-pa-sm bg-blue-grey-1">
                    <div>
                      <span class="text-subtitle2">Current Ollama status:</span>
                      <q-spinner
                        v-if="ollamaStatusPending"
                        color="primary"
                      />

                      <q-chip :color="ollamaStatusColor" >
                        {{ ollamaStatus }}&nbsp;
                        <q-spinner-gears
                          v-if="ollamaStatus === 'Running'"
                          color="black"
                        />
                      </q-chip>
                    </div>

                    <div v-if="ollamaInstalled === false">
                      <q-chip icon="las la-exclamation" color="red-2">Ollama is not installed or is not running</q-chip>
                      <div class="row q-mt-md q-gutter-x-md">
                        <div class="col">
                          <q-btn icon="las la-external-link-alt" unelevated @click.prevent="openBrowserPage('https://ollama.com/')" label="Download Ollama" />
                        </div>
                        <div class="col-auto">
                          <q-btn unelevated @click.prevent="getOllamaStatus()">Refresh</q-btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

              </q-card>
            </q-expansion-item>
          </q-card>
        </div>

      </template>
      <template v-if="category === 'Models' && modelCategory === 'Cloud'">

        <div class="col">
          <q-card flat class="bg-primary-1 q-mt-md">
            <q-expansion-item
              expand-separator
              header-class="text-caption"
              icon="las la-info-circle"
              label="Info about Cloud AI models"
            >
              <q-card class="row bg-primary-1">
                <q-card-section class="col q-gutter-y-sm">
                  <div class="text-h6">
                    Cloud Models
                  </div>
                  <div>
                    Running models on the cloud is fast and easy and does not require strong computer.
                  </div>

                  <div class="row bordered q-pa-sm bg-blue-grey-1">
                    <div class="col">
                      <div class="text-subtitle2">Advantages:</div>
                      <div>Fast and no setup required</div>
                      <div>Runs on any computer</div>
                      <div>Does not drain battery</div>
                    </div>
                    <div class="col">
                      <div class="text-subtitle2">Negatives:</div>
                      <div>Requires AI credits to purchase</div>
                    </div>
                  </div>
                </q-card-section>

                <div class="col-auto" style="width: 10px;">
                </div>

                <q-card-section class="col">
                  <div class="text-subtitle2">
                    How to choose the right model?
                  </div>
                  <div>
                    For example, you can use this leaderboard to see which models are popular and have good performance. Then decide based on cost and speed.
                  </div>
                  <div>

                    <a href="https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard" target="_blank">
                      Chatbot Arena Leaderboard
                      <q-icon name="las la-external-link-alt" />
                    </a>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-card>
        </div>

      </template>

    </div>

      <template v-if="category === 'Models' && modelCategory === 'Ollama'">
        <div class="row q-mb-lg q-gutter-x-md">
          <div class="">
            <q-btn icon="las la-plus" color="primary" @click="addOllamaModelDialog = true" label="Add Custom Ollama Model" />
          </div>

          <div class="">
            <q-btn icon="las la-plus" color="primary" @click="checkLmStudio(); addLmStudioModelDialog = true" label="Add Custom LM Studio Model" />
          </div>
        </div>
      </template>

    <template v-if="category === 'Models' && modelCategory === 'Cloud'">
      <div class="row q-mb-lg q-gutter-x-md">
        <div class="">
          <q-btn label="Add cloud model" @click="addCloudModelDialogOpen = true;" class="" color="primary" icon="mdi-plus" />
        </div>

        <div class="">
        </div>
      </div>


    </template>

    <div class="text-h6 q-mt-xl" v-if="category === 'Models' && modelCategory === 'Ollama'">
      Featured Ollama models:
    </div>

    <div class="row" v-if="loading">
      <div class="col" />
      <div class="col-auto">
        <q-spinner-dots  size="xl" />
      </div>
      <div class="col" />
    </div>

    <div v-if="(hasAnyModels || category !== 'Prompt_Packages') && !loading" class="q-mt-xl">

      <template v-if="items.filter(item => item.featured === true).length > 0">

        <div class="text-aleo text-h6 q-my-sm">
          Featured models
        </div>
        <div class="row q-gutter-md q-mb-md">
          <div class="col-auto" v-for="item in items.filter(item => item.featured === true)" :key="item.id" style="width: 360px;">
            <PromptMarketplaceCategoryDetailItem :category="category" :item="item" :model-category="modelCategory" />
          </div>
        </div>

        <q-separator class="q-my-xl"/>

      </template>

      <div class="row q-gutter-md">
        <div class="col-auto" v-for="item in items.filter(item => !item.featured)" :key="item.id" style="width: 360px;">
          <PromptMarketplaceCategoryDetailItem :category="category" :item="item" :model-category="modelCategory" />
        </div>
      </div>

    </div>
  </div>

  <q-dialog v-model="addCloudModelDialogOpen">
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">Add Cloud Model</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div>
          These cloud models are provided via <a href="https://openrouter.ai/" target="_blank">https://openrouter.ai/<q-icon name="las la-external-link-alt" /></a>.
        </div>
      </q-card-section>

      <q-card-section class="">
        <q-input autofocus v-model="searchOpenRouterModelName" filled dense square label="Search Model" hint="Examples: llama3"/>

        <q-list v-if="openRouterSearchedModels">
          <q-item dense v-for="openRouterModel in openRouterSearchedModels" :key="openRouterModel.id" class="q-mt-md">
            <q-item-section>
              <q-item-label :title="openRouterModel.id">
                {{ openRouterModel.name }}
              </q-item-label>
              <q-item-label caption lines="2" :title="openRouterModel.description">
                {{ truncate(openRouterModel.description, 200) }}
              </q-item-label>
              <q-item-label caption lines="1" v-if="openRouterModel.inputPrice1MTokens && openRouterModel.outputPrice1MTokens">
                Cost: send 1M tokens: {{ openRouterModel.inputPrice1MTokens }} credits | receive 1M tokens: {{ openRouterModel.outputPrice1MTokens }} credits
              </q-item-label>
            </q-item-section>
            <q-item-section top side>
              <q-btn no-caps label="Import" color="primary" @click="confirmAddOpenRouterModel(openRouterModel)" :loading="searchingOpenRouterModels" icon="mdi-plus" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="q-mt-lg">
          No models found
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>

  <q-dialog v-model="addOllamaModelDialog" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">Add Ollama Model</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div>View the list of Ollama models:</div>
        <div>
          <a href="https://ollama.com/library" target="_blank">
          Ollama Model Library
          <q-icon name="las la-external-link-alt" />
          </a>
        </div>
      </q-card-section>

      <q-card-section class="">
        <q-input v-model="newOllamaModelName" filled dense square label="Ollama Model Name" hint="Examples: phi3:mini llama3.1 gemma2:2b"/>

      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Download & Add" color="primary" @click="confirmAddOllamaModel" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="addLmStudioModelDialog" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">Add LM Studio Model</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div>Download desired model in LM Studio, load it, then continue here.</div>
        <div>Make sure LM Studio Local Server is started and match the port below.</div>
        <div><a href="https://lmstudio.ai/" target="_blank">More info <q-icon name="las la-external-link-alt" /></a></div>
      </q-card-section>

      <q-card-section>
        <div class="row items-center">
          <span class="text-subtitle2">Current LM Studio status:</span>
          <q-spinner
            v-if="lmStudioStatusPending"
            color="primary"
          />

          <q-chip :color="lmStudioStatus === 'Running' ? 'positive' : 'grey'" >
            {{ lmStudioStatus }}&nbsp;
            <q-spinner-gears
              v-if="lmStudioStatus === 'Running'"
              color="black"
            />
          </q-chip>
        </div>

        <div class="row">
          <div class="col">
            <q-input v-model="lmStudioPort" type="number" filled dense square label="LM Studio Server Port" hint="Default: 1234"/>
          </div>
          <div class="col-auto items-center">
            <q-btn @click="checkLmStudio()" label="Connect" flat color="primary"  />
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-y-lg">
        <q-select :options="lmStudioModels" filled v-model="newLmStudioModelName" dense square label="LM Studio Model Name" hint="Examples: bartowski/Phi-3.5-mini-instruct-GGUF" emit-value option-label="id" option-value="id" @update:model-value="lmStudioModelSelected()"/>
        <q-input v-model="newLmStudioModelVisibleName" filled dense square label="Model Visible Name" hint="Examples: Name the model"/>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Add Model" color="primary" @click="confirmAddLmStudioModel" />
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {directusClient} from "boot/directus";
import {readItems} from "@directus/sdk";
import {usePromptStore} from "stores/prompt-store";
import { open } from '@tauri-apps/plugin-shell';
import {ollamaPing} from "src/common/apiServices/ollamaApiService";
import PromptMarketplaceCategoryDetailItem from "components/Common/Marketplace/PromptMarketplaceCategoryDetailItem.vue";
import {createLmStudioModel, createOllamaModel, createOpenRouterModel} from "src/common/utils/modelLibraryLoader";
import {importModel} from "src/common/utils/modelUtils";
import {useLayoutStore} from "stores/layout-store";
import {getOpenRouterModels} from "src/common/apiServices/modelService";
import {watchDebounced} from "@vueuse/core";
import {truncate} from "src/common/utils/textUtils";

  const props = defineProps({
    category: {
      type: String,
      required: true
    }
  });

  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();

  const addOllamaModelDialog = ref(false);
  const addLmStudioModelDialog = ref(false);
  const addCloudModelDialogOpen = ref(false);
  const newOllamaModelName = ref('');
  const newLmStudioModelName = ref('');
  const newLmStudioModelVisibleName = ref('');
  const openRouterSearchedModels = ref([]);
  const searchingOpenRouterModels = ref(false);
  const searchOpenRouterModelName = ref('');
  const lmStudioPort = ref('1234');

  function confirmAddOllamaModel() {
    const newModel = createOllamaModel(newOllamaModelName.value, newOllamaModelName.value);

    importModel(newModel, (status) => {
      console.log(status);
    });

    addOllamaModelDialog.value = false;
  }

  watchDebounced(
    searchOpenRouterModelName,
    () => {     searchOpenRouterModel();
    },
    { debounce: 500, maxWait: 3000 },
  );

  async function searchOpenRouterModel() {
    if(!searchOpenRouterModelName.value || searchOpenRouterModelName.value.length < 3) {
      openRouterSearchedModels.value = [];
      return;
    }

    searchingOpenRouterModels.value = true;

    try {
      const foundModels = await getOpenRouterModels(searchOpenRouterModelName.value, 100);

      openRouterSearchedModels.value = foundModels ?? [];
    } finally {
      searchingOpenRouterModels.value = false;
    }

    if(openRouterSearchedModels.value.length === 0) {
      openRouterSearchedModels.value = null;
    }
  }

  function lmStudioModelSelected() {
    if(newLmStudioModelName.value) {

      try {
        newLmStudioModelVisibleName.value = newLmStudioModelName.value.split('/')[0] + '/' + newLmStudioModelName.value.split('/')[1];
      } catch (e) {
        newLmStudioModelVisibleName.value = newLmStudioModelName.value;
      }
    }
  }

  function confirmAddOpenRouterModel(data) {
    if(!data) {
      return;
    }

    const newModel = createOpenRouterModel(data);

    importModel(newModel, (status) => {
      console.log(status);
    });

    addCloudModelDialogOpen.value = false;
  }

function confirmAddLmStudioModel() {
  const newModel = createLmStudioModel(newLmStudioModelVisibleName.value, newLmStudioModelName.value);

  importModel(newModel, (status) => {
    console.log(status);
  });

  addLmStudioModelDialog.value = false;
}

  const modelCategories = [
    { label: 'Cloud Models', value: 'Cloud', description: 'Run models on the cloud' },
    { label: 'Local Models', value: 'Ollama', description: 'Run models on your computer' }
  ];

  const allModelTags = [
    { label: 'ChatGPT', value: 'ChatGPT', icon: 'las la-flag' },
    { label: 'Claude', value: 'Claude', icon: 'las la-flag' },
    { label: 'Open Source', value: 'Open Source', icon: 'las la-flag' },

    { label: 'Complex', value: 'Complex', icon: 'las la-cogs' },
    { label: 'Medium Complexity', value: 'Medium Complexity', icon: 'las la-cog' },
    { label: 'Small Complexity', value: 'Small Complexity', icon: 'las la-cog' },

    { label: 'Multilingual', value: 'Multilingual', icon: 'las la-globe' },

    { label: 'Speed: Instant', value: 'Speed: Instant', icon: 'las la-rocket' },
    { label: 'Speed: Fast', value: 'Speed: Fast', icon: 'las la-rocket' },
    { label: 'Speed: Moderate', value: 'Speed: Moderate', icon: 'las la-rocket' },
    { label: 'Speed: Slow', value: 'Speed: Slow', icon: 'las la-rocket' },

    { label: 'Context: ~8k', value: 'Context: ~8k', icon: 'las la-book' },
    { label: 'Context: ~16k', value: 'Context: ~16k', icon: 'las la-book' },
    { label: 'Context: ~32k', value: 'Context: ~32k', icon: 'las la-book' },
    { label: 'Context: 100k +', value: 'Context: 100k +', icon: 'las la-book' },
  ];

  const allPromptTags = [
    { label: 'Story Writing', value: 'Story Writing', icon: 'las la-book' },
    { label: 'Writing', value: 'Writing', icon: 'las la-book' },
    { label: 'Grammar', value: 'Notes & Summaries', icon: 'las la-book' },
    { label: 'Translation', value: 'Translation', icon: 'las la-book' },

    { label: 'Brainstorming & Suggestions', value: 'Brainstorming & Suggestions', icon: 'las la-book' },
    { label: 'Notes & Summaries', value: 'Notes & Summaries', icon: 'las la-book' },
    { label: 'Text Transformation', value: 'Text Transformation', icon: 'las la-book' },
    { label: 'Random Generation', value: 'Notes & Summaries', icon: 'las la-book' },
  ];

  const modelCategory = ref('Cloud');
  const modelTags = ref([]);
  const promptTags = ref([]);

  const ollamaStatusPending = ref(true);
  const ollamaStatus = ref('Pending');
  const ollamaStatusColor = ref('white');
  const ollamaInstalled = ref(null);

  const loading = ref(false);

  async function getOllamaStatus () {
    ollamaStatusPending.value = true;
    ollamaInstalled.value = null;

    ollamaStatus.value = 'Pending';

    const status = await ollamaPing();

    if(status === true) {
      ollamaStatus.value = 'Running';
      ollamaStatusColor.value = 'positive';
      ollamaInstalled.value = true;
    } else {
      ollamaStatus.value = 'Not installed or not running';
      ollamaStatusColor.value = 'negative-4';
      ollamaInstalled.value = false;
    }

    ollamaStatusPending.value = false;
  }

    watch(modelTags, async (newValue, oldValue) => {
      await initialise();
    });

    watch(promptTags, async (newValue, oldValue) => {
      await initialise();
    });

  watch(modelCategory, async (newValue, oldValue) => {
    await initialise();

    if(newValue === 'Ollama') {
      getOllamaStatus();
    }
  });

  watch(props, async (newValue, oldValue) => {
    await initialise();
  });

  const items = ref([]);

  onMounted(async () => {
    await initialise();
  });

  const lmStudioStatus = ref('Unknown');
  const lmStudioStatusPending = ref(false);
  const lmStudioModels = ref([]);

  async function checkLmStudio() {
    lmStudioStatusPending.value = true;
    lmStudioStatus.value = 'Unknown';
    lmStudioModels.value = [];

    try {
      const response = await fetch(`http://localhost:${lmStudioPort.value}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        lmStudioStatus.value = 'Error or not running';
      } else {
        lmStudioStatus.value = 'Running';
        lmStudioModels.value = (await response.json()).data;
      }
    }
    catch(e) {
        lmStudioStatus.value = 'Error or not running';
    } finally {
      lmStudioStatusPending.value = false;
    }
  }

  async function initialise() {

    console.log('initalise');

    const categoryToLoad = '' + props.category;
    const loadedItems = await loadItems(categoryToLoad);

    if(props.category === categoryToLoad) {
      items.value = [];

      for (const item of loadedItems) {
        items.value.push(item);
      }
    } else {
      console.log('category changed, skipping');
    }
  }

  async function loadItems(category) {
    const client = directusClient;
    let result;

    loading.value = true;

    try {
      if(category === 'Models') {

        result = await client.request(readItems(category, { filter: { category: modelCategory.value, status: 'published' }, sort: ['sort', 'id'] }));

        const modelTagsRaw = modelTags.value.map(t => t.value);

        result = result.filter(item => {
          if(modelTags.value.length === 0) {
            return true;
          }

          return modelTagsRaw.every(t => item.tags?.includes(t) ?? false);
        });

      } else if(category === 'Prompt_Packages') {

        result = await client.request(readItems(category, { filter: { status: 'published' }, sort: ['sort', 'id']}));

        const promptTagsRaw = promptTags.value.map(t => t.value);

        result = result.filter(item => {
          if(promptTags.value.length === 0) {
            return true;
          }

          return promptTagsRaw.every(t => item.tags?.includes(t) ?? false);
        });

      } else {
        result = await client.request(readItems(category, { filter: { status: 'published' }, sort: ['sort', 'id']}));
      }

      /*result = result.filter(item => {
        return item.visible;
      })*/

      return result;
    } finally {
      loading.value = false;
    }
  }

  const hasAnyModels = computed(() => {
    return promptStore.models.length > 0;
  });

  function openBrowserPage(link) {
    open(link)
  }

</script>

<style scoped>

</style>
