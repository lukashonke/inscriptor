<template>
  <div v-if="file" class="full-height">
    <div class="q-mx-md q-mb-xs q-mt-sm row" id="fileHeader">
      <div class="col-auto flex items-center q-mr-sm">
        <IconPicker v-model="file.icon" size="xs"/>
      </div>
      <div class="col flex items-center">
        <q-input ref="titleRef" :shadow-text="file.title.length > 0 ? '' : ''" class="q-ml-sm full-width" dense autofocus square borderless :input-class="writeClasses" v-model="fileTitle" @keydown="onKeydown" ></q-input>
      </div>
      <div class="col-auto flex items-center q-mr-sm" v-if="file.children && file.children.length > 0">
        <q-btn-toggle :options="views" v-model="file.view" unelevated no-caps class="bordered" toggle-color="primary" padding="xs md" size="11px" />

      </div>
      <div class="col-auto flex items-center ">
        <q-btn flat icon="las la-ellipsis-h" >
          <q-popup-proxy >

            <q-card>
              <q-card-section>
                <span class="text-subtitle2">{{file.title}} file settings</span>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <FileSettings :file="file" />
              </q-card-section>
              <q-separator />
              <q-card-section>
                <q-btn icon="las la-external-link-alt" @click="makeTemplate" label="Create template from this file" color="secondary" />
              </q-card-section>
            </q-card>

          </q-popup-proxy>
        </q-btn>
      </div>
    </div>
    <template v-if="file.view === 'list'" >
      <div class="q-mt-sm q-mx-md">
        <div class="q-mb-md">
          <q-card class="row justify-center q-gutter-x-xs" bordered flat>
            <div class="col-auto">
              <q-btn size="11px" no-caps dense flat square label="Synopsis" :class="{ 'text-light': !viewSummary, 'text-primary': viewSummary }" @click="viewSummary = !viewSummary" />
            </div>
            <div class="col-auto">
              <q-btn size="11px" no-caps dense flat square label="Note" :class="{ 'text-light': !viewNote, 'text-primary': viewNote }" @click="viewNote = !viewNote" />
            </div>
            <div class="col" />
            <div class="col-auto">
              <q-btn size="11px" dense flat square icon="las la-font" @click="automaticTextCorrection = !automaticTextCorrection" class="text-light" :class="{ 'text-primary': automaticTextCorrection }">
                <q-tooltip>
                  Toggle Automatic Text Corrections
                </q-tooltip>
              </q-btn>
            </div>
          </q-card>
        </div>
        <FileDetailList :file="file" :view-summary="viewSummary" :view-note="viewNote" :automatic-text-correction="automaticTextCorrection" />
      </div>
    </template>
    <template v-else-if="file.view === 'board'" >
      <div class="q-mt-sm q-mx-md">
        <div class="q-mb-md">
          <q-card class="row justify-center q-gutter-x-xs" bordered flat>
            <div class="col-auto">
              <q-btn size="11px" no-caps dense flat square label="1 Column" :class="{ 'text-light': gridLayout !== 'col-12', 'text-primary': gridLayout === 'col-12' }" @click="gridLayout = 'col-12'" />
            </div>
            <div class="col-auto">
              <q-btn size="11px" no-caps dense flat square label="2 Columns" :class="{ 'text-light': gridLayout !== 'col-6 q-px-xs q-pb-md', 'text-primary': gridLayout === 'col-6 q-px-xs q-pb-md' }" @click="gridLayout = 'col-6 q-px-xs q-pb-md'" />
            </div>
            <div class="col-auto">
              <q-btn size="11px" no-caps dense flat square label="3 Columns" :class="{ 'text-light': gridLayout !== 'col-4 q-px-xs q-pb-md', 'text-primary': gridLayout === 'col-4 q-px-xs q-pb-md' }" @click="gridLayout = 'col-4 q-px-xs q-pb-md'" />
            </div>
            <div class="col-auto q-ml-lg">
              <q-btn size="11px" no-caps dense flat square label="Expand I" :class="{ 'text-light': !view2ndLevel, 'text-primary': view2ndLevel }" @click="view2ndLevel = !view2ndLevel" />
            </div>
            <div class="col-auto">
              <q-btn size="11px" no-caps dense flat square label="Expand II" :class="{ 'text-light': !view3rdLevel, 'text-primary': view3rdLevel }" @click="view3rdLevel = !view3rdLevel" />
            </div>
            <div class="col" />
            <div class="col-auto">
              <q-btn size="11px" dense flat square icon="las la-font" @click="automaticTextCorrection = !automaticTextCorrection" class="text-light" :class="{ 'text-primary': automaticTextCorrection }">
                <q-tooltip>
                  Toggle Automatic Text Corrections
                </q-tooltip>
              </q-btn>
            </div>
          </q-card>
        </div>
        <FileGrid :file="file" :view-third-level="view3rdLevel" :viw-second-level="view2ndLevel" :main-cols="gridLayout" :automatic-text-correction="automaticTextCorrection" />
      </div>
    </template>
    <template v-else>
      <div class="q-mt-sm q-mx-md">
        <!--<q-scroll-area style="height: 85vh;">-->
        <TextEditor v-model="fileContent" />
      </div>
    </template>
  </div>
</template>

<script setup>
  import {useFileStore} from "stores/file-store";
  import {computed, onMounted, onUnmounted, ref} from "vue";
  import TextEditor from "components/Common/Editors/TextEditor.vue";
  import {useLayoutStore} from "stores/layout-store";
  import {useEditorStore} from "stores/editor-store";
  import FileSettings from "components/Common/Settings/FileSettings.vue";
  import FileDetailList from "components/Common/Files/FileDetailList.vue";
  import FileGrid from "components/Common/Files/FileGrid.vue";
  import IconPicker from "components/Common/IconPicker.vue";
  import {usePromptStore} from "stores/prompt-store";
  import {useQuasar} from "quasar";
  import {getEditor} from "src/common/utils/editorUtils";

  const layoutStore = useLayoutStore();
  const editorStore = useEditorStore();
  const fileStore = useFileStore();
  const promptStore = usePromptStore();
  const $q = useQuasar();

  const viewSummary = ref(false);
  const viewNote = ref(false);
  const view2ndLevel = ref(true);
  const view3rdLevel = ref(true);
  const gridLayout = ref('col-12');
  const file = computed(() => fileStore.selectedFile);
  const titleRef = ref();
  const automaticTextCorrection = ref(true);

  const writeClasses = computed(() => {
    return {
      'write-title-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
      'write-title-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
      'write-title-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    }
  });

  const fileContent = computed({
    get: () => file.value.content,
    set: val => {
      file.value.content = val;
      fileStore.setDirty(file.value);
    }
  })

  const fileTitle = computed({
    get: () => file.value.title,
    set: val => {
      file.value.title = val;
      fileStore.setDirty(file.value);
    }
  })

  const fileIcon = computed({
    get: () => file.value.icon,
    set: val => {
      file.value.icon = val;
      fileStore.setDirty(file.value);
    }
  })

  //TODO OTHER TYPES TOO

  onMounted(() =>{
    editorStore.titleRef = titleRef;
  });

  onUnmounted(() =>{
    editorStore.titleRef = null;
  });

  function onKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      getEditor()?.view.dom.focus();
    }
  }

  const views = [
    {value: 'text', icon: 'las la-file-alt'},
    {value: 'list', icon: 'las la-th-list'},
    {value: 'board', icon: 'las la-th-large'},
  ];

  function makeTemplate() {
    $q.dialog({
      title: 'Create Template',
      message: 'Enter name of the template:',
      prompt: {
        model: '',
        isValid: val => val.length > 3, // << here is the magic
        type: 'text' // optional
      },
      cancel: true,
      persistent: true
    }).onOk(data => {
      promptStore.setFileTemplate(file.value, data);
    })
  }

</script>

<style scoped>

</style>
