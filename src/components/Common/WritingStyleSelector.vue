<template>
  <div class="row">
    <div class="col" v-if="title || subTitle">
      <div class="text-subtitle2 q-mb-md text-primary">
        <div>{{title}}</div>
        <div class="text-caption">{{ subTitle }}</div>
      </div>
    </div>
    <div class="col flex justify-end items-center">
      <!-- Tag Filter Dropdown -->
      <div class="row ">
        <div class="col-auto">
          <q-btn-dropdown
            flat
            no-caps
            :label="filterLabel"
            :icon="selectedFilters.length > 0 ? 'mdi-filter' : 'mdi-filter-variant'"
            :color="selectedFilters.length > 0 ? 'accent' : 'primary'"
            class="q-mr-sm"
          >
            <q-list dense>
              <q-item clickable v-ripple @click="clearAllFilters()" dense>
                <q-item-section>
                  <q-item-label>Clear All Filters</q-item-label>
                </q-item-section>
                <q-item-section side v-if="selectedFilters.length > 0">
                  <q-icon name="mdi-close" size="sm" />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-for="tag in availableTags"
                :key="tag"
                clickable
                v-ripple
                @click="toggleTagFilter(tag)"
              >
                <q-item-section side>
                  <q-checkbox
                    :model-value="selectedFilters.includes(tag)"
                    @click.stop
                    @update:model-value="toggleTagFilter(tag)"
                    color="primary"
                    size="sm"
                    dense
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <q-chip :class="'text-' + getTagColor(tag) + '-1' + ' ' + 'bg-' + getTagColor(tag) + '-7'"
                            size="12px"
                            class="q-px-sm q-py-sm q-mr-xs q-mb-xs">
                      {{ formatTagName(tag, true) }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    color="grey-2"
                    text-color="primary"
                    size="10px"
                    dense
                  >
                    {{ getTagCountForFilter(tag) }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            v-if="selectedFilters.length > 0"
            flat
            round
            size="sm"
            icon="mdi-close"
            color="primary"
            @click="clearAllFilters()"
            class="q-ml-xs"
            title="Clear all filters"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="row q-mb-sm">
    <q-carousel
      v-model="slide"
      class="q-px-none"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="primary"
      arrows
      height="auto"
    >
      <q-carousel-slide
        v-for="(slideStyles, slideIndex) in writingStyleSlides"
        :key="slideIndex"
        :name="slideIndex"
        class="column no-wrap q-px-xl"
      >
        <div class="row q-gutter-md q-pa-md">
          <div
            v-for="writingStyle in slideStyles"
            :key="writingStyle.name"
            class="col"
          >
            <WritingStyleSelectorItem
              @writing-style-set="onWritingStyleSet(writingStyle)"
              :writingStyle="writingStyle"
              :currentValue="writingStyleValue"
              :renderVariant="getStyleRenderVariant(writingStyle)"
            />
          </div>
          <!-- Fill remaining slots if less than 3 styles in slide -->
          <div
            v-for="n in (cols - slideStyles.length)"
            :key="`empty-${n}`"
            class="col"
          ></div>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </div>

  <div class="q-mb-md" v-if="showCustomInput">
    <InputWithChatAi
      v-if="useAiInput"
      v-model="writingStyleValue"
      :prompt="writingStyleRefinePrompt"
      filled type="textarea"
      input-style="height: 300px;"
    />
    <q-input
      dense
      filled
      v-else
      outlined
      type="textarea"
      flat
      input-style="height: 220px;"
      v-model="writingStyleValue"
    />
  </div>
  <div class="row" v-if="showCustomInput">
    <q-btn
      flat
      color="primary"
      class="full-width"
      icon="mdi-close"
      @click="toggleWritingStyleMode"
      no-caps
    />
  </div>
  <template v-else>
    <div class="row justify-center scroll-y q-px-xl q-py-md rounded-borders" style="height: 360px;" v-if="writingStyleValue">
      <div class="col-12 full-width text-caption q-mb-sm text-primary" style="max-width: 1000px;" v-if="writingStyleName">{{  writingStyleName }}:</div>
      <div class="col-12 prompt-results" style="max-width: 1000px;" v-html="markdownToHtml(writingStyleValue)" />
    </div>
    <div class="row q-mt-md justify-center" v-if="writingStyleValue">
      <div class="row justify-center" v-if="disableCustomization">
        <div class="col items-center full-width text-caption text-primary" >
          <q-icon name="mdi-information-outline" class="q-mr-xs" size="xs" />
          You can customize the writing style description later.
        </div>
      </div>
      <q-btn
        v-else
        flat
        color="primary"
        class="full-width"
        :icon="showCustomInput ? 'mdi-chevron-up' : 'mdi-pencil-outline'"
        :label="showCustomInput ? 'Hide Custom Input' : 'Customize'"
        @click="toggleWritingStyleMode"
        no-caps
      />
    </div>
    <div v-if="!writingStyleValue" :style="{ height: (disableCustomization ? '140px' : '250px')}" class="flex justify-center">
      <q-btn
        flat
        v-if="!disableCustomization"
        color="primary"
        class="full-width"
        icon="mdi-pencil-outline"
        label="Create Custom Style"
        @click="toggleWritingStyleMode"
        no-caps
      />
      <div v-else class="q-mt-xl">
        <div class="text-subtitle2 q-mb-md text-primary">
          <div class="text-caption q-gutter-y-xs">
            <div class="flex items-center">
              <q-icon name="mdi-information-outline" class="q-mr-xs" size="xs" />
              You can customize the writing style description later.
            </div>
            <div class="flex items-center justify-center">
              AI can also do it for you.
              <q-icon name="mdi-creation-outline" class="q-ml-xs" size="xs" />
            </div>
          </div>
        </div>

      </div>
    </div>

  </template>
</template>

<script setup>
import {formatTagName, getAvailableTags, getTagColor, getTagCount} from 'src/common/helpers/writingStyleTagsHelper';
import {markdownToHtml} from 'src/common/utils/textUtils';
import WritingStyleSelectorItem from 'components/Common/WritingStyleSelectorItem.vue';
import {computed, ref, watch} from 'vue';
import {writingStyles} from 'assets/writingStyles/writingStyleList';
import InputWithChatAi from 'components/Common/InputWithChatAi.vue';
import {writingStyleRefinePrompt} from 'assets/writingStyles/writingStyleRefinePrompt';

const props = defineProps({
  title: {
    type: String,
    default: 'Choose your Writing Style (optional)'
  },
  subTitle: {
    type: String,
    default: 'Writing style description will be fed into AI prompts to make it generate text that closely follows your style.'
  },
  newProjectType: {
    type: String,
    default: 'blank'
  },
  initialValue: {
    type: String,
    default: ''
  },
  initialName: {
    type: String,
    default: null
  },
  useAiInput: {
    type: Boolean,
    default: false
  },
  disableCustomization: {
    type: Boolean,
    default: false
  },
  cols: {
    type: Number,
    default: 3
  }
});

const emit = defineEmits(['writing-style-changed']);

const slide = ref(0);
const selectedFilters = ref([]);
const showCustomInput = ref(false);
const writingStyleName = ref(props.initialName);
const writingStyleValue = ref(props.initialValue);

const projectTypeMap = {
  'story': 'fiction',
  'nonfiction': 'nonfiction',
  'blank': null // Show all styles without preference
};

// Get all unique tags from writing styles
const availableTags = computed(() => {
  return getAvailableTags(writingStyles);
});

// Computed property for filter label display
const filterLabel = computed(() => {
  if (selectedFilters.value.length === 0) return 'Filter...';
  if (selectedFilters.value.length === 1) return `Filter: ${formatTagName(selectedFilters.value[0], true)}`;
  if (selectedFilters.value.length <= 2) {
    return selectedFilters.value.map(tag => formatTagName(tag, true)).join(', ');
  }
  return `${selectedFilters.value.length} filters applied`;
});

// Computed property to group writing styles into slides of 3
const writingStyleSlides = computed(() => {
  const preferredType = projectTypeMap[props.newProjectType];

  // Start with all styles
  let filteredStyles = [...writingStyles];

  // Apply tag filters if any are selected (OR logic)
  if (selectedFilters.value.length > 0) {
    filteredStyles = filteredStyles.filter(style =>
        style.tags && selectedFilters.value.some(tag =>
          style.tags.includes(tag)
        )
    );
  }

  // Sort styles based on project type preference
  if (preferredType) {
    filteredStyles.sort((a, b) => {
      // Check if styles match the preferred type
      const aMatches = a.types?.includes(preferredType) ? 1 : 0;
      const bMatches = b.types?.includes(preferredType) ? 1 : 0;

      // Sort matching styles first
      if (aMatches !== bMatches) {
        return bMatches - aMatches; // Higher matches first
      }

      // Keep original order for styles with same matching status
      return 0;
    });
  }

  // Group filtered and sorted styles into slides of 3
  const slides = [];
  for (let i = 0; i < filteredStyles.length; i += props.cols) {
    slides.push(filteredStyles.slice(i, i + props.cols));
  }
  return slides;
});

function toggleWritingStyleMode() {
  showCustomInput.value = !showCustomInput.value;

  // Emit current state after mode change
  emitStyleChange();
}

// Watch for changes in custom input
watch(writingStyleValue, () => {
  // Only emit if in custom input mode to avoid double emissions
  if (showCustomInput.value) {
    emitStyleChange();
  }
});

function getStyleRenderVariant(writingStyle) {
  const preferredType = projectTypeMap[props.newProjectType];

  // No preference for blank projects
  if (!preferredType) return null;

  // Check if style matches the project type
  if (writingStyle.types?.includes(preferredType)) {
    return 'recommended';
  }

  return 'not-recommended';
}

// Wrapper function for tag count to provide writingStyles context
function getTagCountForFilter(tag) {
  return getTagCount(tag, writingStyles);
}

// Multiple tag filter management functions
function toggleTagFilter(tag) {
  const index = selectedFilters.value.indexOf(tag);
  if (index > -1) {
    // Tag is selected, remove it
    selectedFilters.value.splice(index, 1);
  } else {
    // Tag is not selected, add it
    selectedFilters.value.push(tag);
  }
}

function clearAllFilters() {
  selectedFilters.value = [];
}

// Generic function to emit style changes with consistent structure
function emitStyleChange() {
  const payload = {
    value: writingStyleValue.value,
    name: writingStyleName.value
  };
  emit('writing-style-changed', payload);
}

// Handle writing style selection from WritingStyleSelectorItem
function onWritingStyleSet(writingStyle) {
  writingStyleValue.value = writingStyle.value;
  writingStyleName.value = writingStyle.name;

  // Emit structured object
  emitStyleChange();
}
</script>

<style scoped>

</style>
