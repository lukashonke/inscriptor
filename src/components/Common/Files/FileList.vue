<template>
  <div class="" tabindex="0" @keydown="handleKeyDown" ref="fileListContainer">
    <template v-for="(file, index) in files"
              :key="file.id">
      <FileListRow :file="file" :is-last-children="index === files.length - 1" :focused-file-id="focusedFileId" />
    </template>
  </div>
</template>

<script setup>
  import {useFileStore} from "stores/file-store";
  import {computed, ref, watch, nextTick} from "vue";
  import FileListRow from "components/Common/Files/FileListRow.vue";
  import {Dialog} from "quasar";

  const fileStore = useFileStore();
  const fileListContainer = ref(null);

  const files = computed(() => fileStore.files);

  // Keyboard navigation state
  const focusedFileId = ref(null);

  // Get all visible files (respecting expand/collapse state)
  const visibleFiles = computed(() => {
    const result = [];

    function addFileAndChildren(file) {
      result.push(file);
      if (file.expanded && file.children && file.children.length > 0) {
        file.children.forEach(child => addFileAndChildren(child));
      }
    }

    files.value.forEach(file => addFileAndChildren(file));
    return result;
  });

  // Get index of currently focused file
  const focusedIndex = computed(() => {
    if (!focusedFileId.value) return -1;
    return visibleFiles.value.findIndex(f => f.id === focusedFileId.value);
  });

  // Initialize focus to selected file or first file
  watch(() => fileStore.selectedFile, (newFile) => {
    if (newFile && !focusedFileId.value) {
      focusedFileId.value = newFile.id;
    }
  }, { immediate: true });

  // Initialize with first file if no selection
  watch(visibleFiles, (newFiles) => {
    if (!focusedFileId.value && newFiles.length > 0) {
      focusedFileId.value = newFiles[0].id;
    }
  }, { immediate: true });

  // Handle keyboard navigation
  function handleKeyDown(event) {
    const currentIndex = focusedIndex.value;
    const currentFile = currentIndex >= 0 ? visibleFiles.value[currentIndex] : null;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (currentIndex < visibleFiles.value.length - 1) {
        focusedFileId.value = visibleFiles.value[currentIndex + 1].id;
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (currentIndex > 0) {
        focusedFileId.value = visibleFiles.value[currentIndex - 1].id;
      }
    } else if (event.key === 'ArrowRight' && currentFile) {
      event.preventDefault();
      // Expand if has children and not expanded
      if (currentFile.children && currentFile.children.length > 0 && !currentFile.expanded) {
        currentFile.expanded = true;
      }
    } else if (event.key === 'ArrowLeft' && currentFile) {
      event.preventDefault();
      // Collapse if expanded, otherwise move to parent
      if (currentFile.expanded && currentFile.children && currentFile.children.length > 0) {
        currentFile.expanded = false;
      } else if (currentFile.parent && !currentFile.parent.isTrashBin) {
        focusedFileId.value = currentFile.parent.id;
      }
    } else if (event.key === 'Enter' && currentFile) {
      event.preventDefault();
      // Open/select the file
      fileStore.selectFile(currentFile);
    } else if (event.key === 'Delete' && currentFile) {
      event.preventDefault();
      // Prompt for deletion (only for non-static files)
      if (!currentFile.isStatic && !currentFile.isTrashBin) {
        deleteFile(currentFile);
      }
    }
  }

  // Delete file with confirmation
  function deleteFile(file) {
    Dialog.create({
      title: 'Move to Trash',
      message: `Are you sure you want to move "${file.title}" to trash?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      if (fileStore.selectedFile?.id === file.id) {
        fileStore.selectFile(null);
      }

      await fileStore.removeFile(file.id);

      // Move focus to next file or previous if at end
      const currentIndex = focusedIndex.value;
      if (currentIndex >= visibleFiles.value.length) {
        // Was last file, move to previous
        if (visibleFiles.value.length > 0) {
          focusedFileId.value = visibleFiles.value[visibleFiles.value.length - 1].id;
        }
      } else if (visibleFiles.value.length > 0) {
        // Move to file now at current index
        focusedFileId.value = visibleFiles.value[currentIndex].id;
      }
    });
  }
</script>

<style scoped>

</style>
