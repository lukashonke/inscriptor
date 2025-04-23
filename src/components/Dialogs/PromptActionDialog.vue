<template>
  <q-dialog v-model="layoutStore.promptActionDialogOpen">
    <q-card style="width: 800px; max-width: 80vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ action.title }} action</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <template v-if="action.type === 'Add to Context'">

          <div class="text-subtitle2">Prompt result to be added to file:</div>
          <q-scroll-area style="height: 200px" class="bordered q-pa-sm bg-grey-2">
            <div v-html="markdownToHtml(promptResult.originalText ?? promptResult.text)"/>
          </q-scroll-area>

          <div class="text-subtitle2 q-mt-md">Available files with context <q-chip dense class="text-weight-bold">{{ action.typeParameter}}</q-chip>:</div>

          <q-list bordered>
            <q-item v-for="file in addToContextAvailableFiles" :key="file.id">
              <q-item-section avatar>
                <q-icon :name="file.icon" />
              </q-item-section>
              <q-item-section top>
                <q-item-label class="q-mt-sm">{{  file.title  }}
                <template v-if="file.settings?.contextType">
                  <q-badge :color="file.settings.contextType.color + '-3'" rounded class="q-ml-xs">
                    {{ file.settings?.contextType.label }}
                    <q-tooltip :delay="500">
                      This file is included in the {{ file.settings.contextType.label }} context.
                    </q-tooltip>
                  </q-badge>
                </template>
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn class="gt-xs" size="12px" flat dense label="Append" icon="playlist_add" @click="addToContext(file, true)">
                    <q-tooltip>Append your prompt result to the end of this file</q-tooltip>
                  </q-btn>
                  <q-btn class="gt-xs" size="12px" flat dense icon="add" label="Replace" @click="addToContext(file, false)">
                    <q-tooltip>Replace content of this file with your prompt result</q-tooltip>
                  </q-btn>

                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <q-btn class="gt-xs q-mt-md" size="12px" flat dense icon="mdi-plus" label="Create new file" @click="createNewFile()" >
            <q-tooltip>Create a new file with your prompt result as content</q-tooltip>
          </q-btn>
        </template>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
import {computed} from "vue";
import {useFileStore} from "stores/file-store";
import {usePromptStore} from "stores/prompt-store";
import {markdownToHtml} from "src/common/utils/textUtils";
const layoutStore = useLayoutStore();
const fileStore = useFileStore();
const promptStore = usePromptStore();

const action = computed(() => layoutStore.promptAction);
const promptResult = computed(() => layoutStore.promptActionPromptResult);

const addToContextAvailableFiles = computed(() => {

  const context = action.value.typeParameter;

  const files = fileStore.getContextFiles(context);
  return files;
});

function addToContext(file, append) {
  if(file && file.content) {
    if(append) {
      file.content += '<br>' + promptResult.value.text;
    } else {
      file.content = promptResult.value.text;
    }

    fileStore.setDirty(file);
  }

  layoutStore.promptActionDialogOpen = false;
}

async function createNewFile() {


  const file = await fileStore.addFile(action.value.typeParameter, null);
  if(file) {
    file.content = promptResult.value.text;

    const contextType = promptStore.contextTypes.find(ct => ct.label === action.value.typeParameter);

    if(contextType) {
      fileStore.updateFileSettings(file, {contextType: contextType });
    }

    fileStore.selectFile(file, true);
  }

  layoutStore.promptActionDialogOpen = false;
}

</script>

<style scoped>

</style>
