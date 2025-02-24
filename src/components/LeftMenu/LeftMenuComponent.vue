<template>
  <div class="q-py-sm column">
    <div class="text-primary text-subtitle2 q-ml-sm q-mr-sm q-mb-md">
      <q-btn color="primary" dense class="q-ml-xs full-width" no-caps @click="layoutStore.projectSelectionDialogOpen = true" v-if="fileStore.projectId">
        <div class="row full-width">
          <div class="col-auto q-ml-xs">
            <template v-if="fileStore.projectSettings?.syncToCloud">
              <q-spinner v-if="layoutStore.projectSyncIndicator" class="absolute" />
              <q-icon v-else name="las la-cloud" class="absolute" />
            </template>
            <template v-else>
              <q-icon name="las la-folder" class="absolute" />
            </template>

          </div>
          <div class="col">
            {{ currentProjectName ?? "(unknown project)" }}
          </div>
          <div class="col-auto">

          </div>
        </div>
      </q-btn>
    </div>

    <div class="col-auto" id="files">
      <FileList />
    </div>
    <div class="col-auto flex justify-center q-mt-md">
      <q-btn dense unelevated icon="add" color="primary" flat @click="add" v-if="fileTemplates.length === 0" class="full-width">
      </q-btn>
      <q-btn-dropdown v-else dense unelevated icon="las la-plus" @click="add" split>
        <q-list>
          <q-item clickable v-close-popup @click="addTemplate(file)" v-for="file in fileTemplates" :key="file.id">
            <q-item-section>
              <q-item-label>{{ file.title }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon :name="file.icon" />
            </q-item-section>
          </q-item>
        </q-list>

      </q-btn-dropdown>
    </div>
    <q-separator class="q-mb-xl"/>
    <div class="q-mb-lg" />
  </div>
</template>

<script setup>

import FileList from "components/Common/Files/FileList.vue";
import {useFileStore} from "stores/file-store";
import {useLayoutStore} from "stores/layout-store";
import {usePromptStore} from "stores/prompt-store";
import {computed} from "vue";

const fileStore = useFileStore();
const layoutStore = useLayoutStore();
const promptStore = usePromptStore();

const currentProjectName = computed(() => fileStore.projectName);

async function add() {
  const file = await fileStore.addFile('New');
  if(file) {
    fileStore.selectFile(file, true);
  }
}

async function addTemplate(template) {
  const file = await fileStore.addFile(template.title, null, template);
  if(file) {
    fileStore.selectFile(file, true);
  }
}

const fileTemplates = computed(() => promptStore.fileTemplates);

</script>

<style scoped>

</style>
