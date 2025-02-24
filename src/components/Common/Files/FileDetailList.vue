<template>
  <div>
    <div v-for="child in file.children ?? []" :key="child.id">
      <FileDetailListItem :file="child" :level="level" :view-summary="viewSummary" :view-note="viewNote" :automatic-text-correction="automaticTextCorrection"/>
    </div>
  </div>
</template>

<script setup>
  import FileDetailListItem from "components/Common/Files/FileDetailListItem.vue";
  import {ref} from "vue";

  const props = defineProps({
    file: {
      type: Object,
      required: false,
    },
    level: {
      type: Number,
      default: 0,
    },
    viewSummary: {
      type: Boolean,
      default: false,
    },
    viewNote: {
      type: Boolean,
      default: false,
    },
    automaticTextCorrection: {
      type: Boolean,
      default: true,
    },
  });

  const expanded = ref([]);

</script>

<style scoped>

</style>
