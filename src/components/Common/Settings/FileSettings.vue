<template>
  <div class="q-gutter-y-md">
    <div class="">
      <div class="menu-subtitle">Font type</div>
      <div class="">
        <q-btn-toggle
        v-model="fileFontType"
        unelevated no-caps class="bordered" toggle-color="primary" padding="xs md"
        :options="fileFontTypes"
        >
          <template v-slot:serif>
            <span class="font-serif">
              Serif
            </span>
          </template>

          <template v-slot:sans-serif>
            <span class="font-sans-serif">Sans-serif</span>
          </template>

          <template v-slot:monospace>
            <span class="font-monospace">Monospace</span>
          </template>
        </q-btn-toggle>
      </div>

    </div>

    <div class="">

      <div class="menu-subtitle">Font size</div>
      <div class="">
        <q-btn-toggle
          v-model="fileSizeType"
          unelevated no-caps class="bordered" toggle-color="primary" padding="xs md"
          :options="fileSizeTypes"
        >
          <template v-slot:small>
            <span class="size-small">Small</span>
          </template>

          <template v-slot:medium>
            <span class="size-medium">Default</span>
          </template>

          <template v-slot:large>
            <span class="size-large">Large</span>
          </template>
        </q-btn-toggle>
      </div>
    </div>

    <div class="">

      <div class="menu-subtitle">Editor type</div>
      <div class="">
        <q-btn-toggle
          v-model="editorType"
          unelevated no-caps class="bordered" toggle-color="primary" padding="xs sm" dense
          :options="editorTypes"
        />
      </div>

    </div>

    <div class="">

      <div class="menu-subtitle">Window Width</div>
      <div class="">
        <q-btn-toggle
          v-model="windowWidth"
          unelevated no-caps class="bordered" toggle-color="primary" padding="xs sm" dense
          :options="windowWidths"
        />
      </div>

    </div>

    <div class="q-mt-lg" v-if="!hideChildrenSettings">
      <div class="row">
        <span class="menu-subtitle q-mr-sm col">1st level child icon</span>
        <IconPicker v-model="childLevel1Icon" color="black" default-icon="mdi-file-outline" size="xs" class="col"/>
      </div>
      <div class="row">
        <span class="menu-subtitle q-mr-sm col">2nd level child icon</span>
        <IconPicker v-model="childLevel2Icon" color="black" default-icon="mdi-file-outline" size="xs" class="col"/>
      </div>
      <div class="row">
        <span class="menu-subtitle q-mr-sm col">3rd level child icon</span>
        <IconPicker v-model="childLevel3Icon" color="black" default-icon="mdi-file-outline" size="xs" class="col "/>
      </div>
    </div>
  </div>
</template>

<script setup>
import {useLayoutStore} from "stores/layout-store";
import {computed} from "vue";
import {useFileStore} from "stores/file-store";
import {usePromptStore} from "stores/prompt-store";
import IconPicker from 'components/Common/IconPicker.vue';

const props = defineProps({
  file: {
    type: Object,
    required: false,
  },
  hideChildrenSettings: {
    type: Boolean,
    default: false,
  }
});

const layoutStore = useLayoutStore();
const fileStore = useFileStore();
const promptStore = usePromptStore();

const fileFontTypes = [
  {value: 'serif', class: '', slot: 'serif'},
  {value: 'sans-serif', slot: 'sans-serif'},
  {value: 'monospace', slot: 'monospace'},
];

const fileSizeTypes = [
  {value: 'medium', slot: 'medium'},
  {value: 'small', slot: 'small'},
  {value: 'large', slot: 'large'},
];

const editorTypes = [
  {label: 'Default', value: 'regular', icon: 'density_large'},
  {label: 'Non-indented', value: 'non-indented', icon: 'density_medium'},
  {label: 'Condensed', value: 'condensed', icon: 'density_small'},
];

const windowWidths = [
  {label: 'Default', value: 'regular', icon: 'width_normal'},
  {label: 'Expanded', value: 'extended', icon: 'width_wide'},
  {label: 'Full Width', value: 'fullwidth', icon: 'width_full'},
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

const childLevel1Icon = computed({
  get: () => props.file.settings?.childLevel1Icon,
  set: (value) => fileStore.updateFileSettings(props.file, {childLevel1Icon: value}),
});

const childLevel2Icon = computed({
  get: () => props.file.settings?.childLevel2Icon,
  set: (value) => fileStore.updateFileSettings(props.file, {childLevel2Icon: value}),
});

const childLevel3Icon = computed({
  get: () => props.file.settings?.childLevel3Icon,
  set: (value) => fileStore.updateFileSettings(props.file, {childLevel3Icon: value}),
});

</script>

<style scoped>
.font-serif {
  font-family: "Baskervville-Regular", "Georgia", "Garamond", "Times New Roman", Times, serif;
}

.font-sans-serif {
  font-family: Roboto, "-apple-system", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: normal;
}

.font-monospace {
  font-family: 'JetBrainsMono', monospace;
}

.size-small {
  font-size: 0.9em;
}

.size-medium {
  font-size: 1em;
}

.size-large {
  font-size: 1.2em;
}
</style>
