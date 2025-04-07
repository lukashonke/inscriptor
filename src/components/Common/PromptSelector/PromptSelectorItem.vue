<template>
  <div ref="buttonRef" class="full-width">
    <template v-if="prompt.prompts">
      <q-btn flat size="10px" class="items-start row full-width" padding="5px 7px" no-caps>
        <div class="col-auto flex items-centers">
          <q-icon name="las la-folder" />
        </div>
        <div class="col text-left q-ml-sm q-mr-sm prompt-select-text">
          {{ truncate(prompt.label, 50) }}
        </div>
        <div class="col-auto flex items-centers">
          <q-icon name="arrow_drop_down" />
        </div>
        <q-menu>
          <template v-for="childPrompt in prompt.prompts" :key="childPrompt.title">
            <PromptSelectorItem :prompt="childPrompt" @promptClick="promptClick" />
          </template>
        </q-menu>
      </q-btn>
    </template>
    <template v-else>
      <div class="row full-width">
        <div class="col">
          <q-btn flat size="10px" @click="promptClick(prompt)" :class="['bg-' + prompt.color + '-1', boldness]" class="full-width row" no-caps padding="5px 7px" v-close-popup>
            <div class="col-auto flex items-centers">
              <q-icon :name="icon" />
            </div>
            <div class="col text-left q-ml-sm prompt-select-text">
                {{ truncate(prompt.title, 50) }}
            </div>
            <q-tooltip  :delay="1000">
              {{ prompt.description }}
              <!--<template v-if="prompt.guide">
                <div>{{ prompt.guide }}</div>
              </template>-->
            </q-tooltip>
          </q-btn>
        </div>
        <div class="col-auto flex items-center">
          <q-btn flat size="sm" icon="las la-ellipsis-v" :class="[menuButtonColor]" class="q-px-xs float-right">
            <q-menu>
              <q-list dense>

                <q-item clickable v-ripple>
                  <q-item-section side>
                    <q-icon name="mdi-creation-outline" :color="pinColor(prompt)" size="xs" />
                  </q-item-section>
                  <q-item-section>Prompt using model...</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>

                  <q-menu anchor="top end" self="top start">
                    <q-list>


                      <q-item
                        v-for="model in promptStore.models"
                        :key="model"
                        @click="promptUsingModel(prompt, model)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="las la-microchip" size="xs" />
                        </q-item-section>
                        <q-item-section>{{ model.name }}</q-item-section>
                      </q-item>

                    </q-list>
                  </q-menu>
                </q-item>

                <q-item clickable v-ripple>
                  <q-item-section side>
                    <q-icon name="mdi-creation-outline" :color="pinColor(prompt)" size="xs" />
                  </q-item-section>
                  <q-item-section>Prompt with creativity...</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>

                  <q-menu anchor="top end" self="top start">
                    <q-list>
                      <q-item
                        @click="promptWithTemperature(prompt, 1)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="mdi-palette" size="xs" />
                        </q-item-section>
                        <q-item-section>Very Creative (temperature 1)</q-item-section>
                      </q-item>

                      <q-item
                        @click="promptWithTemperature(prompt, 0.8)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="mdi-palette-outline" size="xs" />
                        </q-item-section>
                        <q-item-section>Creative (temperature 0.8)</q-item-section>
                      </q-item>

                      <q-item
                        @click="promptWithTemperature(prompt, 0.5)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="mdi-keyboard-outline" size="xs" />
                        </q-item-section>
                        <q-item-section>Deterministic (temperature 0.5)</q-item-section>
                      </q-item>

                      <q-item
                        @click="promptWithTemperature(prompt, 0)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="mdi-keyboard" size="xs" />
                        </q-item-section>
                        <q-item-section>Very Deterministic (temperature 0)</q-item-section>
                      </q-item>

                    </q-list>
                  </q-menu>
                </q-item>

                <q-separator />

                <q-item clickable v-ripple @click="stickyPrompt(prompt)" v-if="canBeSticky">
                  <q-item-section side>
                    <q-icon name="push_pin" :color="pinColor(prompt)" size="xs" />
                  </q-item-section>
                  <q-item-section v-if="!isSticky">Pin prompt</q-item-section>
                  <q-item-section v-else>Unpin prompt</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-ripple>
                  <q-item-section side>
                    <q-icon name="las la-table" :color="pinColor(prompt)" size="xs" />
                  </q-item-section>
                  <q-item-section>Move to Category</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>

                  <q-menu anchor="top end" self="top start">
                    <q-list>
                      <q-item
                        v-for="category in promptStore.promptCategories"
                        :key="category"
                        @click="moveToCategory(prompt, category.label)"
                        dense
                        clickable
                        :class="category.color + '-3'"
                      >
                        <q-item-section side>
                          <q-icon :name="category.icon" :color="category.color" size="xs" />
                        </q-item-section>
                        <q-item-section>{{ category.label }}</q-item-section>
                      </q-item>

                      <q-item
                        @click="createAndMoveToCategory(prompt)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="las la-plus" size="xs" />
                        </q-item-section>
                        <q-item-section>Create new</q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item
                        @click="layoutStore.openConfiguration('promptCategories')"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="mdi-playlist-edit" size="xs" />
                        </q-item-section>
                        <q-item-section>Edit categories...</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>

                <q-item clickable v-ripple>
                  <q-item-section side>
                    <q-icon name="las la-folder" :color="pinColor(prompt)" size="xs" />
                  </q-item-section>
                  <q-item-section>Move to Folder</q-item-section>
                  <q-item-section side>
                    <q-icon name="keyboard_arrow_right" />
                  </q-item-section>

                  <q-menu anchor="top end" self="top start">
                    <q-list>


                      <q-item
                        v-for="folder in promptStore.promptFolders"
                        :key="folder"
                        @click="moveToFolder(prompt, folder.label)"
                        dense
                        clickable
                        :class="folder.color + '-3'"
                      >
                        <q-item-section side>
                          <q-icon :name="folder.icon ?? 'las la-folder'" size="xs" />
                        </q-item-section>
                        <q-item-section>{{ folder.label }}</q-item-section>
                      </q-item>

                      <q-item
                        @click="createAndMoveToFolder(prompt)"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="las la-plus" size="xs" />
                        </q-item-section>
                        <q-item-section>Create new</q-item-section>
                      </q-item>
                      <q-separator />
                      <q-item
                        @click="layoutStore.openConfiguration('promptFolders')"
                        dense
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="mdi-playlist-edit" size="xs" />
                        </q-item-section>
                        <q-item-section>Edit folders...</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-item>

                <q-item
                  v-if="prompt.folder?.length > 0"
                  @click="removeFromFolder(prompt)"
                  dense
                  clickable
                >
                  <q-item-section side>
                    <q-icon name="las la-folder" size="xs" />
                  </q-item-section>
                  <q-item-section>Remove from folder</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-ripple @click="openSettings(prompt)">
                  <q-item-section side>
                    <q-icon name="las la-cog" size="xs" />
                  </q-item-section>
                  <q-item-section>Settings</q-item-section>
                </q-item>

                <q-separator />
                <q-item clickable v-ripple @click="deletePrompt(prompt)" class="text-negative">
                  <q-item-section side>
                    <q-icon name="las la-times" color="negative" size="xs" />
                  </q-item-section>
                  <q-item-section>Delete prompt</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import {useFileStore} from "stores/file-store";
import {computed, ref} from "vue";
import {useElementHover} from "@vueuse/core";
import {usePromptStore} from "stores/prompt-store";
import {Dialog} from "quasar";
import {useLayoutStore} from "stores/layout-store";
import {truncate} from "src/common/utils/textUtils";

const props = defineProps({
  prompt: {
    type: Object,
    required: true,
  },
});

const fileStore = useFileStore();
const promptStore = usePromptStore();
const layoutStore = useLayoutStore();

const buttonRef = ref(null);

const isHovered = useElementHover(buttonRef);

const icon = computed(() => {
  return props.prompt.icon ? props.prompt.icon : 'las la-circle';
});

const emit = defineEmits(['promptClick'])

function promptClick(prompt) {
  emit('promptClick', { prompt: prompt });
}

function promptUsingModel(prompt, model) {
  emit('promptClick', { prompt: prompt, forceModelId: model.id });
}

function promptWithTemperature(prompt, temperature) {
  emit('promptClick', { prompt: prompt, forceTemperature: temperature });
}

const menuButtonColor = computed(() => {
  return isHovered.value ? 'text-grey-8' : 'text-white';
});

const boldness = computed(() => {
  return isSticky.value ? 'text-weight-bold' : 'text-weight-normal';
});

const isSticky = computed(() => fileStore.isStickyPrompt(props.prompt, fileStore.selectedFile));

function pinColor(prompt) {
  return fileStore.isStickyPrompt(prompt, fileStore.selectedFile) ? 'yellow' : 'grey-8';
}

const canBeSticky = computed(() => props.prompt.promptType === "general" || props.prompt.promptType === "selection" || props.prompt.promptType === "insert");

function stickyPrompt(prompt) {
  if(fileStore.isStickyPrompt(prompt, fileStore.selectedFile)) {
    fileStore.unstickyPrompt(prompt, fileStore.selectedFile);
  } else {
    fileStore.stickyPrompt(prompt, fileStore.selectedFile);
  }
}

function deletePrompt(prompt) {
  Dialog.create({
    title: 'Delete prompt',
    message: 'Are you sure you want to delete this prompt?',
    ok: {
      label: 'Delete',
    },
    cancel: {
      label: 'Cancel',
    },
  }).onOk(() => {
    promptStore.removePrompt(prompt);
  });
}

function openSettings(prompt) {
  layoutStore.quickPromptSettingsOpen = true;
  layoutStore.quickPromptSettingsPrompt = prompt;
}

function moveToCategory(prompt, category) {
  prompt.category = category;
}

function moveToFolder(prompt, folder) {
  prompt.folder = folder;
}

function removeFromFolder(prompt) {
  prompt.folder = null;
}

function createAndMoveToCategory(prompt) {
  Dialog.create({
    title: 'Prompt',
    message: 'Enter name of the category:',
    prompt: {
      model: '',
      type: 'text' // optional
    },
    cancel: true,
    persistent: true
  }).onOk(data => {
    const created = promptStore.createCategory(data);

    prompt.category = created.label;

  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

function createAndMoveToFolder(prompt) {
  Dialog.create({
    title: 'Prompt',
    message: 'Enter name of the folder:',
    prompt: {
      model: '',
      type: 'text' // optional
    },
    cancel: true,
    persistent: true
  }).onOk(data => {
    const created = promptStore.createFolder(data);

    prompt.folder = created.label;

  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

</script>



<style scoped>

</style>
