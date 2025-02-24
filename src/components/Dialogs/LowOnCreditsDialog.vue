<template>
  <q-dialog v-model="layoutStore.lowOnCreditsDialog" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Not enough Cloud AI Credits 😔</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">
        <div class="text-left">
          <div class="">You do not have enough credits to run cloud AI.</div>
          <div class="text-weight-regular q-mb-md">Please consider purchasing more.</div>
          <div class="bordered q-pa-sm" v-if="credits">You currently have {{ credits }} credits.</div>

          <div v-if="subscriptionLevel === 1" class="q-mt-md q-pa-sm bordered bg-amber-1">
            <q-icon name="las la-crown" color="amber" class=""/>
            You are currently on the <span class="text-weight-regular">Basic plan</span>, you can consider upgrading to the <span class="text-weight-bold text-accent">Inscriptor Premium</span> plan, which gives you a monthly amount of 2250 credits.
          </div>

          <div></div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn icon="las la-user" label="Open Plan Settings" color="accent" @click="layoutStore.showUserDialog(); layoutStore.lowOnCreditsDialog = false"/>
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed} from "vue";
  import {useCurrentUser} from "vuefire";

  const user = useCurrentUser();

  const credits = computed(() => {
    if(layoutStore.userData) {
      return (layoutStore.userData.monthlyRemainingCredits ?? 0) + layoutStore.userData.maxUsage - layoutStore.userData.usage;
    }
    return null;
  })

  const subscriptionLevel = computed(() =>{
    if(layoutStore.userData) {
      return layoutStore.userData.subscriptionLevel;
    }
    return null;
  })

  const layoutStore = useLayoutStore();

</script>

<style scoped>

</style>
