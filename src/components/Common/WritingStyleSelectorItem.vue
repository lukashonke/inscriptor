<template>
  <q-card class="">
    <q-card-section class="row">
      <div class="col row items-center">
        <div class="text-weight-bold" style="font-size: 0.9rem">{{ writingStyle.name }}</div>
      </div>
      <div class="col-auto">
        <q-btn no-caps color="primary" @click="onClick" padding="2px 8px" >
          <q-icon name="mdi-plus" size="16px" class="q-mr-xs" />
          Use
        </q-btn>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="scroll" style="font-size: 0.8rem; height: 200px;" v-html="newLineToBr(writingStyle.value)"></div>

    </q-card-section>
    <q-card-section class="bg-yellow-1">
      <div class="text-weight-medium">Usage tips:</div>
      <div class="text-italic" style="font-size: 0.8rem">{{ writingStyle.usageTips }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup>
  import {newLineToBr} from "src/common/utils/textUtils";

  const props = defineProps({
    writingStyle: Object,
  });

  const emit = defineEmits(['writingStyleSet']);

  function onClick() {
    emit('writingStyleSet', props.writingStyle.value);
  }
</script>

<style scoped>

</style>
