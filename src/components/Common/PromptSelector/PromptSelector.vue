<template>
  <div class="row" style="width: 600px;">
    <div class="col-auto right-border bg-grey-1" id="promptSelectorCategories">
      <div class="row">
        <div class="col full-width">
          <q-btn
            no-caps
            size="12px"
            label="New Prompt"
            icon="mdi-creation-outline"
            :class="[
              'bg-primary' + (currentPromptCategory === '-custom-' ? '-1' : '-0'),
               'text-accent'
               ]"
            class="full-width items-start"
            unelevated
            @click="currentPromptCategory = '-custom-'">
          </q-btn>
        </div>
      </div>
      <q-separator class=""/>
      <div v-for="category in categories"
           :key="category.label" class="row">
        <div class="col full-width">
          <q-btn
            size="12px"
            no-caps
            :label="category.label.length === 0 ? 'Default' : category.label"
            :icon="category.icon ?? 'las la-circle'"
            :class="[
              'bg-' + (category.color ?? 'blue') + (currentPromptCategory === category.label ? '-1' : '-0'),
               'text-' + (category.color ?? 'blue') + '-9'
               ]"
            class="full-width items-start"
            unelevated
            @click="currentPromptCategory = category.label">
            <q-menu context-menu>
              <q-list dense>
                <q-item clickable v-ripple class="" @click="promptStore.pushCategoryOrder(category, -1)">
                  <q-item-section side>
                    <q-icon name="las la-arrow-up" size="xs" />
                  </q-item-section>
                  <q-item-section>Move Up</q-item-section>
                </q-item>
                <q-item clickable v-ripple class="" @click="promptStore.pushCategoryOrder(category, 1)">
                  <q-item-section side>
                    <q-icon name="las la-arrow-down" size="xs" />
                  </q-item-section>
                  <q-item-section>Move Down</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-ripple class="text-negative" @click="deleteAllPrompts(category)">
                  <q-item-section side>
                    <q-icon name="las la-times" size="xs" />
                  </q-item-section>
                  <q-item-section>Delete prompts in this category</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-ripple class="" @click="layoutStore.openConfiguration('promptCategories')">
                  <q-item-section side>
                    <q-icon name="mdi-playlist-edit" size="xs" />
                  </q-item-section>
                  <q-item-section>Edit categories...</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-tooltip v-if="category.description" :delay="1000">
              {{category.description}}
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <q-separator class=""/>

      <div class="row">
        <div class="col full-width">
          <q-btn
            no-caps
            size="12px"
            label="Open Inscriptor Hub"
            icon="las la-store"
            :class="[
              'bg-primary-0',
               'text-black'
               ]"
            class="full-width items-start"
            unelevated
            @click="layoutStore.promptMarketplaceOpen = true">
          </q-btn>
        </div>
      </div>
    </div>
    <div class="col" style="width: 600px;" >
      <div class="row">

        <template v-if="selectedCategory">
          <q-card-section  class="full-width text-center no-padding">
            <div v-if="selectedCategory.description" class="q-py-sm q-px-md text-left text-italic text-caption text-grey-6">
              {{selectedCategory.description}}
            </div>
          </q-card-section>
        </template>


        <q-card-section v-if="currentPromptCategory === '-custom-'" class="q-gutter-y-sm" style="width: 480px;" id="promptSelectorCustomPrompt">
          <InputWithAi v-model="customPromptText" :autofocus="true" :filled="true" label="Instructions for AI" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Prompt Refiner')" :prompt-input="customPromptText" class="write-monospace" :automatic-text-correction="false"/>
          <div class="row">
            <div class="col-auto">
              <q-select v-model="customPromptModel" :options="models" filled dense options-dense square label="AI Model" class="" />
            </div>
            <div class="col-12 q-mt-lg">
              <q-btn-dropdown icon="mdi-creation-outline" split label="Prompt" :disable="!canCustomPrompt" color="accent" @click="customPromptClick" class="full-width">
                <q-list>
                  <q-item dense clickable v-close-popup @click="turnIntoPrompt">
                    <q-item-section avatar>
                      <q-icon name="mdi-file" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Save as Prompt</q-item-label>
                    </q-item-section>
                  </q-item>

                </q-list>
              </q-btn-dropdown>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="full-width q-pa-sm" v-if="groupPromptsByFolder(categoryPrompts).length > 0">
          <div class="q-pa-sm shadow-1">
            <div class="q-mt-xs">
              <template v-for="prompt in groupPromptsByFolder(categoryPrompts)" :key="prompt.id">
                <div class="row text-caption full-width q-pb-xs">
                  <PromptSelectorItem :prompt="prompt" @promptClick="promptClick" />
                </div>
              </template>
            </div>
          </div>
        </q-card-section>
      </div>
    </div>
  </div>

</template>

<script setup>
import {computed, onMounted, ref} from "vue";
import {usePromptStore} from "stores/prompt-store";
import {groupBy} from "src/common/utils/arrayUtils";
import {useFileStore} from "stores/file-store";
import PromptSelectorItem from "components/Common/PromptSelector/PromptSelectorItem.vue";
import {isTextLlm} from "src/common/utils/modelUtils";
import {useLayoutStore} from "stores/layout-store";
import {Dialog} from "quasar";
import InputWithAi from "components/Common/InputWithAi.vue";

const promptStore = usePromptStore();
const layoutStore = useLayoutStore();
const fileStore = useFileStore();

const customPromptText = ref('');

const customPromptModelValue = computed({
  get: () => {
    return layoutStore.customPromptModelValue;
  },
  set: (value) => {
    layoutStore.customPromptModelValue = value;
  }
})

const models = computed(() => promptStore.models.filter(m => isTextLlm(m.type)).map(tab => ({label: tab.name, value: tab.id})));
const selectedCategory = computed(() => {
  return categories.value.find(c => c.label === currentPromptCategory.value);
});

const customPromptModel = computed({
  get: () => {
    const t = promptStore.getModel(customPromptModelValue.value);
    if(!t) {
      const firstModel = models.value[0];
      return firstModel;
    }
    return {
      label: t.name,
      value: t.id,
    };
  },
  set: (value) => {
    customPromptModelValue.value = value.value;
  }
});

const canCustomPrompt = computed(() => customPromptText.value.length > 0 && promptStore.models.length > 0);

function createAdhocPrompt(userPrompt) {
  let userPromptText = userPrompt;
  let systemPromptText = customPromptText.value + "\n\n$context\n";

  if(!fileStore.selectedFile || fileStore.selectedFile.content.trim() == '') {
    userPromptText = systemPromptText;
    systemPromptText = 'You are a helpful assistant. Perform the following task to the best of your ability.';
  }

  const customPrompt = promptStore.getCustomAdhocPrompt(props.promptTypes, systemPromptText, userPromptText);

  customPrompt.id = customPrompt.id + '-Custom';
  customPrompt.modelId = customPromptModel.value.value;

  return customPrompt;
}

async function customPromptClick() {
  const userPrompt = props.promptTypes === 'insert' ? "$text" : "$selection"

  const customPrompt = createAdhocPrompt(userPrompt);

  promptClick(customPrompt);
}

async function turnIntoPrompt() {
  layoutStore.openAddPromptDialog(true, customPromptModel.value.value, customPromptText.value, null, 'New Prompt');
  return;
}

const props = defineProps({
  promptTypes: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['promptClick'])

function promptClick(promptClickData) {
  emit('promptClick', promptClickData);
}

const currentPromptCategory = ref('');

onMounted(() => {
  currentPromptCategory.value = '-custom-';
});

const categories = computed(() => {
  // Get deduplicated category labels from prompts the user can see
  const allPrompts = getPrompts()
    .filter(p => promptStore.canPrompt(p))
    .map(p => p.category ?? "");
  const deduplicatedPrompts = [...new Set(allPrompts)];

  // Will be our final ordered list
  const retValue = [];

  // First, push any "official" categories in the order they appear in promptStore.promptCategories,
  // but only if they exist in deduplicatedPrompts
  for (const cat of promptStore.promptCategories) {
    if (deduplicatedPrompts.includes(cat.label)) {
      retValue.push(cat);
    }
  }

  // Then, push any remaining categories (that are not in promptStore.promptCategories)
  // as a fallback
  for (const pd of deduplicatedPrompts) {
    const existingCategory = promptStore.promptCategories.find(cat => cat.label === pd);
    if (!existingCategory) {
      retValue.push({
        label: pd,
        icon: 'las la-circle'
      });
    }
  }

  return retValue;
});

const categoryPrompts = computed(() => {
  const prompts = getPrompts().filter(p => promptStore.canPrompt(p)).filter(p => p.category === currentPromptCategory.value || (currentPromptCategory.value === '' && !p.category))
  return prompts;
});

/*const promptsGroupedByModel = computed(() => {
  const prompts = getPrompts().filter(p => promptStore.canPrompt(p)).filter(p => p.category === currentPromptCategory.value || (currentPromptCategory.value === '' && !p.category))
  const grouping = groupBy(prompts, 'modelId');

  return groupByToArray(grouping);
});*/

function getPrompts() {
  if((props.promptTypes === 'selection')) {
    return promptStore.selectionPrompts;
  } else if (props.promptTypes === 'insert') {
    return promptStore.insertPrompts;
  } else if (props.promptTypes === 'selectionAnalysis') {
    return promptStore.selectionAnalysisPrompts;
  }
}

function groupByToArray(grouping) {
  const retValue = [];

  for(const key in grouping) {
    retValue.push({
      modelId: key,
      prompts: grouping[key]
    });
  }

  return retValue;
}

function deleteAllPrompts(category) {
  Dialog.create({
    title: 'Delete all prompts',
    message: 'Are you sure you want to delete all prompts in this category?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    const prompts = promptStore.prompts.filter(p => p.category === category.label);
    for (const prompt of prompts) {
      promptStore.removePrompt(prompt);
    }
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

function groupPromptsByFolder(prompts) {
  const retValue = [];
  const allFolders = promptStore.promptFolders;
  const usedFolders = [];

  //TODO kdyz nema folder, pridej normalne do listu

  for(const prompt of prompts) {
    if(prompt.folder?.length > 0) {
      const folder = allFolders.find(f => f.label === prompt.folder);
      let usedFolder = usedFolders.find(f => f.label === prompt.folder);

      if(usedFolder) {
        usedFolder.prompts.push(prompt);
      } else {
        usedFolder = {
          label: prompt.folder,
          icon: folder?.icon ?? 'las la-folder',
          color: folder?.color ?? 'black',
          prompts: [prompt]
        };
        usedFolders.push(usedFolder);
        retValue.push(usedFolder);
      }
    } else {
      retValue.push(prompt);
    }
  }

  return retValue;
}
</script>



<style scoped>

</style>
