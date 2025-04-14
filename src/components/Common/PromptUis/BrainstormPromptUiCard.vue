<template>
  <transition appear enter-active-class="animated zoomIn" leave-active-class="animated fadeOut">
    <q-card bordered flat class="q-ma-xs hoverable-card no-p-margin idea-card" :class="cardClass">
      <q-card-section class="q-px-md q-py-sm justify-end flex">
        <q-btn icon="mdi-pin-outline" :color="idea.pinned ? 'accent' : 'grey-6'" size="10px" @click="$emit('pin-idea', idea)" flat dense class="hoverable-btn"/>
        <q-btn icon="mdi-thumb-up-outline" :color="idea.liked ? 'accent' : 'grey-6'" size="10px" @click="$emit('like-idea', idea, !idea.liked)" flat dense class="hoverable-btn"/>
        <q-btn icon="mdi-thumb-down-outline" :color="idea.disliked ? 'red' : 'grey-6'" size="10px" @click="$emit('dislike-idea', idea, !idea.disliked)" flat dense class="hoverable-btn"/>
      </q-card-section>

      <q-card-section class="q-px-md q-py-none">
        <div v-html="markdownToHtml(idea.text ?? '')" class="" />
      </q-card-section>

      <q-card-section v-if="idea.description" class="q-px-md q-py-none">
        <div class="q-mt-sm">
          <div class="text-subtitle2 text-grey-7">
            Details:
            <q-btn @click="$emit('clear-description', idea)" icon="mdi-delete-outline" size="10px" color="grey-7" flat dense no-caps class="float-right hoverable-btn"/>
          </div>
          <div v-html="markdownToHtml(idea.description ?? '')" />
          <div v-html="markdownToHtml(idea.descriptionAppend ?? '')" />
        </div>
      </q-card-section>

      <q-card-section v-if="idea.children?.length > 0" class="q-px-md q-py-none" >
        <div class="q-mt-sm">
          <div class="q-mt-sm text-subtitle2 text-grey-7">
            Related ideas:
          </div>
          <div v-for="(subIdea, i) in idea.children" :key="i" class="row">
            <div class="col">
              <div v-html="markdownToHtml(subIdea.text ?? '')" />
            </div>
            <div class="col-auto flex items-center">
              <q-btn @click="$emit('separate-sub-idea', subIdea, idea)" icon="mdi-open-in-new" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn"/>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-px-md q-py-none" v-if="idea.reply?.length > 0" >
        <div class="q-mt-sm">
          <div class="bordered bg-yellow-1 q-pa-sm q-my-sm">
            <div class="text-subtitle2 text-grey-7">
              AI Reply:
              <q-btn @click="$emit('clear-reply', idea)" icon="mdi-delete-outline" size="10px" color="grey-7" flat dense no-caps class="float-right hoverable-btn"/>
            </div>
            <div v-html="markdownToHtml('\'' + (idea.reply ?? '') + '\'')" class="text-italic" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="justify-between q-px-md q-pt-sm q-pb-sm">
        <q-btn @click="$emit('toggle-reply', idea)" icon="las la-reply" label="Reply" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn"/>

        <q-btn-dropdown split @click="$emit('expand-idea', idea)" icon="mdi-creation-outline" label="Expand" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn">
          <q-list>
            <q-item clickable dense v-close-popup @click="$emit('generate-sub-ideas', idea)" :disable="idea.generating">
              <q-item-section side>
                <q-icon name="mdi-creation-outline" />
              </q-item-section>
              <q-item-section>
                Generate related ideas
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn @click="$emit('generate-similar', idea)" icon="mdi-creation-outline" label="Similar ideas" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn"/>
      </q-card-actions>

      <q-card-actions v-if="idea.replyEnabled">
        <div class="row full-width">
          <div class="col flex items-center">
            <q-input v-model="replyMessage" label="Ask about this idea..." dense filled square class="full-width" autofocus @keyup.enter="$emit('reply-to-idea', idea, replyMessage); replyMessage = ''"/>
          </div>
          <div class="col-auto flex items-center q-ml-sm">
            <q-btn @click="$emit('reply-to-idea', idea, replyMessage); replyMessage = ''" icon="mdi-send-outline" size="12px" :loading="idea.generating" color="grey-7" flat dense no-caps/>
          </div>
        </div>
      </q-card-actions>

      <q-inner-loading :showing="idea.generating">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { markdownToHtml } from 'src/common/utils/textUtils';

const props = defineProps({
  idea: {
    type: Object,
    required: true
  }
});

const replyMessage = ref('');

const getVariationClass = computed(() => {
  if (props.idea.liked || props.idea.disliked) return '';

  // Use the generation batch ID to assign a variation
  // This ensures all ideas from the same generation get the same color
  const batchId = props.idea.generationBatchId || 0;
  const variationIndex = batchId % 5; // 5 different variations

  return `variation-${variationIndex}`;
});

const cardClass = computed(() => {
  return {
    'liked-card': props.idea.liked,
    'disliked-card': props.idea.disliked,
    'neutral-card': !props.idea.liked && !props.idea.disliked,
    'card': true,
    'removing-card': props.idea.removing,
    [getVariationClass.value]: !props.idea.liked && !props.idea.disliked
  };
});

defineEmits([
  'pin-idea',
  'like-idea',
  'dislike-idea',
  'clear-description',
  'separate-sub-idea',
  'clear-reply',
  'toggle-reply',
  'expand-idea',
  'generate-sub-ideas',
  'generate-similar',
  'reply-to-idea'
]);
</script>

<style scoped>
.card {
  transition: transform 0.5s ease;
}

.liked-card {
  transform: scale(1.01);
  background: linear-gradient(135deg, #f3f4ff 85%, #d9dcf3 100%);
}

.disliked-card {
  transform: scale(0.95);
  opacity: 0.4;
}

.neutral-card {
  background-color: #f8f8f8;
}

/* Subtle gradient background variations for neutral cards */
.variation-0 {
  background: linear-gradient(135deg, #f8f8f8 80%, #ededf8 100%);
}

.variation-1 {
  background: linear-gradient(135deg, #f8f8f8 80%, #edf6f8 100%);
}

.variation-2 {
  background: linear-gradient(135deg, #f8f8f8 80%, #f3f8ed 100%);
}

.variation-3 {
  background: linear-gradient(135deg, #f8f8f8 80%, #f8f5ed 100%);
}

.variation-4 {
  background: linear-gradient(135deg, #f8f8f8 80%, #f4edf8 100%);
}

.removing-card {
  opacity: 0;
  transform: scale(0.55);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

/* Hide hoverable buttons by default */
.hoverable-btn {
  opacity: 0;
  transition: all 0.3s ease;
}

/* Show hoverable buttons on hover */
.hoverable-card:hover .hoverable-btn {
  opacity: 1;
}
</style>
