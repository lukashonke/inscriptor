<template>
  <div class="">
    <template v-for="(file, index) in files"
              :key="file.id">
      <FileListRow :file="file" :is-last-children="index === files.length - 1" />
    </template>
  </div>
</template>

<script setup>
  import {useFileStore} from "stores/file-store";
  import {computed} from "vue";
  import FileListRow from "components/Common/Files/FileListRow.vue";

  const fileStore = useFileStore();

  const files = computed(() => fileStore.files);
</script>

<style scoped>

</style>
