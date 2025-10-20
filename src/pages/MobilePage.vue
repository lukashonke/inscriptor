<template>
  <q-page class="mobile-page">
    <div class="full-width full-height">
      <FileDetail />
    </div>
  </q-page>
</template>

<script setup>
import {onMounted} from 'vue'
import {useLayoutStore} from "stores/layout-store";
import FileDetail from 'components/MainPanel/FileDetail.vue';

const layoutStore = useLayoutStore();

onMounted(() => {
  console.log('Mobile page mounted');
})

</script>

<style scoped>
.mobile-page {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
