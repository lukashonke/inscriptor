<template>
  <q-list dense style="min-width: 100px">
    <!-- Files in trash bin: Show only restore and permanent delete -->
    <template v-if="isInTrashBin">
      <q-item clickable v-close-popup @click="restoreFile">
        <q-item-section avatar>
          <q-icon name="mdi-restore" color="positive"/>
        </q-item-section>
        <q-item-section class="text-positive">Restore</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="permanentlyDeleteFile">
        <q-item-section avatar>
          <q-icon name="mdi-delete-forever" color="negative"/>
        </q-item-section>
        <q-item-section class="text-negative">Delete Permanently</q-item-section>
      </q-item>
    </template>

    <!-- Trash bin specific: Show only empty trash option -->
    <template v-else-if="file.isTrashBin">
      <q-item clickable v-close-popup @click="emptyTrash" :disable="trashIsEmpty">
        <q-item-section avatar>
          <q-icon name="mdi-delete-empty" color="negative"/>
        </q-item-section>
        <q-item-section class="text-negative">Empty Trash</q-item-section>
      </q-item>
    </template>

    <!-- Regular files (not in trash, not trash bin): Show all operations -->
    <template v-else>
      <q-item v-if="fileStore.checkCanHaveChildren(file)" clickable v-close-popup @click.prevent="addFile(file, $event)">
        <q-item-section avatar>
          <q-icon name="mdi-plus"/>
        </q-item-section>
        <q-item-section>Add</q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-close-popup @click.prevent="renameFile(file, $event)">
        <q-item-section avatar>
          <q-icon name="mdi-pencil-outline"/>
        </q-item-section>
        <q-item-section>Rename</q-item-section>
      </q-item>

      <q-item clickable v-close-popup @click.prevent="cloneFile(file, $event)">
        <q-item-section avatar>
          <q-icon name="mdi-content-copy"/>
        </q-item-section>
        <q-item-section>Clone</q-item-section>
      </q-item>

      <q-item clickable v-if="fileTemplates?.length > 0 && fileStore.checkCanHaveChildren(file)">
        <q-item-section avatar>
          <q-icon name="mdi-plus"/>
        </q-item-section>

        <q-item-section>Add from template</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right"/>
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list dense>
            <q-item clickable v-close-popup @click="addTemplate(file, template)" v-for="template in fileTemplates"
                    :key="template.id">
              <q-item-section>
                <q-item-label>{{ file.title }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon :name="file.icon"/>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

      </q-item>

      <q-item clickable>
        <q-item-section avatar>
          <q-icon name="mdi-flag-outline"/>
        </q-item-section>

        <q-item-section>State</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right"/>
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list dense>
            <q-item clickable v-close-popup @click="fileStore.setFileState(file, null)" >
              <q-item-section side>
                <q-icon name="mdi-close" color="transparent"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Clear</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="fileStore.setFileState(file, label)" v-for="label in promptStore.statuses" :key="label.label" :active="file.state?.label === label.label" active-class="text-weight-bold">
              <q-item-section side>
                <q-icon name="mdi-flag-outline" :color="label.color"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ label.label }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="layoutStore.openConfiguration('statuses')" >
              <q-item-section side>
                <q-icon name="mdi-playlist-edit" color="primary"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Edit statuses...</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

      </q-item>

      <q-item clickable>
        <q-item-section avatar>
          <q-icon name="mdi-tag-outline"/>
        </q-item-section>

        <q-item-section>Label</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right"/>
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list dense>
            <q-item clickable v-close-popup @click="fileStore.clearFileLabels(file)" >
              <q-item-section side>
                <q-icon name="mdi-close" color="transparent"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Clear</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="fileStore.toggleFileLabel(file, label)" v-for="label in promptStore.labels" :key="label.label" :active="fileStore.hasFileLabel(file, label)" active-class="text-weight-bold">
              <q-item-section side>
                <q-badge :color="label.color"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ label.label }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="layoutStore.openConfiguration('labels')" >
              <q-item-section side>
                <q-icon name="mdi-playlist-edit" color="primary"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Edit labels...</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

      </q-item>

      <!--<q-item clickable>
        <q-item-section avatar>
          <q-icon name="mdi-content-copy"/>
        </q-item-section>

        <q-item-section>Copy Settings</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right"/>
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list dense>
            <q-item clickable v-close-popup @click="applyToChildren(file)" >
              <q-item-section side>
                <q-icon name="mdi-content-copy"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Copy Settings to Children</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>-->

      <q-item clickable v-close-popup @click="exportFile">
        <q-item-section avatar>
          <q-icon name="mdi-download"/>
        </q-item-section>
        <q-item-section>Export...</q-item-section>
      </q-item>

      <q-separator/>
      <!-- Regular files: Show normal delete (but not for static files) -->
      <q-item v-if="!file.isStatic" clickable v-close-popup @click="deleteFile">
        <q-item-section avatar>
          <q-icon name="mdi-delete-outline" color="negative"/>
        </q-item-section>
        <q-item-section class="text-negative">Delete</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>
<script setup>
import {useFileStore} from "stores/file-store";
import {computed} from "vue";
import {Dialog} from "quasar";
import {usePromptStore} from "stores/prompt-store";
import {useLayoutStore} from "stores/layout-store";

const fileStore = useFileStore();
const promptStore = usePromptStore();
const layoutStore = useLayoutStore();

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
});

// Check if file is in trash bin
const isInTrashBin = computed(() => {
  return props.file.parentId === '__trash_bin__' || props.file.deletedAt;
});

// Check if trash bin is empty
const trashIsEmpty = computed(() => {
  if (!props.file.isTrashBin) return false;
  return !props.file.children || props.file.children.length === 0;
});

function deleteFile () {

  Dialog.create({
    title: 'Move to Trash',
    message: 'Are you sure you want to move this file to trash? You can restore it later from the trash bin.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    if(fileStore.selectedFile?.id === props.file.id) {
      fileStore.selectFile(null);
    }

    fileStore.removeFile(props.file.id);
  }).onOk(() => {
    // console.log('>>>> second OK catcher')
  }).onCancel(() => {
    // console.log('>>>> Cancel')
  }).onDismiss(() => {
    // console.log('I am triggered on both OK and Cancel')
  })
}

async function exportFile() {
  layoutStore.exportDialogOpen = true;
  layoutStore.exportDialogFile = props.file;
}

async function addTemplate(parent, template) {
  const file = await fileStore.addFile(template.title, parent, template);
  if(file) {
    fileStore.selectFile(file, true);
  }
}

async function addFile(parent, event) {
  const file = await fileStore.addFile('New', parent);
  if(file) {
    fileStore.selectFile(file, true);
  }

  if(event) {
    event.stopPropagation();
  }
}

function renameFile(file, event) {
  Dialog.create({
    title: 'Rename file',
    prompt: {
      model: file.title,
      isValid: val => val.length > 1,
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(data => {
    if(data && data.length > 1) {
      file.title = data;
      fileStore.setDirty(file);
    }
  });

  if(event) {
    event.stopPropagation();
  }
}

async function cloneFile(file, event) {
  const clonedFile = await fileStore.cloneFile(file);
  if (clonedFile) {
    fileStore.selectFile(clonedFile, true);
  }

  if(event) {
    event.stopPropagation();
  }
}

function applyToChildren(file) {
  if (file && file.children && file.children.length > 0) {
    file.children.forEach(child => {
      fileStore.updateFileSettings(child, file.settings);
      applyToChildren(child);
    });
  }
}

function countChildrenResursive(file) {
  let count = 0;
  if (file && file.children && file.children.length > 0) {
    count += file.children.length;
    file.children.forEach(child => {
      count += countChildrenResursive(child);
    });
  }
  return count;
}

async function restoreFile() {
  await fileStore.restoreFile(props.file.id);
}

function permanentlyDeleteFile() {
  Dialog.create({
    title: 'Permanently Delete File',
    message: 'Are you sure you want to permanently delete this file? This action cannot be undone.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await fileStore.permanentlyDeleteFile(props.file.id);
  });
}

function emptyTrash() {
  Dialog.create({
    title: 'Empty Trash',
    message: 'Are you sure you want to permanently delete all files in the trash? This action cannot be undone.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await fileStore.emptyTrash();
  });
}

const fileTemplates = computed(() => promptStore.fileTemplates);
</script>
