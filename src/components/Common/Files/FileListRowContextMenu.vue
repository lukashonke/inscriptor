<template>
  <q-list dense style="min-width: 100px">
    <q-item v-if="fileStore.checkCanHaveChildren(file)" clickable v-close-popup @click.prevent="addFile(file, $event)">
      <q-item-section avatar>
        <q-icon name="las la-plus"/>
      </q-item-section>
      <q-item-section>Add</q-item-section>
    </q-item>

    <q-separator />

    <q-item clickable v-close-popup @click.prevent="renameFile(file, $event)">
      <q-item-section avatar>
        <q-icon name="las la-pen"/>
      </q-item-section>
      <q-item-section>Rename</q-item-section>
    </q-item>

    <q-item clickable v-if="fileTemplates?.length > 0 && fileStore.checkCanHaveChildren(file)">
      <q-item-section avatar>
        <q-icon name="las la-plus"/>
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
        <q-icon name="las la-flag"/>
      </q-item-section>

      <q-item-section>State</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right"/>
      </q-item-section>

      <q-menu anchor="top end" self="top start">
        <q-list dense>
          <q-item clickable v-close-popup @click="fileStore.setFileState(file, null)" >
            <q-item-section side>
              <q-icon name="las la-times" color="transparent"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>Clear</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="fileStore.setFileState(file, label)" v-for="label in promptStore.statuses" :key="label.label" :active="file.state?.label === label.label" active-class="text-weight-bold">
            <q-item-section side>
              <q-icon name="las la-flag" :color="label.color"/>
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
        <q-icon name="las la-tag"/>
      </q-item-section>

      <q-item-section>Label</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right"/>
      </q-item-section>

      <q-menu anchor="top end" self="top start">
        <q-list dense>
          <q-item clickable v-close-popup @click="fileStore.clearFileLabels(file)" >
            <q-item-section side>
              <q-icon name="las la-times" color="transparent"/>
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

    <q-item clickable>
      <q-item-section avatar>
        <q-icon name="las la-copy"/>
      </q-item-section>

      <q-item-section>Copy Settings</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right"/>
      </q-item-section>

      <q-menu anchor="top end" self="top start">
        <q-list dense>
          <q-item clickable v-close-popup @click="applyToChildren(file)" >
            <q-item-section side>
              <q-icon name="las la-copy"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>Copy Settings to Children</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>

    </q-item>



    <q-item clickable v-close-popup @click="exportFile">
      <q-item-section avatar>
        <q-icon name="las la-download"/>
      </q-item-section>
      <q-item-section>Export...</q-item-section>
    </q-item>

    <q-separator/>
    <q-item clickable v-close-popup @click="deleteFile">
      <q-item-section avatar>
        <q-icon name="las la-trash" color="negative"/>
      </q-item-section>
      <q-item-section class="text-negative">Delete</q-item-section>
    </q-item>
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

function deleteFile () {

  Dialog.create({
    title: 'Delete file',
    message: 'Are you sure you want to delete this file? It cannot be reverted.',
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

const fileTemplates = computed(() => promptStore.fileTemplates);
</script>
