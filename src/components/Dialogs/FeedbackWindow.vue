<template>
  <q-dialog
    v-model="layoutStore.feedbackWindowOpened"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card style="width: 1200px; max-width: 90vw;">
      <q-card-section class="text-center">

        <iframe
          width="1024"
          height="800"
          style="border: none;"

          :src="computedUrl"
        >

        </iframe>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
import {computed} from "vue";
import {useCurrentUser} from "vuefire";

const layoutStore = useLayoutStore();

const user = useCurrentUser();

const computedUrl = computed(() => {
  if(user) {
    return `https://inscriptor.features.vote/board?api_key=8249b037-549a-474b-b236-8baa56499f47&is_embed=true&user_id=${user.value.uid}&user_email=${user.value.email}&user_name=${user.value.displayName}`
  }
  return null;
})

</script>

<style scoped>

</style>
