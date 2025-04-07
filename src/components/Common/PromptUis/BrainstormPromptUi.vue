<template>
  <q-btn @click="generate(false)" label="Generate" />

  <div class="q-pa-md example-masonry">

    <div class="column example-container">
      <div class="flex-break hidden"></div>
      <div class="flex-break"></div>
      <div class="flex-break"></div>
      <div class="flex-break"></div>

      <div v-for="(idea, i) in ideas" :key="i" class="example-cell" tabindex="0">
        <transition appear enter-active-class="animated bounceInUp slower" leave-active-class="animated fadeOut">
          <q-card bordered flat class="q-ma-xs">
            <q-card-section>
              <div v-html="markdownToHtml(idea.text)" />
            </q-card-section>
            <q-card-section v-if="idea.children">
              <div v-for="(subIdea, i) in idea.children" :key="i">
                <div v-html="markdownToHtml(subIdea.text)" />
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn @click="removeIdea(ideas, idea)" label="Remove"/>
              <q-btn @click="expandIdea(idea)" label="Expand"/>
            </q-card-actions>
          </q-card>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, defineExpose, computed} from 'vue';
import {cloneRequest, executePromptClick2} from 'src/common/helpers/promptHelper';
import {markdownToHtml} from 'src/common/utils/textUtils';

const props = defineProps({
  promptResult: {
    type: Object,
    required: true,
  }
});

const ideas = ref([]);

const request = computed(() => props.promptResult.request);

function processOutput(text, outputCollection) {
  let items = text.split(request.value.prompt.resultsSeparator ?? '<split/>').map(item => ({ text: item })).filter(item => item.text.trim() !== '');

  items = items.map(item => {
    return item;
  });

  outputCollection.splice(0, outputCollection.length);

  for (const item of items) {
    if (!outputCollection.some(existing => existing.text === item.text)) {
      outputCollection.push(item);
    }
  }

  return outputCollection;
}

async function onShow(payload) {
  await generate();
}

function prepareRequest(request) {
  request.silent = true;
  request.forceBypassMoreParameters = true;
  request.previewOnly = false;
  request.clear = false;
  request.executeCustomPromptUi = true;
}

async function generate(replace = true) {
  const newRequest = cloneRequest(request.value);

  prepareRequest(newRequest);

  const onOutput = (fullText, newText, isFinished, isError) => {
    processOutput(fullText, ideas.value);
  };

  newRequest.onOutput = onOutput;

  await executePromptClick2(newRequest);
}

function removeIdea(collection, idea) {
  const index = collection.findIndex(i => i === idea);
  if (index !== -1) {
    collection.splice(index, 1);
  }
}

async function expandIdea(idea) {
  const newRequest = cloneRequest(request.value);

  prepareRequest(newRequest);

  idea.children = [];

  const onOutput = (fullText, newText, isFinished, isError) => {
    processOutput(fullText, idea.children);
  };

  newRequest.onOutput = onOutput;

  await executePromptClick2(newRequest);
}

defineExpose({
  onShow
});
</script>

<style lang="sass">
.example-masonry
  .flex-break
    flex: 1 0 100% !important
    width: 0 !important

  $x: 4

  @for $i from 1 through ($x - 1)
    .example-container > div:nth-child(#{$x}n + #{$i})
      order: #{$i}

  .example-container > div:nth-child(#{$x}n)
    order: #{$x}

  .example-container
    height: 700px

    .example-cell
      width: 25%
      padding: 1px

      > div
        padding: 4px 8px
        box-shadow: inset 0 0 0 2px #9e9e9e
</style>
