<template>
  <q-dialog v-model="layoutStore.addPromptDialogOpened">
    <q-card style="width: 1000px; max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">Create New Prompt
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-y-sm q-pa-none">

        <q-stepper
          v-model="step"
          flat
          ref="stepper"
          active-color="accent"
          done-color="primary"
          active-icon="mdi-circle-medium"
          animated
        >
          <q-step
            :name="1"
            title="Name"
            icon="create_new_folder"
            :done="step > 1"
          >
            <div class="row">
              <div class="col">
                <q-input outlined filled autofocus label="Prompt Name" v-model="promptName" :rules="[val => !!val || 'Prompt name is required']" />
              </div>
            </div>

          </q-step>

          <q-step
            :name="2"
            title="Instructions"
            icon="mdi-creation"
            :done="step > 2"
          >
            <div class="column">
              <div class="row q-mb-lg">
                <div class="col flex items-center">
                  <q-icon name="las la-microchip" class="q-mr-xs"/>
                  Default AI model:

                  <q-select v-if="changingModel" dense filled :options="models" emit-value v-model="promptModel" option-value="id" option-label="name" options-dense class="q-ml-xs" />
                  <template v-if="!changingModel">
                    <span class="q-ml-xs text-subtitle2 text-accent">{{model?.name}}</span>
                    <q-btn color="primary" dense label="Change" size="10px" class="q-ml-sm" no-caps @click="changingModel = true"/>
                  </template>
                </div>
              </div>

              <div class="row">
                <div class="col">
                  <CodeEditor v-model="systemPrompt" :parameters="[]" label="System Prompt" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.systemPrompt')"></HelpIcon>
                </div>
              </div>

              <div class="row full-width q-mt-sm">
                <div class="col-auto q-mr-lg">
                  <q-btn @click.prevent.stop icon="mdi-creation-outline" flat outline dense color="primary" size="11px" :loading="prompting" class="" label="Refine system prompt" no-caps>
                    <q-menu v-model="visible">
                      <q-list dense>
                        <q-item dense v-for="prompt in promptSelection" :key="prompt.id" clickable @click="runPrompt(prompt); visible = false;">
                          <q-item-section>
                            <q-item-label>{{ prompt.title }} ({{ getModelById(prompt.modelId)?.name }})</q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-separator v-if="promptSelection && promptSelection.length > 0"/>
                        <q-item clickable v-close-popup @click="layoutStore.openConfiguration('predefinedPrompts')">
                          <q-item-section side>
                            <q-icon name="mdi-playlist-edit" color="primary"/>
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>Edit...</q-item-label>
                          </q-item-section>
                        </q-item>

                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
                <div class="col-auto q-mr-lg">
                  <q-btn dense flat color="primary"  no-caps size="11px" label="Show examples" @click="promptExamplesVisible = !promptExamplesVisible" icon="mdi-lightbulb-outline" />
                </div>
                <div class="col" />
                <div class="col-auto">
                  <q-btn dense flat color="primary"  no-caps size="11px" label="Set User Prompt (advanced)" @click="changeUserPrompt = !changeUserPrompt" icon="mdi-account-outline" />
                </div>
              </div>


              <div v-if="refinePromptResult">
                  <q-spinner v-if="prompting" />
                  <PromptResult :promptResult="refinePromptResult" :insert-target="(text) => systemPrompt = (trimInputWithAi(convertHtmlToText(text, true)))" type="inline" :has-close="true" @close="refinePromptResult = null" @replace-self="replacePromptResult"/>
              </div>

              <q-slide-transition>

                <div  v-if="promptExamplesVisible">
                  <div class="row q-px-sm q-py-sm">
                    <div class="col">

                      <div class="row">
                        <div class="col-auto">
                          <q-chip class="text-caption" clickable @click="prefillNewPromptParameters('default-inline')" color="green-7" text-color="white" label="Empty Prompt" >
                            <q-tooltip>
                              This prompt receives the selected text and executes instructions on it.
                            </q-tooltip>
                          </q-chip>
                        </div>

                        <div class="col-auto">
                          <q-chip class="text-caption" clickable @click="prefillNewPromptParameters('default-inline-context')" color="green-7" text-color="white" label="Empty Prompt with Context" >
                            <q-tooltip>
                              This prompt receives the selected text and executes instructions on it. It allows for providing optional context.
                            </q-tooltip>
                          </q-chip>
                        </div>

                        <div class="col-auto">
                          <q-chip class="text-caption" clickable @click="prefillNewPromptParameters('example-summary')" color="grey-7" text-color="white" label="Simple Example: Summarize" >
                            <q-tooltip>
                              This prompt reads the selected text and summarizes it.
                            </q-tooltip>
                          </q-chip>
                        </div>

                        <div class="col-auto">
                          <q-chip class="text-caption" clickable @click="prefillNewPromptParameters('example-summary-advanced')" color="grey-7" text-color="white" label="Advanced Example: Role Grammar Corrector" >
                            <q-tooltip>
                              This prompt reads the selected text and summarizes it.
                            </q-tooltip>
                          </q-chip>
                        </div>


                      </div>


                    </div>
                  </div>
                </div>

              </q-slide-transition>

              <div class="row q-mt-lg" v-if="changeUserPrompt">
                <div class="col">
                  <CodeEditor v-model="userPrompt" :parameters="[]" label="User Prompt" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.userPrompt')"></HelpIcon>
                </div>
              </div>
            </div>

          </q-step>

          <q-step
            :name="3"
            title="Metadata"
            icon="create_new_folder"
            :done="step > 2"
          >

            <div class="text-subtitle2 q-mb-md text-primary">
              Almost finished!
            </div>

            <div class="q-mb-lg">
              <div class="row q-mb-sm">
                <div class="col">
                  <InputWithAi v-model="promptDescription" type="textarea" label="Description (optional)" :prompt-ids="promptStore.getPredefinedPromptId('Prompt Description Generator')" :prompt-input="systemPrompt" />
                </div>
              </div>
              <div class="row">
                <div class="col-auto">
                  <ColorPicker v-model="promptColor"></ColorPicker>
                </div>
                <div class="col-aut bordered q-mr-sm q-ml-sm" style="height: 40px; padding-top: 3px;">
                  <IconPicker v-model="promptIcon" :color="promptColor" />
                </div>
                <div class="col">
                  <q-select outlined filled dense label="Category (optional)" v-model="promptCategory" :options="promptStore.promptCategories" option-label="label" option-value="label" emit-value use-input clearable hide-dropdown-icon @new-value="(val, done) => promptStore.addListItem(promptStore.promptCategories, val, 'white', done)" options-dense >
                    <template v-slot:prepend>
                      <q-icon name="las la-table" />
                    </template>
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <q-tooltip>
                      Category represents tab where the prompt is located.
                    </q-tooltip>
                  </q-select>
                </div>
                <div class="col q-ml-sm">
                  <q-select outlined filled dense label="Folder (optional)" v-model="promptFolder" :options="promptStore.promptFolders" option-label="label" option-value="label" emit-value use-input clearable hide-dropdown-icon @new-value="(val, done) => promptStore.addListItem(promptStore.promptFolders, val, 'white', done)" options-dense >
                    <template v-slot:prepend>
                      <q-icon name="las la-folder" />
                    </template>
                    <template v-slot:option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                          <q-icon :name="scope.opt.icon ?? 'las la-folder'" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ scope.opt.label }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <q-tooltip>
                      Folder can group similar prompts in one tab.
                    </q-tooltip>
                  </q-select>
                </div>
              </div>
            </div>
          </q-step>

          <template v-slot:navigation>
            <q-stepper-navigation>
              <q-btn @click="step === 3 ? confirmPrompt() : $refs.stepper.next()" :color="step === 3 ? 'accent' : 'primary'" :label="step === 3 ? 'Create Prompt' : 'Continue'" :disable="step === 3 ? (!canAddPrompt()) : nextDisabled()" />
              <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Back" class="q-ml-sm" />
            </q-stepper-navigation>
          </template>
        </q-stepper>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed, ref, watch} from "vue";
  import {useCurrentUser} from "vuefire";
  import HelpIcon from "components/Common/HelpIcon.vue";
  import ColorPicker from "components/Common/ColorPicker.vue";
  import IconPicker from "components/Common/IconPicker.vue";
  import CodeEditor from "components/Common/Editors/CodeEditor.vue";
  import {usePromptStore} from "stores/prompt-store";
  import InputWithAi from "components/Common/InputWithAi.vue";
  import {convertHtmlToText, trimInputWithAi} from "src/common/utils/textUtils";
  import PromptResult from "components/RightMenu/PromptResult.vue";
  import {executePromptClick} from "src/common/helpers/promptHelper";

  const user = useCurrentUser();

  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();

  const step = computed({
    get: () => layoutStore.addPromptDialogStep,
    set: (value) => layoutStore.addPromptDialogStep = value,
  });

  watch(step, (value) => {
    changingModel.value = false;
    promptExamplesVisible.value = false;
  });

  const visible = ref(false);
  const prompting = ref(false);

  const changingModel = ref(false);
  const promptExamplesVisible = ref(false);

  const changeUserPrompt = ref(false);



  const promptSelection = computed(() => {

    const ids = promptStore.getPredefinedPromptId('Prompt Refiner');
    return promptStore.prompts.filter(prompt => {
      return ids?.includes(prompt.id) ?? false
    })
  });

  const models = computed(() => promptStore.models);

  const promptName = computed({
    get: () => layoutStore.addPromptDialogPromptName,
    set: (value) => layoutStore.addPromptDialogPromptName = value,
  })
  const promptDescription = ref('');
  const promptColor = ref('');
  const promptIcon = ref('');
  const promptType = ref('general');
  const promptCategory = ref('');
  const promptFolder = ref('');
  const systemPrompt = computed({
    get: () => layoutStore.addPromptDialogSystemPrompt,
    set: (value) => layoutStore.addPromptDialogSystemPrompt = value,
  });
  const userPrompt = computed({
    get: () => layoutStore.addPromptDialogUserPrompt,
    set: (value) => layoutStore.addPromptDialogUserPrompt = value,
  });
  const promptModel = computed({
    get: () => layoutStore.addPromptDialogModelId,
    set: (value) => layoutStore.addPromptDialogModelId = value,
  });

  function nextDisabled() {
    return promptName.value.length < 2;
  }

  function confirmPrompt() {
    if(canAddPrompt()) {
      promptStore.addNewPrompt(promptModel.value, newPromptParameters.value);
    }

    layoutStore.addPromptDialogOpened = false;
  }

  function prefillNewPromptParameters(style) {
    if(style === 'default-inline') {
      promptType.value = 'general';
      systemPrompt.value = 'Read the provided text and ...';
      userPrompt.value = '$textOrSelection';
    } else if(style === 'default-inline-context') {
      promptType.value = 'general';
      systemPrompt.value = 'Read the provided text and ... \n\n$context';
      userPrompt.value = '$textOrSelection';
    } else if(style === 'default-insert') {
      promptType.value = 'insert';
      systemPrompt.value = 'Read the provided text and ...';
      userPrompt.value = '$text';
    } else if(style === 'default-selection') {
      promptType.value = 'selectionAnalysis';
      systemPrompt.value = 'Read the provided text and ...';
      userPrompt.value = '$selection';
    } else if(style === 'reset') {
      promptType.value = 'general';
      systemPrompt.value = '';
      userPrompt.value = '';
    } else if(style === 'example-summary') {
      promptType.value = 'general';
      systemPrompt.value = 'Summarize the following text into one paragraph.';
      userPrompt.value = '$textOrSelection';
    } else if(style === 'example-summary-advanced') {
      promptType.value = 'general';
      systemPrompt.value = 'I want you be a grammar corrector. I will provide you with text and you will reply with the same text, but correct grammar, spelling or punctuation errors. Do not reply anything else.';
      userPrompt.value = '$textOrSelection';
    } else if(style === 'example-continue') {
      promptType.value = 'insert';
      systemPrompt.value = 'Read the following text and continue by writing the next paragraph, keeping the same style and tone.\n\n$context';
      userPrompt.value = '$text';
    } else if(style === 'example-continue-advanced') {
      promptType.value = 'insert';
      systemPrompt.value = 'TODO';
      userPrompt.value = '$text';
    } else if(style === 'example-analyse') {
      promptType.value = 'selectionAnalysis';
      systemPrompt.value = 'Read the following text and analyse it for possible mistakes in content or grammar.';
      userPrompt.value = '$selection';
    } else if(style === 'example-analyse-advanced') {
      promptType.value = 'selectionAnalysis';
      systemPrompt.value = 'TODO';
      userPrompt.value = '$selection';
    }
  }

  function canAddPrompt() {
    return promptName.value.length > 0;
  }

  const newPromptParameters = computed(() => {
    return {
      promptName: promptName.value,
      promptDescription: promptDescription.value,
      promptColor: promptColor.value,
      promptIcon: promptIcon.value,
      promptType: promptType.value,
      promptCategory: promptCategory.value,
      promptFolder: promptFolder.value,
      systemPrompt: systemPrompt.value,
      userPrompt: userPrompt.value,
    }
  });

  const refinePromptResult = ref(null);

  function replacePromptResult(result) {
    refinePromptResult.value = result;
  }

  watch(promptType, (value) => {
    console.log(value);
    if (value.value === 'inline' && userPrompt.value === '$text') {
      userPrompt.value = '$selection';
    } else if (value.value === 'insert' && userPrompt.value === '$selection'){
      userPrompt.value = '$text';
    }
  });

  async function runPrompt(prompt) {
    try {
      prompting.value = true;

      const result = await executePromptClick(prompt, systemPrompt.value, true, null, true, null, true);

      refinePromptResult.value = result;

    } finally {
      prompting.value = false;
    }
  }

  const model = computed(()=> promptStore.getModel(promptModel.value));

  function getModelById(id) {
    return promptStore.getModel(id);
  }

</script>

<style scoped>

</style>
