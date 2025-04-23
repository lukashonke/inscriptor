<template>
  <q-dialog v-model="open" position="bottom"  >
    <q-card style="width: 1000px; max-width: 80vw;">
      <q-card-section>
        <div>
          <div class="text-weight-bold">Last prompts:</div>
        </div>
      </q-card-section>
      <q-card-section class="row full-width">

        <div class="col ">
          <q-list dense class="full-width">
            <q-item v-for="(prompt, index) in items" :key="index" dense clickable :class="prompt.error ? 'bg-red-2' : 'bg-yellow-2'" @click="copy(prompt)">
              <q-item-section>
                <span class="text-bold">{{ prompt.model }} <span class="text-grey text-caption">{{ formatTime(prompt) }}</span>
                  <span class="text-grey text-caption">{{formatStats(prompt)}}</span>
                </span>

                <span class="text-negative text-bold" v-if="prompt.error">
                  <q-icon name="mdi-exclamation-thick" />
                  An error occured: ({{ prompt.error }})
                </span>
                <p class="write-serif scroll" v-html="formatPromptInput(prompt)">
                </p>
              </q-item-section>
              <q-tooltip :delay="200">
                Click to copy
              </q-tooltip>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {computed} from "vue";
  import {useLayoutStore} from "stores/layout-store";
  import {usePromptStore} from "stores/prompt-store";
  import {formatDistanceToNow} from "date-fns";

  const layoutStore = useLayoutStore();
  const promptStore = usePromptStore();

  const open = computed({
    get: () => layoutStore.consoleOpen,
    set: (value) => layoutStore.setConsoleOpen(value)
  });

  // return in opposite order
  const items = computed(() => promptStore.lastPrompts.slice().reverse());

  function copy(prompt) {
    navigator.clipboard.writeText(prompt.input);
  }

  function formatTime(prompt) {
    const timeStamp = prompt.timeStamp;

    return formatDistanceToNow(new Date(timeStamp), { addSuffix: true })
  }

  function formatPromptInput(prompt) {
    const isJson = prompt.input && prompt.input.length > 0 && (prompt.input.startsWith('{') && prompt.input.endsWith('}') || prompt.input.startsWith('[') && prompt.input.endsWith(']'));
    if (isJson) {
      return JSON.stringify(JSON.parse(prompt.input), null, 2).replace(/\n/g, '<br>');
    }
    return prompt.input.replace(/\n/g, '<br>');
  }

  function formatStats(prompt) {
    if(prompt.pr?.stats) {
      return ' | Cost: ' + (prompt.pr.stats.inputTokens + prompt.pr.stats.outputTokens) + ' credits';
    }

    return '';
  }
</script>

<style scoped>
  .scroll {
    max-height: 200px;
    font-size: 0.75rem;
    overflow-y: auto;
  }
</style>
