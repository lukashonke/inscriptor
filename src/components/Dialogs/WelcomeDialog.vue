<template>
  <q-dialog v-model="layoutStore.loginDialogOpen" persistent>
    <q-card style="width: 600px; max-width: 80vw;">
      <q-card-section class="row q-gutter-x-md q-pa-none">
        <LoginDialog />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {usePromptStore} from "stores/prompt-store";

  const layoutStore = useLayoutStore();
  const promptStore = usePromptStore();

  import LoginDialog from "components/Dialogs/LoginDialog.vue";

</script>

<style scoped>

</style>
