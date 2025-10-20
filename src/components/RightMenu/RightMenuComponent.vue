<template>
  <div class="" id="rightPanel" style="height: calc(100vh - 104px); width: 100%">
    <q-expansion-item
      label="File Details"
      icon="mdi-information-outline"
      v-model="layoutStore.fileDetailsOpen"
      id="fileDetails"
    >
      <q-card v-if="file" :class="layoutStore.darkMode ? '' : ''">
        <q-card-section class="q-pb-sm">
          <div class="row q-gutter-x-sm">
            <div class="col">
              <q-select v-model="fileState" label="State" filled dense :options="promptStore.statuses" option-label="label" option-value="label" clearable options-dense>
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
            <div class="col">
              <q-select v-model="fileLabels" label="Labels" filled dense :options="promptStore.labels" option-label="label" option-value="label" multiple clearable use-chips options-dense>
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
        </q-card-section>
        <q-card-section class="q-py-sm">
          <q-img v-if="file.imageUrl" :src="file.imageUrl" class="full-width" ref="fileImg" style="max-height: 400px;" fit="contain">
            <div class="absolute all-pointer-events q-gutter-y-xs no-padding flex column " style="" v-if="imageHovered">
              <q-btn  flat size="12px" icon="mdi-upload"  @click="uploadImage">
                <q-tooltip>
                  Replace image
                </q-tooltip>
              </q-btn>
              <q-btn flat size="12px" icon="mdi-close" @click="deleteFileImage">
                <q-tooltip>
                  Delete image
                </q-tooltip>
              </q-btn>
            </div>

          </q-img>
          <q-btn v-else flat no-caps :loading="uploadingImage" @click="uploadImage" icon="mdi-image-outline" color="grey-7" label="Add Image" class="full-width" />
        </q-card-section>
        <q-card-section class="q-py-sm">
          <InputWithAi v-model="fileSynopsis" label="Synopsis" type="textarea" :prompt-ids="promptStore.getPredefinedPromptId('Summarize Page')" :prompt-input="file.content" :class="writeClasses" autogrow />
        </q-card-section>
        <q-card-section class="q-py-sm">
          <q-input label="Note" v-model="fileNote" type="textarea" filled :class="layoutStore.darkMode ? 'bg-brown-10' : 'bg-yellow-2'" dense autogrow/>
        </q-card-section>
        <q-card-section class="q-pt-sm">
          <div class="">
            <q-select v-model="contextType" :options="contextTypes" option-label="label" option-value="label" label="Include in Context" filled dense clearable use-chips options-dense>
              <template v-slot:selected-item="scope">
                <q-chip
                  @remove="scope.removeAtIndex(scope.index)"
                  :tabindex="scope.tabindex"
                  :color="scope.opt.color + (layoutStore.darkMode ? '-9' : '-3')"
                  dense
                  class="q-ma-none"
                >
                  {{ scope.opt.label }}
                </q-chip>
              </template>
              <template v-slot:after-options>
                <q-separator />
                <div class="flex full-width justify-center">
                  <q-btn flat dense icon="mdi-playlist-edit" color="grey-6" no-caps label="Edit..." @click="layoutStore.openConfiguration('contextTypes')" />
                </div>
              </template>
            </q-select>
          </div>
        </q-card-section>

      </q-card>
    </q-expansion-item>
    <div class="fit q-my-sm q-pl-sm q-pr-md">

      <div class="fit ai-panel scroll">
        <div class="text-center q-mt-md q-mb-md" v-if="views.length > 1">
          <q-btn-toggle :options="views" v-model="layoutStore.currentRightMenuView" unelevated no-caps class="bordered inscriptor-highlight-btn" toggle-color="primary" padding="xs md" id="aiSwitch" >
            <template v-slot:prompts>
              <div class="col row full-width">
                <div class="col column items-center justify-center">
                  <q-icon name="mdi-creation-outline" size="20px" />
                  <span>
                    Prompts
                    <q-badge floating color="accent" :class="layoutStore.newPromptClass" v-if="promptStore.getTabData(promptTabId)?.promptResultsHistory.length > 0">{{promptStore.getTabData(promptTabId)?.promptResultsHistory.length}}</q-badge>
                  </span>
                </div>
              </div>
            </template>

            <template v-slot:chat>
              <div class="row full-width">
                <div class="col column items-center justify-center">
                  <q-icon name="mdi-robot" size="20px"  />
                  <span>
                    Chat
                    <q-badge floating color="accent" :class="layoutStore.newChatClass" v-if="aiAgentStore.agentChats.chats?.length > 1">{{aiAgentStore.agentChats.chats?.length}}</q-badge>
                  </span>
                </div>
              </div>
            </template>

            <template v-slot:brainstorm>
              <div class="row full-width">
                <div class="col column items-center justify-center">
                  <q-icon name="mdi-head-snowflake-outline" size="20px"  />
                  <span>
                    Brainstorm
                    <q-badge floating color="accent" :class="layoutStore.newBrainstormClass" v-if="brainstormPromptResults?.length > 0">{{brainstormPromptResults?.length}}</q-badge>
                  </span>
                </div>
              </div>
            </template>

            <template v-slot:analysis>
              <div class="row full-width">
                <div class="col column items-center justify-center">
                  <q-icon name="mdi-chart-timeline-variant-shimmer" size="20px"  />
                  <span>
                    Analyse
                    <q-badge floating color="accent" :class="layoutStore.newAnalysisClass" v-if="selectionPromptResults?.length > 0">{{selectionPromptResults?.length}}</q-badge>
                  </span>
                </div>
              </div>
            </template>

            <template v-slot:suggest>
              <div class="row full-width">
                <div class="col column items-center justify-center">
                  <q-icon name="mdi-lightbulb-on-outline" size="20px"  />
                  <span>
                    Suggest
                    <q-badge floating color="accent" :class="layoutStore.newSuggestClass" v-if="suggestPromptResults?.length > 0">{{suggestPromptResults?.length}}</q-badge>
                  </span>
                </div>
              </div>
            </template>
          </q-btn-toggle>
        </div>

        <q-card flat v-if="promptStore.analysisEnabled" class="bg-transparent">

          <q-card-section v-if="promptStore.analysisEnabled && promptStore.selectionAnalysisAvailablePrompts.length === 0">
          <span class="text-warning">
            <q-icon name="mdi-exclamation-thick" />
            No analysis prompts created
          </span>
          </q-card-section>

          <q-card-section v-if="promptStore.analysisEnabled && promptStore.selectionAnalysisAvailablePrompts.length > 0">
            <div class="row">
              <div class="col flex items-center q-pr-md">
                <q-btn @click="promptStore.promptSelectionAnalysisPrompts" icon="mdi-chart-timeline-variant-shimmer" color="accent" :label="analyseLabel" no-caps :loading="promptStore.selectionAnalysisRunning" v-if="canAnalyse" style="min-width: 220px;"/>
                <span v-else class="text-grey-8">
                  No text selected, please select text to analyse.
                </span>
              </div>
              <div class="col justify-end flex">
                <q-btn :label="analysisPrompts.length + ' prompts active'" flat color="accent"  icon-right="mdi-chevron-down" no-caps>
                  <q-popup-proxy>
                    <q-card style="width: 600px; " class="">

                      <q-list v-if="analysisPrompts" dense class="full-width q-mb-sm scroll-y" style="max-height: 600px;">
                        <q-item v-for="(prompt, i) in analysisPrompts" :key="i" dense class="full-width">
                          <q-item-section side>
                            <div class="text-grey-8 q-gutter-xs flex items-center">
                              <q-toggle dense :model-value="prompt.enabled" @update:model-value="(val) => promptStore.updateAnalysisPrompt(prompt, {enabled: val})" color="accent" />
                            </div>
                          </q-item-section>
                          <q-item-section top class="col gt-sm" :class="prompt.enabled ? '' : 'text-grey'">
                            <q-item-label class="q-mt-sm">
                              {{ getPromptNameById(prompt.promptId) }}
                            </q-item-label>
                            <q-item-label caption>
                              {{ getPromptModelName(prompt.promptId).name }}
                            </q-item-label>
                          </q-item-section>
                          <q-item-section side class="flex items-center">
                            <div class="text-grey-8 q-gutter-xs flex items-center">
                              <q-btn flat no-caps icon="mdi-book-outline" dense>
                                <q-menu max-width="800px">
                                  <SimplePromptContextSelector v-model="prompt.contextTypes" :title="'Choose context for ' + getPromptNameById(prompt.promptId) + ' prompt'" icon="mdi-pen" output-context-as-objects/>
                                </q-menu>
                                <q-tooltip :delay="500">
                                  Set Context for this prompt
                                </q-tooltip>
                              </q-btn>
                              <q-btn flat dense icon="mdi-arrow-up" @click="promptStore.moveAnalysisPrompt(prompt, - 1)"  />
                              <q-btn flat dense icon="mdi-arrow-down" @click="promptStore.moveAnalysisPrompt(prompt, 1)" />
                              <q-btn flat dense icon="mdi-cog-outline" >
                                <q-menu>
                                  <q-list>
                                    <q-item>
                                      <q-item-section side >
                                        <q-checkbox :model-value="prompt.runOnSelection" @update:model-value="(val) => promptStore.updateAnalysisPrompt(prompt, {runOnSelection: val})" />
                                      </q-item-section>
                                      <q-item-section>
                                        <q-item-label>Can be run from Text Selection</q-item-label>
                                        <q-item-label caption>
                                          Select any text, click 'AI Analysis' -> this prompt runs
                                          <q-tooltip :delay="500" max-width="400px">
                                            When you select text in editor, there's AI Analysis button. If this is checked, then this prompt will run when you click this button. Usage: create different sets for analysis, eg. one for grammar check and verifications and one for rewriting the prose.
                                          </q-tooltip>
                                        </q-item-label>
                                      </q-item-section>
                                    </q-item>
                                  </q-list>
                                </q-menu>
                              </q-btn>
                              <q-btn flat dense icon="mdi-delete" @click="promptStore.removeAnalysisPrompt(prompt)" color="negative" />
                            </div>
                          </q-item-section>
                        </q-item>
                      </q-list>

                      <div v-if="addPromptVisible">
                        <PromptPicker v-model="addPrompt" :prompts="availableAnalysisPrompts" @update:model-value="(val) => addAnalysisPrompt(val)" placeholder="Add prompt..."></PromptPicker>
                      </div>
                      <div v-else>
                        <q-btn square flat class="full-width" icon="mdi-plus" @click="addPromptVisible = true" />
                      </div>
                    </q-card>
                  </q-popup-proxy>
                </q-btn>

                <q-linear-progress indeterminate v-if="layoutStore.analysisTriggered" />
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="promptStore.analysisEnabled && selectionPromptResults?.length > 0">
            <div class="q-gutter-y-sm">
              <div v-for="(promptResult, index) in selectionPromptResults" :key="index">

                <div>
                  <transition
                    appear
                    enter-active-class="animated fadeInDown slower"
                    leave-active-class="animated fadeOut delay-1s"
                  >
                    <PromptResult :promptResult="promptResult" is-selection-analysis disable-followup-actions/>

                  </transition>
                </div>

              </div>
            </div>
            <q-btn outline @click="promptStore.promptSelectionAnalysisPrompts" icon="mdi-sync" class="q-mt-md" color="green" size="sm"/>
          </q-card-section>

          <q-card-section v-else-if="analysisPrompts.length > 0 && selectionPromptResults?.length === 0" class="text-center">
            <div class="">Analysis is active using {{ analysisPrompts.length }} prompt(s)</div>
            <div>Click 'Analyze' or press CTRL+space to start.</div>
          </q-card-section>

          <q-card-section v-else-if="analysisPrompts.length === 0" class="text-center">
            <div>You have not selected any analysis prompts, so no analysis will be performed.</div>
          </q-card-section>

        </q-card>
        <q-card flat v-if="layoutStore.currentRightMenuView === 'brainstorm'" class="bg-transparent">
          <q-card-section v-if="promptStore.brainstormingPrompt" class="">
            <div class="row justify-between q-gutter-x-sm items-center">
              <div class="col-auto">
                <q-btn @click="promptStore.promptBrainstormPrompt(brainstormParametersValue)" icon="mdi-head-snowflake-outline" color="accent" label="Brainstorm" no-caps :loading="promptStore.brainstormPromptRunning" style="min-width: 220px;"/>
              </div>
              <div class="col">
                <PromptPicker v-model="promptStore.brainstormingPrompt" :prompts="availableBrainstormingPrompts" placeholder="Set prompt for Brainstorming"></PromptPicker>
              </div>
              <div class="col-auto">
                <q-btn no-caps icon="mdi-book-outline" label="Context" color="primary">
                  <q-menu max-width="800px">
                    <SimplePromptContextSelector v-model="promptStore.brainstormPromptContext" title="Set Brainstorming Context" icon="mdi-book-outline" output-context-as-objects/>
                  </q-menu>
                  <q-tooltip :delay="500">
                    Set Context for this prompt
                  </q-tooltip>
                </q-btn>
              </div>
              <div class="col-auto" v-if="brainstormParametersValue.length > 0">
                <q-btn flat no-caps dense :icon="brainstormParametersExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'" @click="brainstormParametersExpanded = !brainstormParametersExpanded">
                  <q-badge floating v-if="brainstormParametersValue.length > 0">{{ brainstormParametersValue.length }}</q-badge>
                  <q-tooltip :delay="500">
                    {{ brainstormParametersExpanded ? 'Hide' : 'Show' }} parameters
                  </q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
          <q-card-section v-else>
              <PromptPicker v-model="promptStore.brainstormingPrompt" :prompts="availableBrainstormingPrompts" placeholder="Select prompt for Brainstorming..."></PromptPicker>
          </q-card-section>

          <q-card-section v-if="brainstormParametersValue.length > 0 && brainstormParametersExpanded" class="q-pt-none q-gutter-y-md">
            <div v-for="parameter in brainstormParametersValue" :key="parameter.name">
              <template v-if="parameter.type === 'Select'">
                <q-select dense filled v-model="parameter.value" :options="parameter.values" :label="parameter.name"></q-select>
              </template>
              <template v-if="parameter.type === 'Text'">
                <p class="text-subtitle2 q-mb-none" v-if="parameter.hint?.length > 0">
                  {{ parameter.hint }}
                  <span v-if="parameter.required" class="text-red-4">*</span>
                </p>
                <div class="row">
                  <div class="col">
                    <CodeEditor v-model="parameter.value" :parameters="[]"/>
                  </div>
                  <div v-if="parameter.examples && parameter.examples.length > 0" class="col-auto q-ml-sm flex items-center">
                    <q-btn class="text-secondary" no-caps dense icon-right="expand_more" flat label="Examples">
                      <q-popup-proxy>
                        <q-card style="width: 400px;">
                          <q-card-section>
                            <q-chip v-for="(text, index) in separateTextByComma(parameter.examples)" :key="index"
                                    class="text-caption" :label="text" dense clickable @click="parameter.value = text" color="blue-grey-1">
                            </q-chip>
                          </q-card-section>
                        </q-card>
                      </q-popup-proxy>
                    </q-btn>
                  </div>
                </div>
              </template>
            </div>
          </q-card-section>

          <q-card-section v-if="promptStore.brainstormingPrompt && brainstormPromptResults?.length === 0" class="text-center">
            <div v-if="brainstormParametersValue.length > 0 && !brainstormParametersExpanded">
              <q-btn flat label="Expand parameters" dense no-caps @click="brainstormParametersExpanded = true" />
            </div>
            <div>Click 'Brainstorm' to start.</div>
          </q-card-section>

          <q-card-section v-if="brainstormPromptResults.length > 0" class="q-pt-xs">
            <div class="q-gutter-y-sm">
              <div v-for="(promptResult, index) in brainstormPromptResults" :key="index">
                <div>
                  <transition
                    appear
                    enter-active-class="animated fadeInDown slower"
                    leave-active-class="animated fadeOut delay-1s"
                  >
                    <PromptResult :promptResult="promptResult" is-selection-analysis disable-followup-actions />
                  </transition>
                </div>
              </div>
            </div>
            <div class="row justify-between">
              <q-btn outline @click="promptStore.promptBrainstormPrompt(brainstormParametersValue)" icon="mdi-sync" class="q-mt-md" color="green" size="sm"/>
              <q-btn outline @click="promptStore.clearBrainstormPromptResults()" icon="mdi-close" class="q-mt-md" color="negative" size="sm"/>
            </div>
          </q-card-section>
        </q-card>
        <q-card flat v-if="layoutStore.currentRightMenuView === 'suggest'" class="bg-transparent">
          <q-card-section v-if="promptStore.suggestingPrompt" class="">
            <div class="row justify-between q-gutter-x-sm items-center">
              <div class="col-auto">
                <q-btn @click="promptStore.promptSuggestPrompt()" icon="mdi-lightbulb-on-outline" color="accent" label="Suggest" no-caps :loading="promptStore.suggestPromptRunning" style="min-width: 220px;"/>
              </div>
              <div class="col">
                <PromptPicker v-model="promptStore.suggestingPrompt" :prompts="availableSuggestingPrompts" placeholder="Set prompt for Suggestions"></PromptPicker>
              </div>
              <div class="col-auto">
                <q-btn no-caps icon="mdi-book-outline" label="Context" color="primary">
                  <q-menu max-width="800px">
                    <SimplePromptContextSelector v-model="promptStore.suggestPromptContext" title="Set Suggestion Context" icon="mdi-book-outline" output-context-as-objects/>
                  </q-menu>
                  <q-tooltip :delay="500">
                    Set Context for this prompt
                  </q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
          <q-card-section v-else>
              <PromptPicker v-model="promptStore.suggestingPrompt" :prompts="availableSuggestingPrompts" placeholder="Select prompt for Suggestions..."></PromptPicker>
          </q-card-section>

          <q-card-section v-if="promptStore.suggestingPrompt && suggestPromptResults?.length === 0" class="text-center">
            <div>Suggestions will auto-run when you switch to this tab.</div>
          </q-card-section>

          <q-card-section v-if="suggestPromptResults.length > 0" class="q-pt-xs">
            <div class="q-gutter-y-sm">
              <div v-for="(promptResult, index) in suggestPromptResults" :key="index">
                <div>
                  <transition
                    appear
                    enter-active-class="animated fadeInDown slower"
                    leave-active-class="animated fadeOut delay-1s"
                  >
                    <PromptResult :promptResult="promptResult" is-selection-analysis disable-followup-actions />
                  </transition>
                </div>
              </div>
            </div>
            <div class="row justify-between">
              <q-btn outline @click="promptStore.promptSuggestPrompt()" icon="mdi-sync" class="q-mt-md" color="green" size="sm"/>
              <q-btn outline @click="promptStore.clearSuggestPromptResults()" icon="mdi-close" class="q-mt-md" color="negative" size="sm"/>
            </div>
          </q-card-section>
        </q-card>
        <PromptsTab v-if="layoutStore.currentRightMenuView === 'prompts'"/>
        <AgentChatTab v-if="layoutStore.currentRightMenuView === 'agentChat'"/>
        <div style="height: 60px" />
      </div>


    </div>

  </div>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {computed, onMounted, ref, watch} from "vue";
  import PromptResult from "components/RightMenu/PromptResult.vue";
  import {useFileStore} from "stores/file-store";
  import PromptsTab from "components/RightMenu/PromptsTab.vue";
  import {useLayoutStore} from "stores/layout-store";
  import InputWithAi from "components/Common/InputWithAi.vue";
  import { open } from '@tauri-apps/plugin-dialog';
  import {readFile} from "@tauri-apps/plugin-fs";
  import {uploadImageRaw} from "src/common/apiServices/imageGenService";
  import {useCurrentUser} from "vuefire";
  import {uint8ArrayToBase64} from "src/common/utils/textUtils";
  import {useElementHover} from "@vueuse/core";
  import {chatTabId, promptTabId, agentChatTabId, brainstormTabId, suggestTabId} from 'src/common/resources/tabs';
  import AgentChatTab from 'components/RightMenu/AgentChatTab.vue';
  import {getSelectedText} from 'src/common/utils/editorUtils';
  import {useAiAgentStore} from 'stores/aiagent-store';
  import SimplePromptContextSelector from "components/Common/Settings/SimplePromptContextSelector.vue";
  import PromptPicker from 'components/Common/PromptPicker.vue';
  import CodeEditor from "components/Common/Editors/CodeEditor.vue";
  import {useResponsive} from 'src/common/utils/screenUtils';

  const promptStore = usePromptStore();
  const aiAgentStore = useAiAgentStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();
  const tabs = computed(() => promptStore.tabs);
  const { isMobile } = useResponsive();

  const uploadingImage = ref(false);
  const fileImg = ref(null);

  const addPromptVisible = ref(false);
  const addPrompt = ref(null);
  const brainstormParametersValue = ref([]);
  const brainstormParametersExpanded = ref(true);

  // Track last suggest generation to avoid unnecessary re-runs
  const lastSuggestFileId = ref(null);
  const lastSuggestFileContent = ref(null);

  const imageHovered = useElementHover(fileImg);

  const currentTab = computed({
    get: () => promptStore.currentTab?.id ?? tabs.value[0].id,
    set: (value) => {
      promptStore.setCurrentTabId(value);
    }
  })

  const views = computed(() => {
    // In mobile view, only show Chat tab
    if (isMobile.value) {
      return [{value: 'agentChat', slot: 'chat' }];
    }

    // Desktop view - show all tabs with filtering
    const allViews = [
      {value: 'prompts', slot: 'prompts' },
      {value: 'agentChat', slot: 'chat' },
      {value: 'brainstorm', slot: 'brainstorm' },
      {value: 'analysis', slot: 'analysis' },
      { value: 'suggest', slot: 'suggest' },
    ];

    // Filter out tabs with no available prompts
    let filteredViews = allViews;

    if (availableBrainstormingPrompts.value.length === 0) {
      filteredViews = filteredViews.filter(v => v.value !== 'brainstorm');
    }

    if (availableSuggestingPrompts.value.length === 0) {
      filteredViews = filteredViews.filter(v => v.value !== 'suggest');
    }

    return filteredViews;
  });

  // Set initial view on mount
  onMounted(() => {
    if (isMobile.value && layoutStore.currentRightMenuView !== 'agentChat') {
      layoutStore.currentRightMenuView = 'agentChat';
    }
  });

  watch(() => layoutStore.currentRightMenuView, (newValue) => {
    if(newValue === 'prompts') {
      promptStore.analysisEnabled = false;
      currentTab.value = promptTabId;
    } else if(newValue === 'analysis') {
      promptStore.analysisEnabled = true;
    } else if(newValue === 'brainstorm') {
      promptStore.analysisEnabled = false;
      currentTab.value = brainstormTabId;
    } else if(newValue === 'suggest') {
      promptStore.analysisEnabled = false;
      currentTab.value = suggestTabId;
      // Auto-execute suggest prompt when switching to this tab
      // Only run if file has changed since last suggest
      if(promptStore.suggestingPrompt && !promptStore.suggestPromptRunning) {
        const currentFileId = fileStore.selectedFile?.id;
        const currentFileContent = fileStore.selectedFile?.content;

        // Only auto-run if file has changed or this is the first run
        if(currentFileId !== lastSuggestFileId.value || currentFileContent !== lastSuggestFileContent.value) {
          promptStore.promptSuggestPrompt();
        }
      }
    } else if(newValue === 'chat') {
      promptStore.analysisEnabled = false;
      currentTab.value = chatTabId;
    } else if(newValue === 'agentChat') {
      promptStore.analysisEnabled = false;
      currentTab.value = agentChatTabId;
    }
  });

  //watch(currentTab, (newValue) => {
  //  promptStore.setCurrentTabId(newValue);
  //});

  const file = computed(() => fileStore.selectedFile);

  const contextTypes = computed(() => promptStore.contextTypes);
  const contextType = computed({
    get: () => file.value?.settings?.contextType ?? null,
    set: (value) => fileStore.updateFileSettings(file.value, {contextType: value}),
  });

  const availableAnalysisPrompts = computed(() => [...promptStore.selectionAnalysisPrompts, ...promptStore.selectionPrompts]
    .map(p => {
      const promptModel = promptStore.getModel(p.modelId);

      return {
        label: p.title + ' (' + promptModel?.name + ')',
        value: p.id,
      };
    }).sort((a, b) => a.label.localeCompare(b.label))
  );

  const availableBrainstormingPrompts = computed(() => [...promptStore.brainstormingPrompts]
    .map(p => {
      const promptModel = promptStore.getModel(p.modelId);

      return {
        label: p.title + ' (' + promptModel?.name + ')',
        value: p.id,
      };
    }).sort((a, b) => a.label.localeCompare(b.label))
  );

  const availableSuggestingPrompts = computed(() => [...promptStore.suggestingPrompts]
    .map(p => {
      const promptModel = promptStore.getModel(p.modelId);

      return {
        label: p.title + ' (' + promptModel?.name + ')',
        value: p.id,
      };
    }).sort((a, b) => a.label.localeCompare(b.label))
  );

  function addAnalysisPrompt(prompt) {
    addPrompt.value = null;

    promptStore.addAnalysisPrompt(prompt);
  }

  function updateAnalysisPrompt(prompt, args) {
    if(!prompt || !args) return;

    if(args.enabled !== undefined) {

    }
  }

  const fileSynopsis = computed({
    get: () => file.value?.synopsis ?? '',
    set: (value) => {
      if(file.value) {
        file.value.synopsis = value;
        fileStore.setDirty(file.value);
      }
    }
  });

  const fileNote = computed({
    get: () => file.value?.note ?? '',
    set: (value) => {
      if(file.value) {
        file.value.note = value;
        fileStore.setDirty(file.value);
      }
    }
  });

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

  const brainstormPromptResults = computed(() => {
    return promptStore.brainstormPromptResults ?? [];
  });

  const suggestPromptResults = computed(() => {
    return promptStore.suggestPromptResults ?? [];
  });

  const selectionPromptResults = computed(() => {
    return promptStore.selectionPromptResults ?? [];
  });

  const analysisPrompts = computed(() => {
    return (promptStore.analysisPromptsSettings.prompts ?? []).filter(p => promptStore.getPromptById(p.promptId));
  })

  const analyseLabel = computed(() => {
    const selectedText = getSelectedText();
    if(!selectedText || selectedText.trim().length === 0) {
      return 'Analyse';
    }

    const wordCount = selectedText.trim().split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount > 0) {
      return `Analyse (${wordCount} ${wordCount === 1 ? 'word' : 'words'})`;
    }

    return 'Analyse';
  });

  const canAnalyse = computed( () =>  {
    const selectedText = getSelectedText();
    if(!selectedText || selectedText.trim().length === 0) {
      return false;
    }

    // Check if there's actual text selected (not just whitespace)
    const wordCount = selectedText.trim().split(/\s+/).filter(word => word.length > 0).length;

    return wordCount > 0;
  })

  const writeClasses = computed(() => {
    return {
      'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
      'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
      'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    }
  });

  function deleteFileImage() {
    fileStore.setFileImage(file.value, null);
  }

  async function uploadImage() {
    const user = useCurrentUser();
    const idToken = await user.value.getIdToken();

    if(layoutStore.runsInDesktopApp()) {
      const filePath = await open({ multiple: false, directory: false });
      if (!filePath) {
        return;
      }
      try {
        uploadingImage.value = true;

        const binaryData = await readFile(filePath);
        const base64 = uint8ArrayToBase64(binaryData);

        const imageUrl = await uploadImageRaw(idToken, base64, useCurrentUser().value.uid);

        if(imageUrl) {
          fileStore.setFileImage(file.value, imageUrl);
        }

      } finally {
        uploadingImage.value = false;
      }


    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) {
          return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            uploadingImage.value = true;

            // The result is a data URL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
            const dataUrl = ev.target.result;

            // Extract only the Base64 part (after the comma)
            const base64 = dataUrl.split(',')[1];

            const imageUrl = await uploadImageRaw(idToken, base64, useCurrentUser().value.uid);

            if(imageUrl) {
              fileStore.setFileImage(file.value, imageUrl);
            }
          } catch (error) {
            console.error("Failed to upload file:", error);
          } finally {
            uploadingImage.value = false;
          }
        };
        reader.readAsDataURL(f);
      };
      input.click();
    }
  }

  function getPromptNameById(promptId) {
    return promptStore.getPromptById(promptId)?.title;
  }

  function getPromptModelName(promptId) {
    const prompt = promptStore.getPromptById(promptId);
    if(prompt) {
      return promptStore.getModel(prompt.modelId);
    }

    return "";
  }

  function separateTextByComma(text) {
    return text.split(',')?.map(t => t.trim()) ?? [];
  }

  // Watch for brainstorming prompt changes and initialize parameters
  watch(() => promptStore.brainstormingPrompt, (newPrompt) => {
    brainstormParametersValue.value = [];
    if (newPrompt?.value) {
      const prompt = promptStore.getPromptById(newPrompt.value);
      if (prompt?.parameters) {
        for (const param of prompt.parameters) {
          brainstormParametersValue.value.push({
            name: param.name,
            type: param.type,
            value: param.default,
            hint: param.hint,
            required: param.required,
            prefixWith: param.prefixWith,
            suffixWith: param.suffixWith,
            examples: param.examples,
            values: [...(param.values || [])],
            prompt: prompt,
          });
        }
      }
    }
  });

  // Track when suggest prompt finishes to save file state
  watch(() => promptStore.suggestPromptRunning, (isRunning, wasRunning) => {
    // When suggest finishes running (was true, now false)
    if(wasRunning && !isRunning && fileStore.selectedFile) {
      lastSuggestFileId.value = fileStore.selectedFile.id;
      lastSuggestFileContent.value = fileStore.selectedFile.content;
    }
  });

</script>

<style scoped>

.hover-image {
  transition: all 0.2s;
}

.hover-image:hover {
  filter: brightness(0.6);
}

</style>
