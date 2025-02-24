<template>
  <div class="q-gutter-y-md">
    <div class="">
      <div class="menu-subtitle">Font type</div>
      <div class="">
        <q-btn-toggle
        v-model="fileFontType"
        unelevated no-caps class="bordered" toggle-color="primary" padding="xs md"
        :options="fileFontTypes"
        />
      </div>

    </div>

    <div class="">

      <div class="menu-subtitle">Font size</div>
      <div class="">
        <q-btn-toggle
          v-model="fileSizeType"
          unelevated no-caps class="bordered" toggle-color="primary" padding="xs md"
          :options="fileSizeTypes"
        />
      </div>
    </div>

    <div class="">

      <div class="menu-subtitle">Editor type</div>
      <div class="">
        <q-btn-toggle
          v-model="editorType"
          unelevated no-caps class="bordered" toggle-color="primary" padding="xs md"
          :options="editorTypes"
        />
      </div>

    </div>

    <div class="">

      <div class="menu-subtitle">Window Width</div>
      <div class="">
        <q-btn-toggle
          v-model="windowWidth"
          unelevated no-caps class="bordered" toggle-color="primary" padding="xs md"
          :options="windowWidths"
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
import {computed} from "vue";
import {useFileStore} from "stores/file-store";
import {usePromptStore} from "stores/prompt-store";

const props = defineProps({
  file: {
    type: Object,
    required: false,
  },
});

const layoutStore = useLayoutStore();
const fileStore = useFileStore();
const promptStore = usePromptStore();

const fileFontTypes = [
  {label: 'Serif', value: 'serif'},
  {label: 'Sans-serif', value: 'sans-serif'},
  {label: 'Monospace', value: 'monospace'},
];

const fileSizeTypes = [
  {label: 'Default', value: 'medium'},
  {label: 'Small', value: 'small'},
  {label: 'Large', value: 'large'},
];

const editorTypes = [
  {label: 'Regular', value: 'regular'},
  {label: 'Non indented', value: 'non-indented'},
  {label: 'Condensed', value: 'condensed'},

];

const windowWidths = [
  {label: 'Regular', value: 'regular'},
  {label: 'Expanded', value: 'extended'},
  {label: 'Full Width', value: 'fullwidth'},
];

const fileFontType = computed({
  get: () => fileFontTypes.find(f => f.value === props.file.settings?.fontType)?.value ?? fileFontTypes[0].value,
  set: (value) => fileStore.updateFileSettings(props.file, {fontType: value}),
});

const fileSizeType = computed({
  get: () => fileSizeTypes.find(f => f.value === props.file.settings?.fontSize)?.value ?? fileSizeTypes[0].value,
  set: (value) => fileStore.updateFileSettings(props.file, {fontSize: value}),
});

const editorType = computed({
  get: () => editorTypes.find(f => f.value === props.file.settings?.editorType)?.value ?? editorTypes[0].value,
  set: (value) => fileStore.updateFileSettings(props.file, {editorType: value}),
});

const windowWidth = computed({
  get: () => windowWidths.find(f => f.value === props.file.settings?.windowWidth)?.value ?? windowWidths[0].value,
  set: (value) => fileStore.updateFileSettings(props.file, {windowWidth: value}),
});


</script>

<style scoped>

</style>
