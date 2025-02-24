<template>
  <q-dialog v-model="layoutStore.quickPromptSettingsOpen" >
    <q-card style="width: 1000px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Prompt Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <PromptSettingsItem :prompt="layoutStore.quickPromptSettingsPrompt" :start-expanded="true"/>
      </q-card-section>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import PromptSettingsItem from "components/Common/Settings/PromptSettingsItem.vue";
  import {useLayoutStore} from "stores/layout-store";


  const layoutStore = useLayoutStore();
</script>

<style scoped>

</style>
