<template>
  <q-dialog v-model="layoutStore.errorDialogOpen" persistent style="z-index: 1000">
    <q-card >
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Error Occured :(</div>
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">
        Apologies, an unexpected error occured. Inscriptor cloud may be offline.
        Please restart the application and try again.
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn  label="Restart" color="negative" @click="restart"/>
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {useCurrentUser} from "vuefire";
  import {useFileStore} from "stores/file-store";

  const user = useCurrentUser();

  const layoutStore = useLayoutStore();
  const fileStore = useFileStore();

  function restart() {
    window.location.reload();
  }

</script>

<style scoped>

</style>
