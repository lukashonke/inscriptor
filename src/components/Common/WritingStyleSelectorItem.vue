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
      <div class="text-italic" style="font-size: 0.8rem">{{ writingStyle.usageTips }}</div>
      <div class="q-mt-sm">
        <q-btn
          dense
          flat
          no-caps
          :icon="showExamples ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          :label="showExamples ? 'Hide Examples' : 'Show Examples'"
          @click="showExamples = !showExamples"
          color="primary"
          size="sm"
        />
      </div>
    </q-card-section>
    <q-slide-transition>
      <q-card-section v-if="showExamples" class="q-pt-none">
        <div class="scroll" style="font-size: 0.8rem; max-height: 200px; background-color: rgba(0, 0, 0, 0.02); padding: 12px; border-radius: 4px;" v-html="newLineToBr(writingStyle.value)"></div>
      </q-card-section>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
  import {newLineToBr} from "src/common/utils/textUtils";
  import {ref} from "vue";

  const props = defineProps({
    writingStyle: Object,
  });

  const emit = defineEmits(['writingStyleSet']);
  
  const showExamples = ref(false);

  function onClick() {
    emit('writingStyleSet', props.writingStyle.value);
  }
</script>

<style scoped>
body.body--dark .scroll {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
