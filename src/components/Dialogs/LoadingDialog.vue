<template>
  <q-dialog v-model="layoutStore.loadingDialogOpen" persistent full-width full-height>
    <div class="flex items-center justify-around" flat bordered>
      <div class="flex">
        <q-spinner-tail color="white" size="60px"/>
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
const layoutStore = useLayoutStore();

</script>

<style scoped>

</style>
