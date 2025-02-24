<template>
  <q-dialog
    maximized
    v-model="layoutStore.tutorialOpened"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="">
      <q-card-section class="row items-center">
        <div class="text-h6">Inscriptor App-Tour</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-separator />

      <div class="pattern-bg">
        <q-card-section class="no-padding q-px-md">
          <div style="position: relative; box-sizing: content-box; max-height: 80vh; max-height: 80svh; width: 100%; aspect-ratio: 1.775480059084195; padding: 40px 0 40px 0;"><iframe :src="code" loading="lazy" title="Supademo Demo" allow="clipboard-write" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>
        </q-card-section>
      </div>

      <q-card-actions align="right" class="">
        <q-btn color="accent" icon="mdi-check" label="Finish" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
import {computed} from "vue";

const layoutStore = useLayoutStore();

const code = computed(() => layoutStore.tutorialCode);

</script>

<style scoped>

</style>
