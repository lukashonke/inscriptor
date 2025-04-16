<template>
  <div class="">
    <div class="row full-width q-gutter-x-xs" :class="[hover]" ref="mainFileDivRow">
      <div class="col-auto flex items-center" style="width: 20px">
        <q-btn v-if="file.children && file.children.length > 0" no-caps size="12px" dense flat :icon="expanded ? 'arrow_drop_down' : 'arrow_right'"  @click="expanded = !expanded" padding="1px 1px" />
      </div>
      <div class="col self-center q-ml-xs flex cursor-pointer"  @click="fileStore.selectFile(file)">
        <div class="row full-width">
          <div class="col-auto">
            <FileDetailItem :file="file" />
          </div>
          <div class="col flex justify-end">
            <span class="q-mr-md text-grey-6 text-caption">
          {{ fileStore.getTextWords(file, true, true)}}
        </span>
          </div>
        </div>
      </div>
      <div class="col-3">
        <q-select v-model="fileState" borderless dense :options="promptStore.statuses" option-label="label" option-value="label" clearable options-dense>
          <template v-slot:prepend>
            <q-icon name="mdi-flag-outline" />
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon name="mdi-flag-outline" :color="scope.opt.color ?? 'black'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:after-options>
            <q-separator />
            <div class="flex full-width justify-center">
              <q-btn flat dense icon="mdi-playlist-edit" color="grey-6" no-caps label="Edit..." @click="layoutStore.openConfiguration('statuses')" />
            </div>
          </template>
        </q-select>
      </div>
      <div class="col-3">
        <q-select v-model="fileLabels" borderless dense :options="promptStore.labels" option-label="label" option-value="label" multiple clearable options-dense>
          <template v-slot:prepend>
            <q-icon name="mdi-tag-outline" />
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-badge :color="scope.opt.color ?? 'black'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:after-options>
            <q-separator />
            <div class="flex full-width justify-center">
              <q-btn flat dense icon="mdi-playlist-edit" color="grey-6" no-caps label="Edit..." @click="layoutStore.openConfiguration('labels')" />
            </div>
          </template>
        </q-select>
      </div>
    </div>
    <div class="row full-width">
      <div class="col q-pr-xs q-mb-md q-pl-sm" v-if="viewSummary">
        <InputWithAi v-model="fileSynopsis" borderless :filled="false" :label="file.synopsis ? undefined : ('Enter ' + file.title + ' synopsis...')" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Summarize Page')" :prompt-input="file.content" :class="writeClasses" @update:model-value="() => fileStore.setDirty(file)" :automatic-text-correction="automaticTextCorrection"/>
      </div>
      <div class="col q-mb-md" v-if="viewNote">
        <q-input v-model="fileNote" filled dense rows="5" :label="file.note ? undefined : 'Note'" type="textarea" class="bg-yellow-2" :spellcheck="automaticTextCorrection"  />
      </div>
    </div>

    <div v-if="expanded" class="q-px-sm bg-grey-2" style="margin-right: -8px; margin-left: -8px;" >
      <template v-for="nestedChild in file.children ?? []" :key="nestedChild.id">
        <div :class="level > 0 ? 'left-border' : ''">
          <FileDetailListItem :file="nestedChild" :level="level + 1" :view-summary="viewSummary"/>
        </div>
      </template>
    </div>
  </div>

</template>

<script setup>
import {computed, ref} from "vue";
  import {usePromptStore} from "stores/prompt-store";
import {useFileStore} from "stores/file-store";
import {useElementHover} from "@vueuse/core";
import FileDetailItem from "components/Common/Files/FileDetailItem.vue";
import InputWithAi from "components/Common/InputWithAi.vue";
import {useLayoutStore} from "stores/layout-store";

  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();
  const fileStore = useFileStore();

  const props = defineProps({
    file: {
      type: Object,
      required: false,
    },
    level: {
      type: Number,
      default: 0,
    },
    viewSummary: {
      type: Boolean,
      default: false,
    },
    viewNote: {
      type: Boolean,
      default: false,
    },
    automaticTextCorrection: {
      type: Boolean,
      default: true,
    }
  });

  const expanded = ref(false);
  const mainFileDivRow = ref(null);

  const isHovered = useElementHover(mainFileDivRow);

  const hover = computed(() => isHovered.value ? 'bg-grey-1' : '');
  const offset = computed(() => 'tree-padding-' + props.level);

  const file = ref(props.file);

  const fileState = computed({
    get: () => file.value?.state ?? '',
    set: (value) => {
      if(file.value) {
        file.value.state = value;
        fileStore.setDirty(file.value);
      }
    }
  });

  const fileLabels = computed({
    get: () => file.value?.labels ?? [],
    set: (value) => {
      if(file.value) {
        file.value.labels = value;
        fileStore.setDirty(file.value);
      }
    }
  });

const fileSynopsis = computed({
  get: () => file.value.synopsis,
  set: val => {
    file.value.synopsis = val;
    fileStore.setDirty(file.value);
  }
})

const fileNote = computed({
  get: () => file.value.note,
  set: val => {
    file.value.note = val;
    fileStore.setDirty(file.value);
  }
})

const writeClasses = computed(() => {
  return {
    'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
    'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
    'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
  }
});
</script>

<style scoped>

</style>
