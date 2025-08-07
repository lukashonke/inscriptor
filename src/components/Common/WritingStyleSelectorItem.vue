<template>
  <q-card class="inscriptor-shadow-1">
    <q-card-section class="row">
      <div class="col row items-center" style="height: 40px">
        <div class="" :class="{'text-italic': renderVariant === 'not-recommended', 'text-weight-bold': renderVariant === 'recommended', '': !renderVariant}" style="font-size: 0.9rem">{{ writingStyle.name }}</div>
      </div>
      <div class="col-auto q-ml-xs flex items-center">
        <q-btn no-caps :color="isCurrentStyle ? 'accent' : 'primary'" :class="{'bg-accent text-white': isCurrentStyle}" @click="onClick" padding="2px 8px" style="height: 30px; width: 70px;">
          <q-icon :name="buttonIcon" size="16px" :class="buttonText ? 'q-pr-sm' : ''" />
          {{ buttonText }}
        </q-btn>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="text-italic scroll-y" style="font-size: 0.8rem; height: 60px;">{{ writingStyle.usageTips }}</div>
      <div class="q-mt-md">
        <q-btn
          dense
          flat
          no-caps
          :icon="showExamples ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          :label="showExamples ? 'Hide' : 'Expand'"
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
  import {ref, computed} from "vue";

  const props = defineProps({
    writingStyle: Object,
    currentValue: String,
    renderVariant: {
      type: String,
      default: null,
      validator: (value) => [null, 'recommended', 'not-recommended'].includes(value)
    }
  });

  const emit = defineEmits(['writingStyleSet']);

  const showExamples = ref(false);

  // Computed properties for dynamic button appearance
  const isCurrentStyle = computed(() => {
    return props.writingStyle.value === props.currentValue;
  });

  const buttonText = computed(() => {
    return isCurrentStyle.value ? '' : 'Use';
  });

  const buttonIcon = computed(() => {
    return isCurrentStyle.value ? 'mdi-check' : 'mdi-plus';
  });

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
