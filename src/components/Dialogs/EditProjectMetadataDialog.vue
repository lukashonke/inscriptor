<template>
  <q-dialog v-model="layoutStore.editProjectMetadataOpen" v-if="projectName" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ projectName }} project</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">
        <q-input filled dense v-model="projectName" label="Project name"/>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn icon="mdi-download" label="Download Project" color="primary" @click="downloadProject" no-caps/>
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed, ref} from "vue";
  import {useCurrentUser} from "vuefire";
  import {useFileStore} from "stores/file-store";
  import {htmlTemplate} from "assets/exportTemplates/htmlTemplate";
  import {save} from "@tauri-apps/plugin-dialog";
  import {downloadFile} from "src/common/utils/browserUtils";
  import {writeTextFile} from "@tauri-apps/plugin-fs";

  const user = useCurrentUser();

  const layoutStore = useLayoutStore();
  const fileStore = useFileStore();

  const projectName = computed({
    get: () => fileStore.projectName,
    set: (value) => {
      if(value) {
        fileStore.projectName = value;
      }
    }
  });

  async function downloadProject() {
    await fileStore.downloadCloudProject(fileStore.projectId);
  }

</script>

<style scoped>

</style>
