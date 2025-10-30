<template>
  <q-card class="column" ref="cardRef">

    <q-img :src="item.img ? (getAssetUrl(item.img) + '?width=360&height=180&fit=cover') : item.image" height="180px" class="marketplace-card" :class="hoveredClass">
      <div class="absolute-top flex items-center bg-transparent">
        <template v-if="item.featured">
          <q-badge color="amber-8"  >
            <q-icon name="mdi-star-four-points" />&nbsp;Featured
          </q-badge>&nbsp;
        </template>
        <template v-for="(tag, index) in item.tags" :key="index">
          <q-badge :label="tag" />&nbsp;
        </template>
      </div>

      <div class="absolute-bottom flex items-center">
        <div class="">
            <span class="text-h6 q-mr-sm text-aleo">{{ item.name }}</span>
        </div>
        <div>
        </div>
      </div>
    </q-img>

    <q-card-section :style="{height: item.prompts && item.prompts.length > 0 ? '220px' : '100px'}" class="scroll">
      <div class="text-subtitle2">{{item.description }} </div>

      <div v-if="item.prompts && item.prompts.length > 0" class="q-mt-md">
        <q-chip v-for="(line, index) in parse(item.prompts)" :key="index" class="text-caption">
          {{ line }}
        </q-chip>
      </div>
      <!--<q-tooltip>
        <template v-if="item.descriptionLines && item.descriptionLines.length > 0">
          <div v-for="(line, index) in parse(item.descriptionLines)" :key="index" class="">
            {{ line }}
          </div>
        </template>
      </q-tooltip>-->
    </q-card-section>

    <q-card-section v-if="hasPrice">
      <div class="row bordered q-pa-sm bg-blue-grey-1" >
        <div class="col">
          <div class="row text-subtitle2 q-mb-md" >
            Cost:
          </div>

          <div class="row" v-if="inputPrice > 0">
            <div class="col-6">
              <span>{{ costDescriptionItemInput }}</span>
            </div>
            <div class="col">
              <span>{{ pricePrefix }}{{ inputPrice }} credits</span> <HelpIcon tooltip="How many credits does it cost to send 1 million tokens to the AI model."></HelpIcon>
            </div>
          </div>

          <div class="row" v-if="inputPrice > 0 && costDescriptionItemOutput">
            <div class="col-6">
              <span>{{ costDescriptionItemOutput }}</span>
            </div>
            <div class="col">
              <span>{{ pricePrefix }}{{ outputPrice }} credits</span> <HelpIcon tooltip="How many credits does it cost to receive 1 million tokens from the AI model."></HelpIcon>
            </div>
          </div>

          <div class="row text-caption q-mt-md" v-if="item.data.meta.modelType !== 'image'">
            <q-badge color="grey">
              1000 credits will get ~{{ outputTokensPerCredits }}k tokens from the model
            </q-badge>
          </div>

        </div>
      </div>
    </q-card-section>

    <q-card-section v-if="item.recommended_models?.length > 0" class="">
      <q-expansion-item
        :label="`Recommended AI models`"
        :expand-separator="true"
        v-model="recommendedModelsExpanded"
        dense>

      <div class="">{{ item.recommended_models }}</div>

      <div v-if="item.recommended_models_tags">
        <div class="q-gutter-x-xs">
          <template v-for="(tag, index) in item.recommended_models_tags" :key="index">
            <q-badge color="secondary" :label="tag" />
          </template>
        </div>
      </div>
      </q-expansion-item>
    </q-card-section>

    <q-card-section v-if="item.tips" class="">
      <q-expansion-item
        :label="`Tips / Usage:`"
        :expand-separator="true"
        v-model="tipsExpanded"
        dense>

        <div class="">{{ item.tips }}</div>
      </q-expansion-item>
    </q-card-section>

    <q-card-actions class="flex items-center">
      <q-space />
      <q-btn color="accent" v-if="isImporting" no-caps>
        <q-spinner /> &nbsp;Importing...
      </q-btn>
      <q-btn v-else-if="isAlreadyImported" unelevated label="Imported" icon="mdi-check">
      </q-btn>
      <q-btn v-else-if="!canImportItem" unelevated label="No models available. Import model first" color="negative"/>
      <q-btn v-else-if="imported.includes(item.id)" unelevated label="Imported" icon="mdi-check"/>
      <q-btn v-else color="accent" text-color="white" label="Import" icon="mdi-plus" @click="importItem()" clickable :disable="!canImportModel"/>
    </q-card-actions>
  </q-card>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {computed, ref} from "vue";
  import {useLayoutStore} from "stores/layout-store";
  import HelpIcon from "components/Common/HelpIcon.vue";
  import {formatNumber} from "src/common/utils/textUtils";
  import {getAssetUrl} from "src/common/utils/cmsUtils";
  import {useElementHover} from "@vueuse/core";
  import {useMarketplace} from "src/composables/useMarketplace";

  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();

  const imported = ref([]);

  const cardRef = ref(null);
  const isHovered = useElementHover(cardRef);

  const hoveredClass = computed(() => {
    if(isHovered.value) {
      return ['marketplace-card-hover'];
    }
    return [];
  });

  const props = defineProps({
    item: {
      type: Object,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    modelCategory: {
      type: String,
      required: false
    }
  });

  const recommendedModelsExpanded = ref(false);
  const tipsExpanded = ref(false);

  const isModel = computed(() => {
    return props.category === 'Models';
  });

  const isCloudModel = computed(() => {
    return props.modelCategory === 'Cloud';
  });

  const isAlreadyImported = computed(() => {
    if(isModel.value) {
      return promptStore.models.find(m => m.id === props.item.itemId);
    }

    return false;
  });

  const canImportItem = computed(() => {
    if(props.category === 'Prompt_Packages') {
      if(promptStore.models.length === 0) {
        return false;
      }
    }

    return true;
  })

  function parse(textWithLines) {
    if(!textWithLines) {
      return [];
    }
    return textWithLines.split('\n');
  }

  const canImportModel = computed(() => {
    if(isModel.value && props.modelCategory.value === 'Ollama' && ollamaInstalled.value !== true) {
      return false;
    }

    return true;
  })

  const isImporting = ref(false);

  async function importItem() {
    isImporting.value = true;
    setTimeout(() => {
      isImporting.value = false;
    }, 5000);

    const { importFromMarketplace } = useMarketplace();
    await importFromMarketplace(props.item.id, props.category, {
      importedTracker: imported
    });
  }

  const hasPrice = computed(() => {
    if(!isModel.value || !isCloudModel.value) return false;

    return true;
  });

  const pricePrefix = computed(() => {
    if(props.item.data.meta.inferenceEngine === "openRouter") {
      return "about ";
    }

    return "";
  });

  const costDescriptionItemInput = computed(() => {

    if(props.item.data.meta.modelType === "image") {
      return "generate image";
    }

    return "send 1M tokens";
  });

  const costDescriptionItemOutput = computed(() => {
    if(props.item.data.meta.modelType === "image") {
      return null;
    }

    return "receive 1M tokens";
  });

  const inputPrice = computed(() => {
    if(!isModel.value || !isCloudModel.value) return null;

    const modelData = layoutStore.getModelData(props.item.modelId);
    if(!modelData || modelData.inputPrice < 0) {
      return "N/A";
    }

    return formatNumber(modelData.inputPrice, 0);
  });

  const outputPrice = computed(() => {
    if(!isModel.value || !isCloudModel.value) return null;

    const modelData = layoutStore.getModelData(props.item.modelId);
    if(!modelData || modelData.outputPrice < 0) {
      return "N/A";
    }

    return formatNumber(modelData.outputPrice, 0);
  });

  const outputTokensPerCredits = computed(() => {
    const price = outputPrice.value;

    if(price === "N/A") return null;

    return formatNumber(1000 / price * 1000, 0);
  });
</script>



<style scoped>
  .marketplace-card {
    transition: all 0.3s linear;

  }

  .marketplace-card-hover {
    transform: scale(1.05);
  }
</style>
