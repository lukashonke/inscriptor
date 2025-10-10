<template>
  <q-dialog v-model="layoutStore.editProjectMetadataOpen" v-if="projectName" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Project Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">
        <q-input
          filled
          dense
          v-model="localProjectName"
          label="Project name"
          hint="Minimum 5 characters"
          :rules="[val => val && val.trim().length >= 5 || 'Must be at least 5 characters']"
        />
        <div v-if="hasChanges" class="q-mt-sm">
          <q-btn
            icon="mdi-pencil"
            label="Rename"
            color="primary"
            @click="renameProject"
            no-caps
          />
        </div>
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
  import {computed, ref, watch} from "vue";
  import {useCurrentUser} from "vuefire";
  import {useFileStore} from "stores/file-store";
  import {htmlTemplate} from "assets/exportTemplates/htmlTemplate";
  import {save} from "@tauri-apps/plugin-dialog";
  import {downloadFile} from "src/common/utils/browserUtils";
  import {writeTextFile} from "@tauri-apps/plugin-fs";
  import {Notify} from "quasar";

  const user = useCurrentUser();

  const layoutStore = useLayoutStore();
  const fileStore = useFileStore();

  // Local state for editing
  const localProjectName = ref('');

  // Computed property for original project name
  const projectName = computed(() => fileStore.projectName);

  // Check if there are changes and name meets requirements
  const hasChanges = computed(() => {
    return localProjectName.value !== projectName.value &&
           localProjectName.value.trim().length >= 5;
  });

  // Watch for dialog open/close and store changes to sync local state
  watch(() => layoutStore.editProjectMetadataOpen, (isOpen) => {
    if (isOpen) {
      localProjectName.value = projectName.value || '';
    }
  }, { immediate: true });

  watch(() => projectName.value, (newName) => {
    if (newName && !hasChanges.value) {
      localProjectName.value = newName;
    }
  });

  function renameProject() {
    const trimmedName = localProjectName.value.trim();

    if (trimmedName.length < 5) {
      Notify.create({
        message: 'Project name must be at least 5 characters',
        color: 'negative',
        position: 'top'
      });
      return;
    }

    fileStore.projectName = trimmedName;

    Notify.create({
      message: 'Project renamed successfully',
      color: 'positive',
      position: 'top'
    });
  }

  async function downloadProject() {
    await fileStore.downloadCloudProject(fileStore.projectId);
  }

</script>

<style scoped>

</style>
