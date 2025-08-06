<template>
  <q-card class="" bordered flat>
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
        <div class="scroll writing-style-md" style="font-size: 0.8rem; max-height: 300px; background-color: rgba(0, 0, 0, 0.06); padding: 12px; border-radius: 4px;" v-html="markdownToHtml(writingStyle.value)"></div>
      </q-card-section>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
import {markdownToHtml, newLineToBr} from "src/common/utils/textUtils";
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

.writing-style-md {
  h1 {
    font-size: 1em !important;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: 0px;
    margin-top: 0px;
  }

  hr {
    display: block;
    height: 1px;
    border: 0;
    border-top: 1px solid #ccc;
  }

  h2 {
    font-size: 1em;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: 0px;
    margin-top: 0px;
  }

  h3 {
    font-size: 1.0em;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: 0px;
    margin-top: 0px;
  }

  h4 {
    font-size: 1.0em;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: 0px;
    margin-top: 0px;
  }

  h5 {
    font-size: 1.0em;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: 0px;
    margin-top: 0px;
  }

  h6 {
    font-size: 1.0em;
    font-weight: bold;
    line-height: 1.1;
    margin-bottom: 0px;
    margin-top: 0px;
  }

  ul,
  ol {
    margin-top: 0px;
    padding: 0 1.5rem;

    p {
      margin: 0 0 0 0;
    }
  }

  pre {
    background: #ddd;
    color: #353535;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }
}
</style>
