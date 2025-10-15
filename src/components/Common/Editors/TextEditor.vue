<template>
  <div v-if="editor" class="">
    <bubble-menu
      class="bubble-menu"
      :tippy-options="{ duration: 100, placement: 'bottom', maxWidth: '600px', zIndex: 99999 }"
      :editor="editor"
      :should-show="shouldShowDefaultBubbleMenu"
    >
      <div class="q-gutter-y-xs" v-if="aiBubbleMenu">
        <div class="row">
          <div class="q-gutter-x-xs">
            <q-btn size="11px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-theme-primary bordered" inscriptor-shadow-1 color="accent" :class="{ 'text-primary': showPrompts }">
              <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" >
                <q-card v-show="showPrompts">
                  <PromptSelector prompt-types="selection" @promptClick="promptClick" />
                </q-card>
              </q-popup-proxy>
              <q-tooltip  :delay="1000">
                AI prompts
              </q-tooltip>
            </q-btn>

            <q-btn v-if="predefinedWordFinderPrompts && predefinedWordFinderPrompts.length > 0" size="11px" dense flat icon="mdi-text-search" padding="4px 6px" class="bg-theme-primary bordered inscriptor-shadow-1" color="accent" @click="runWordFinder()" :loading="wordFinderLoading">
              <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" class="popup-gradient-1">
                <q-card style="width: 400px; height: 300px;" class="popup-gradient-1 idea-card column ">
                  <div class="col-auto" style="height: 35px;">
                    <div class="row text-center bg-accent q-py-sm q-px-md q-mb-sm full-width">
                      <div class="col justify-start flex">
                        <div class="text-white text-weight-medium">
                          <q-icon name="mdi-text-search" class="q-mr-xs" />
                          {{ truncate(getSelectedText(), 40) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col scroll-y q-mt-sm">
                    <div class="row">
                      <template v-for="(word, i) in wordFinderOutput" :key="i">
                        <div class="col-auto">
                          <q-item clickable v-close-popup @click="replaceOrInsertWord(word)" dense>
                            <q-item-section>
                              <q-item-label>{{ word }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </div>
                      </template>
                    </div>
                  </div>
                  <div class="col-auto" height="40px;">
                    <div class="full-width flex justify-center" v-if="wordFinderOutput && wordFinderOutput.length > 0">
                      <q-btn icon="mdi-plus" color="primary" no-caps @click="runWordFinder(false)" dense flat class="text-center full-width" :loading="wordFinderLoading"/>
                    </div>
                    <q-skeleton v-else animation="fade"/>
                  </div>
                </q-card>
              </q-popup-proxy>
              <q-tooltip  :delay="1000">
                Word Finder
              </q-tooltip>
            </q-btn>

            <q-btn v-if="promptStore.analysisPromptsSettings.prompts && promptStore.analysisPromptsSettings.prompts.length > 0" size="11px" dense flat icon="mdi-chart-timeline-variant-shimmer" padding="4px 6px" class="bg-theme-primary bordered inscriptor-shadow-1" color="accent" @click="runSelectionAnalysis" :loading="promptStore.selectionAnalysisRunning">
              <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" class="gradient-variation-2 no-border" @on-before-show="console.log($event)" @show="console.log($event)">
                <q-card style="min-width: 400px; max-width: 650px; height: 500px" class="scroll-y" v-if="promptStore.selectionPromptResults && promptStore.selectionPromptResults.length > 0">
                  <div class="q-pa-sm bg-accent text-white">
                    <div class="row items-center no-wrap">
                      <div class="col">
                        <div class="q-ml-xs text-body2 text-weight-medium">
                          <q-icon name="mdi-chart-timeline-variant-shimmer" class="q-mr-xs" />
                          Analysis
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="q-mb-sm q-mt-sm q-mx-sm" v-for="(promptResult, index) in promptStore.selectionPromptResults" :key="index">
                    <PromptResult :promptResult="promptResult" type="inline" disable-followup-actions/>
                  </div>
                </q-card>
                <q-skeleton v-else animation="fade"/>
              </q-popup-proxy>
              <q-tooltip  :delay="1000">
                Run Analysis using {{ promptStore.analysisPromptsSettings.prompts.filter(p => p.enabled && p.runOnSelection).length }} prompts
              </q-tooltip>
            </q-btn>

            <q-btn size="11px" dense flat label="Quick command..." no-caps padding="4px 6px" class="bg-theme-primary bordered inscriptor-shadow-1" color="primary" :class="{ 'text-primary': showPrompts }" @click="quickSelectionPromptShown = true" v-if="!quickSelectionPromptShown && quickSelectionCommandPrompts && quickSelectionCommandPrompts.length > 0" :loading="quickCommandRunning">
            </q-btn>
          </div>
          <div class="bg-theme-primary">
            <template v-if="quickSelectionPromptShown">
              <q-card class="q-ml-xs hoverable-card idea-card gradient-variation-1 q-pa-xs no-p-margin" style="min-width: 300px; max-width: 500px;">
                <div class="row">
                  <div class="col">
                    <q-input autogrow class="q-ml-sm text-caption" v-model="quickSelectionPromptInput" :shadow-text="quickSelectionPromptInput?.length === 0 ? 'enter command or question...' : ''" dense flat borderless autofocus @keydown="quickSelectionPromptKeydown"/>
                  </div>
                  <div class="col-auto flex items-center">
                    <q-btn size="11px" dense flat no-caps padding="4px 6px" icon="mdi-close" color="primary" @click="quickSelectionPromptShown = false" />
                    <q-btn v-if="quickSelectionCommandPrompts && quickSelectionCommandPrompts.length > 1" size="11px" dense flat no-caps padding="4px 6px" :icon="currentQuickSelectionPrompt?.icon || 'mdi-robot-outline'" color="primary">
                      <q-menu>
                        <q-list>
                          <q-item v-for="prompt in quickSelectionCommandPrompts" :key="prompt.id" clickable v-close-popup @click="selectedQuickSelectionPrompt = prompt" :active="currentQuickSelectionPrompt?.id === prompt.id">
                            <q-item-section avatar>
                              <q-icon :name="prompt.icon || 'mdi-robot-outline'" :color="prompt.color" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label class="text-caption">{{ prompt.title }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                      <q-tooltip :delay="1000">
                        Select prompt
                      </q-tooltip>
                    </q-btn>
                    <q-btn size="11px" dense flat no-caps padding="4px 6px" icon="mdi-dots-vertical" color="primary">
                      <q-popup-proxy transition-show="jump-down" transition-hide="fade" anchor="bottom left" self="top left" :offset="[0, 10]" @before-show="onOpenSelectionPromptSettings" @hide="onCloseSelectionPromptSettings">
                        <q-card class="" flat style="min-width: 400px; max-width: 500px;">
                          <q-card-section class="q-pb-none text-subtitle2">
                            Prompt Settings
                          </q-card-section>
                          <q-card-section>
                            <PromptContextSelector />
                          </q-card-section>
                        </q-card>
                      </q-popup-proxy>
                    </q-btn>
                  </div>
                </div>
              </q-card>
            </template>
          </div>
        </div>

        <div class="row" v-if="quickCommandTemporaryResult.length > 0">
          <PromptResult v-if="quickCommandTemporaryPromptResult" :promptResult="quickCommandTemporaryPromptResult" type="inline" :has-close="true" @close="closeQuickPromptResult" :insert-func="insertQuickPromptResult" @on-insert="closeQuickPromptResult" @replace-self="replacePromptResult"  :show-prompt-info="false"  disable-followup-actions/>
          <q-card v-else style="width: 400px; min-height: 50px;" class="hoverable-card idea-card gradient-variation-1 q-pa-xs no-p-margin">
            <div class="prompt-actions sticky-top">
              <div class="row no-wrap ellipsis">
                <div class="col-auto">
                  <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-chevron-double-left" @click="insertFromQuickCommand('selection')" :loading="quickCommandRunning" class="hoverable-btn-semi">
                    <q-tooltip :delay="1000">
                      Click to replace
                    </q-tooltip>
                  </q-btn>
                </div>
                <div class="col" />
                <div class="col-auto">
                  <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-close" @click="quickCommandTemporaryResult = ''" class="hoverable-btn-semi">
                  </q-btn>
                </div>
              </div>
            </div>
            <q-card-section>
              <div v-html="markdownToHtml(quickCommandTemporaryResult)" />
            </q-card-section>
          </q-card>
        </div>
      </div>

    </bubble-menu>

    <floating-menu
      class="floating-menu"
      :tippy-options="{ duration: 100, placement: 'bottom', maxWidth: '600px' }"
      :editor="editor"
      :should-show="shouldShowFloatingMenu"
    >
      <div class="q-gutter-y-xs" v-if="aiBubbleMenu">
        <div class="row">
          <div class="q-gutter-x-xs">
            <q-btn size="11px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-theme-primary bordered inscriptor-shadow-1" color="accent" :class="{ 'text-primary': showPrompts }">
              <q-popup-proxy transition-show="jump-down" transition-hide="fade" anchor="top right" self="top left" :offset="[10, 0]"  >
                <q-card v-show="showPrompts">
                  <PromptSelector prompt-types="insert" @promptClick="promptClick" />
                </q-card>
              </q-popup-proxy>
              <q-tooltip  :delay="1000">
                AI prompts
              </q-tooltip>
            </q-btn>

            <q-btn size="11px" dense flat label="Quick command..." no-caps padding="4px 6px" class="bg-theme-primary bordered inscriptor-shadow-1" color="primary" :class="{ 'text-primary': showPrompts }" @click="quickInlinePromptShown = true" v-if="!quickInlinePromptShown && quickInlineCommandPrompts && quickInlineCommandPrompts.length > 0" :loading="quickCommandRunning">
            </q-btn>
          </div>
          <div class="bg-theme-primary">
            <template v-if="quickInlinePromptShown">
              <q-card class="q-ml-xs hoverable-card idea-card gradient-variation-1 q-pa-xs no-p-margin" style="min-width: 300px; max-width: 500px;">
                <div class="row">
                  <div class="col">
                    <q-input autogrow class="q-ml-sm text-caption" v-model="quickInlinePromptInput" :shadow-text="quickInlinePromptInput?.length === 0 ? 'enter command or question...' : ''" dense flat borderless autofocus @keydown="quickInlinePromptKeydown"/>
                  </div>
                  <div class="col-auto flex items-center">
                    <q-btn size="11px" dense flat no-caps padding="4px 6px" icon="mdi-close" color="primary" @click="quickInlinePromptShown = false" />
                    <q-btn v-if="quickInlineCommandPrompts && quickInlineCommandPrompts.length > 1" size="11px" dense flat no-caps padding="4px 6px" :icon="currentQuickInlinePrompt?.icon || 'mdi-robot-outline'" color="primary">
                      <q-menu>
                        <q-list dense>
                          <q-item v-for="prompt in quickInlineCommandPrompts" :key="prompt.id" clickable v-close-popup @click="selectedQuickInlinePrompt = prompt" :active="currentQuickInlinePrompt?.id === prompt.id">
                            <q-item-section avatar>
                              <q-icon :name="prompt.icon || 'mdi-robot-outline'" :color="prompt.color" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label class="text-caption">{{ prompt.title }}</q-item-label>
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                      <q-tooltip :delay="500">
                        Select prompt
                      </q-tooltip>
                    </q-btn>
                    <q-btn size="11px" dense flat no-caps padding="4px 6px" icon="mdi-dots-vertical" color="primary">
                      <q-popup-proxy transition-show="jump-down" transition-hide="fade" anchor="bottom left" self="top left" :offset="[0, 10]" @before-show="onOpenInlinePromptSettings" @hide="onCloseInlinePromptSettings">
                        <q-card class="" flat style="min-width: 400px; max-width: 500px;">
                          <q-card-section class="q-pb-none text-subtitle2">
                            Prompt Settings
                          </q-card-section>
                          <q-card-section>
                            <PromptContextSelector />
                          </q-card-section>
                        </q-card>
                      </q-popup-proxy>
                    </q-btn>
                  </div>
                </div>
              </q-card>
            </template>
          </div>
        </div>
        <div class="row " v-if="quickCommandTemporaryResult.length > 0">
          <PromptResult v-if="quickCommandTemporaryPromptResult" :promptResult="quickCommandTemporaryPromptResult" type="inline" :has-close="true" @close="closeQuickPromptResult" :insert-func="insertQuickPromptResult" @replace-self="replacePromptResult" :show-prompt-info="false"  disable-followup-actions/>
          <q-card v-else style="width: 400px; min-height: 50px;" class="hoverable-card idea-card gradient-variation-1 q-pa-xs no-p-margin">
            <div class="prompt-actions sticky-top">
              <div class="row no-wrap ellipsis">
                <div class="col-auto">
                  <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-chevron-double-up" @click="insertFromQuickCommand('inline')" :loading="quickCommandRunning" class="hoverable-btn-semi">
                    <q-tooltip :delay="1000">
                      Click to insert
                    </q-tooltip>
                  </q-btn>
                </div>
                <div class="col" />
                <div class="col-auto">
                  <q-btn color="grey-7" flat unelevated size="sm" icon="mdi-close" @click="quickCommandTemporaryResult = ''" class="hoverable-btn-semi">
                  </q-btn>
                </div>
              </div>
            </div>
            <q-card-section>
              <div v-html="markdownToHtml(quickCommandTemporaryResult)" />
            </q-card-section>
          </q-card>
        </div>

      </div>

    </floating-menu>
  </div>

  <div v-if="editor" class="q-mb-md sticky" :class="layoutStore.darkMode ? '' : 'inscriptor-shadow-1'">
    <q-card class="row justify-center q-gutter-x-xs " bordered flat>
      <div class="col-auto">
        <q-btn size="11px" dense flat icon="format_bold" @click="editor.chain().focus().toggleBold().run()" :class="{ 'text-grey-5': !editor.isActive('bold'), 'text-primary': editor.isActive('bold') }" />
      </div>
      <div class="col-auto">
        <q-btn size="11px" dense flat icon="format_italic"  @click="editor.chain().focus().toggleItalic().run()" :class="{ 'text-grey-5': !editor.isActive('italic'), 'text-primary': editor.isActive('italic') }"/>
      </div>
      <div class="col-auto">
        <q-btn-dropdown size="11px" dense flat label="Style" class="text-grey-5">
          <q-list>
            <q-item clickable v-close-popup @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'text-grey-5': !editor.isActive('heading', { level: 1 }), 'text-primary': editor.isActive('heading', { level: 1 }) }">
              <q-item-section>
                <q-item-label>Heading 1</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'text-grey-5': !editor.isActive('heading', { level: 2 }), 'text-primary': editor.isActive('heading', { level: 2 }) }">
              <q-item-section>
                <q-item-label>Heading 2</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'text-grey-5': !editor.isActive('heading', { level: 3 }), 'text-primary': editor.isActive('heading', { level: 3 }) }">
              <q-item-section>
                <q-item-label>Heading 3</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

      <div class="col-auto">
        <q-btn size="11px" dense flat icon="mdi-unfold-more-horizontal"  @click="!editor.isActive('details') ? editor.chain().focus().setDetails().run() : editor.chain().focus().unsetDetails().run()" :class="{ 'text-grey-5': !editor.isActive('details'), 'text-primary': editor.isActive('details') }">
          <q-tooltip :delay="500">
            Make collapsible
          </q-tooltip>
        </q-btn>
      </div>


      <div class="col-auto">
        <q-btn size="11px" dense flat icon="code"  @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'text-grey-5': !editor.isActive('codeBlock'), 'text-primary': editor.isActive('codeBlock') }"/>
      </div>

      <div class="col-auto">
        <q-btn size="11px" dense flat icon="mdi-image" class="text-grey-5">
          <q-popup-proxy v-model="imageUploadPopupOpen" >
            <q-card style="min-width: 400px;">
              <q-card-section>
                <div class="text-subtitle2 q-mb-md">Insert Image</div>

                <div class="q-gutter-y-md">
                  <q-btn
                    flat
                    no-caps
                    color="primary"
                    icon="mdi-image-outline"
                    label="Upload from File"
                    class="full-width"
                    @click="handleUploadImageFromFile"
                    :loading="uploadingImage"
                  />

                  <q-separator />

                  <div>
                    <q-input
                      v-model="imageUrlInput"
                      label="Enter URL to image..."
                      dense
                      outlined
                      placeholder="https://example.com/image.jpg"
                      @keyup.enter="handleUploadImageFromUrl"
                    >
                      <template v-slot:append>
                        <q-btn
                          flat
                          dense
                          icon="mdi-upload"
                          color="primary"
                          @click="handleUploadImageFromUrl"
                          :loading="uploadingImage"
                          :disable="!imageUrlInput || imageUrlInput.trim().length === 0"
                        />
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-popup-proxy>
        </q-btn>
      </div>

      <q-separator vertical class="q-ml-sm" />

      <div class="col-auto q-ml-sm">
        <q-btn size="11px" dense flat icon="mdi-undo" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().chain().focus().undo().run()" class="text-primary" />
      </div>
      <div class="col-auto">
        <q-btn size="11px" dense flat icon="mdi-redo" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().chain().focus().redo().run()" class="text-primary" />
      </div>

      <q-separator vertical class="q-ml-sm" />

      <div class="col text-grey-5 text-caption flex items-center justify-center no-wrap ellipsis q-mx-md" ref="fileInfo">

        <span v-if="!fileInfoHover"><q-icon name="info_outline"></q-icon></span>

        <transition
          appear
          enter-active-class="animated fadeIn slower"
        >
          <span v-if="fileInfoHover">
            ~{{ promptStore.currentTokensCount }} tokens
            <span v-if="layoutStore.getMaxFileSize() < 30000 && fileStore.projectSettings.syncToCloud">&nbsp;|&nbsp;{{ promptStore.currentCharsCount }}/{{ layoutStore.getMaxFileSize() }} chars</span>
          </span>
        </transition>

        <q-chip dense v-if="fileStore.projectSettings.syncToCloud && promptStore.currentCharsCount >= layoutStore.getMaxFileSize()" color="negative" text-color="white" label="Max file size for your subscription plan reached." icon="mdi-exclamation-thick" class="text-caption" clickable @click="layoutStore.showUserDialog" />
      </div>

      <div class="col-auto bg-accent-opaque row rounded-borders q-px-sm">
        <div class="col-auto">
          <q-btn size="11px" id="togglePrompts" dense flat  icon="mdi-creation-outline" class="text-accent" :class="{ 'text-primary': showPrompts }">
            <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" anchor="bottom start">
              <q-card v-show="showPrompts">
                <PromptSelector prompt-types="insert" @promptClick="promptClick" />
              </q-card>
            </q-popup-proxy>
            <q-tooltip  :delay="1000">
              AI prompts
            </q-tooltip>
          </q-btn>
        </div>

        <div class="col-auto q-ml-sm" v-if="promptStore.projectAgents.length > 0" ref="agentSelectorButton" id="agentSelector">
          <q-btn
            v-if="!isAgentActive"
            size="11px"
            dense
            flat
            :icon="agentIcon"
            :class="agentButtonClass"
            :disable="isAgentActive"
          >
            <!-- Spinner overlay when processing -->
            <q-spinner-oval
              v-if="agentState === 'processing'"
              size="16px"
              color="orange"
              class="absolute-center"
            />

            <q-menu v-if="!isAgentActive">
              <q-list>
                <q-item v-for="agent in promptStore.projectAgents" :key="agent.id" clickable v-close-popup @click="runProjectAgent(agent)">
                  <q-item-section>
                    <q-item-label class="flex items-center text-caption">
                      <q-icon :name="(promptStore.getPromptById(agent.promptId)?.icon?.length > 0) ? promptStore.getPromptById(agent.promptId).icon : 'mdi-robot-outline'" :color="(promptStore.getPromptById(agent.promptId)?.color?.length > 0) ? promptStore.getPromptById(agent.promptId).color : undefined" size="15px" class="q-mr-sm" />
                      {{ agent.title }}
                    </q-item-label>
                    <q-item-label caption>{{ agent.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-tooltip :delay="1000">
              {{ agentTooltip }}
            </q-tooltip>
          </q-btn>

          <!-- Stop button when agent is active -->
          <q-btn
            v-if="isAgentActive"
            size="11px"
            dense
            flat
            icon="mdi-stop"
            class="text-negative q-ml-xs"
            @click="stopAgentProcessing"
            no-caps
            style="min-width: 120px;"
          >
            Stop AI Agent<AnimatedDots :speed="300" fixed-width="10px" />
          </q-btn>

          <q-popup-proxy
            :model-value="agentSelectorButtonHovered"
            v-if="aiAgentStore.agentStatus"
            :offset="[10, 10]"
          >
            <q-card style="min-width: 300px; max-width: 400px;">
              <q-card-section class="q-pb-sm">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">
                  {{ aiAgentStore.projectAgent?.title || 'AI Agent' }}
                </div>
                <div class="text-body2 text-grey-8">
                  {{ aiAgentStore.agentStatus }}
                </div>
              </q-card-section>

              <q-card-section class="" style="max-height: 600px; ">
                <div class="text-caption text-weight-medium q-mb-sm">History:</div>
                <div v-for="(action, index) in aiAgentStore.agentActionHistory.slice().reverse()"
                     :key="index"
                     class="q-mb-sm text-body2"
                >
                  <span class="text-caption text-grey-6">{{ action.timestamp }}</span>
                  <span class="text-caption q-ml-sm">{{ action.action }}</span>
                  <span class="text-caption q-ml-sm" v-if="action.reasoning">({{ action.reasoning }})</span>
                </div>
              </q-card-section>
            </q-card>
          </q-popup-proxy>
        </div>
      </div>

      <div class="col-auto q-ml-md">
        <q-btn size="11px" dense flat icon="mdi-alpha-a-box" @click="toggleAiBubbleMenu" class="" :class="{ 'text-primary': aiBubbleMenu, 'text-grey-5': !aiBubbleMenu }">
          <q-tooltip>
            Toggle Inline AI bubble menu
          </q-tooltip>
        </q-btn>
      </div>

      <div class="col-auto">
        <q-btn size="11px" dense flat icon="mdi-alpha-g-box" @click="toggleAutomaticCorrections" class="" :class="{ 'text-primary': automaticCorrections, 'text-grey-5': !automaticCorrections }">
          <q-tooltip>
            Toggle Display Grammar Errors
          </q-tooltip>
        </q-btn>
      </div>

      <div class="col-auto">
        <q-btn size="11px" dense flat icon="mdi-alpha-c-box" @click="toggleAutoComplete" class="" :class="{ 'text-primary': autoCompleteEnabled, 'text-grey-5': !autoCompleteEnabled }">
          <q-tooltip>
            Toggle AI Auto complete
          </q-tooltip>
        </q-btn>
      </div>

    </q-card>
  </div>

  <div class="flex justify-center">
    <div class="full-width" :class="windowWidthClases">
      <transition
        appear
        enter-active-class="animated fadeIn slow"
        leave-active-class="animated fadeOut"
      >
        <q-card v-show="layoutStore.promptSelectorManuallyOpened" class="q-mb-md" id="manualPromptSelector">
          <PromptSelector prompt-types="selection" @promptClick="promptClick" />
        </q-card>

      </transition>

      <editor-content :class="writeClasses" class="no-outline" :editor="editor" :spellcheck="spellcheck" />
      <div class="text-editor-bottom" @click="onClickBelowEditor" />
    </div>
  </div>

  <bubble-menu
    v-if="editor"
    :editor="editor"
    :tippy-options="{
      placement: 'bottom-start',
      offset: [0, 12],
      duration: [200, 150],
      zIndex: 10000,
      interactive: true,
      interactiveBorder: 10,
      interactiveDebounce: 75,
      hideOnClick: false,
      trigger: 'manual',
      arrow: true,
      theme: 'light-border',
      maxWidth: 500,
      appendTo: 'parent'
    }"
    :should-show="shouldShowConfirmationWidget"
  >
    <AgentConfirmationWidget
      v-if="confirmationWidgetData && !aiAgentStore.projectAgentUserAborted"
      :widget-data="confirmationWidgetData"
      @accept="aiAgentStore.onWidgetAccept"
      @reject="aiAgentStore.onWidgetReject"
      @chat="aiAgentStore.onWidgetChat"
      @undo="aiAgentStore.onWidgetUndo"
    />
  </bubble-menu>


</template>

<script setup>
import {getText, getTextSerializersFromSchema, useEditor} from '@tiptap/vue-3'
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
} from '@tiptap/vue-3'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import History from '@tiptap/extension-history'
import Text from '@tiptap/extension-text'
import Image from '@tiptap/extension-image'
import {computed, onDeactivated, onMounted, ref, watch} from "vue";
import {usePromptStore} from "stores/prompt-store";
import {useFileStore} from "stores/file-store";
import {useEditorStore} from "stores/editor-store";
import {HardBreak} from "@tiptap/extension-hard-break";
import {
  executePromptClick2
} from "src/common/helpers/promptHelper";
import {Blockquote} from "@tiptap/extension-blockquote";
import {
  convertTextsToChat,
  editorTextsBetween, getAllMarkdown, getAllText, getEditor, getEditorSelection,
  getSelectedText, getSelectedTextExpanded
} from "src/common/utils/editorUtils";
import {groupBy} from "src/common/utils/arrayUtils";
import {Bold} from "@tiptap/extension-bold";
import {Heading} from "@tiptap/extension-heading";
import {Link} from "@tiptap/extension-link";
import {Underline} from "@tiptap/extension-underline";
import {Italic} from "@tiptap/extension-italic";
import {CodeBlock} from "@tiptap/extension-code-block";
import {useLayoutStore} from "stores/layout-store";
import {useDebounceFn, useElementHover} from "@vueuse/core";
import PromptSelector from "components/Common/PromptSelector/PromptSelector.vue";
import {CharacterCount} from "@tiptap/extension-character-count";
import {OrderedList} from "@tiptap/extension-ordered-list";
import {BulletList} from "@tiptap/extension-bullet-list";
import {ListItem} from "@tiptap/extension-list-item";
import {selectedTextPromptInput} from 'src/common/resources/promptContexts';
import {markdownToHtml, truncate} from 'src/common/utils/textUtils';
import PromptResult from 'components/RightMenu/PromptResult.vue';
import {CustomParagraph} from 'src/common/tipTap/CustomParagraph';
import {AutoCompletePlugin} from 'src/common/tipTap/AutoComplete';
import {AgentDecorationPlugin} from 'src/common/tipTap/AgentDecorationPlugin';
import PromptContextSelector from 'components/Common/PromptSelector/PromptContextSelector.vue';
import {HorizontalRule} from '@tiptap/extension-horizontal-rule';
import {useAiAgentStore} from "stores/aiagent-store";
import AgentConfirmationWidget from 'src/components/Common/AgentConfirmationWidget.vue';
import AnimatedDots from 'src/components/Common/AnimatedDots.vue';
import {UniqueID} from '@tiptap/extension-unique-id';
import {uploadImageFromFile, uploadImageFromUrl} from 'src/common/helpers/imageHelper';
import {useCurrentUser} from 'vuefire';
import { Details, DetailsContent, DetailsSummary } from '@tiptap/extension-details'

const promptStore = usePromptStore();
const fileStore = useFileStore();
const editorStore = useEditorStore();
const layoutStore = useLayoutStore();
const aiAgentStore = useAiAgentStore();

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const automaticCorrections = ref(true);
const autoComplete = ref('on'); // off
const autoCorrect = ref('on'); // off
const autoCapitalize = ref('default'); // off
const spellcheck = ref('true');
const wordFinderOpen = ref(false);
const quickInlinePromptInput = ref('');
const quickInlinePromptShown = ref(false);
const selectedQuickInlinePrompt = ref(null);

const quickSelectionPromptInput = ref('');
const quickSelectionPromptShown = ref(false);
const selectedQuickSelectionPrompt = ref(null);

const aiBubbleMenu = ref(true);

const autoCompleteEnabled = ref(true);

const imageUploadPopupOpen = ref(false);
const imageUrlInput = ref('');
const uploadingImage = ref(false);

function toggleAiBubbleMenu() {
  aiBubbleMenu.value = !aiBubbleMenu.value;
}

function toggleAutoComplete() {
  autoCompleteEnabled.value = !autoCompleteEnabled.value;
  editorStore.setAutoCompleteText('');
}

function toggleAutomaticCorrections() {
  if(automaticCorrections.value === false) {
    autoComplete.value = 'on';
    autoCorrect.value = 'on';
    autoCapitalize.value = 'default';
    spellcheck.value = 'true';

    automaticCorrections.value = true;
  } else {
    autoComplete.value = 'off';
    autoCorrect.value = 'off';
    autoCapitalize.value = 'off';
    spellcheck.value = 'false';

    automaticCorrections.value = false;
  }
}

function onOpenInlinePromptSettings() {
  const prompt = currentQuickInlinePrompt.value;
  if (!prompt) return;

  const previousPromptContext = promptStore.getSavedPromptRunData(prompt, 'lastContext');
  if(previousPromptContext) {
    promptStore.promptContext = [...previousPromptContext];
  } else {
    promptStore.promptContext = [];
  }
}

function onCloseInlinePromptSettings() {
  const prompt = currentQuickInlinePrompt.value;
  if (!prompt) return;

  promptStore.setSavedPromptRunData(prompt, 'lastContext', promptStore.promptContext ?? []);
}

function onOpenSelectionPromptSettings() {
  const prompt = currentQuickSelectionPrompt.value;
  if (!prompt) return;

  const previousPromptContext = promptStore.getSavedPromptRunData(prompt, 'lastContext');
  if(previousPromptContext) {
    promptStore.promptContext = [...previousPromptContext];
  } else {
    promptStore.promptContext = [];
  }
}

function onCloseSelectionPromptSettings() {
  const prompt = currentQuickSelectionPrompt.value;
  if (!prompt) return;

  promptStore.setSavedPromptRunData(prompt, 'lastContext', promptStore.promptContext ?? []);
}

function quickInlinePromptKeydown(e) {
  if (e === void 0) return

  if (e.keyCode === 13 && quickInlinePromptShown.value && quickInlinePromptInput.value.length > 0) {
    console.log(quickInlinePromptInput.value);

    triggerQuickPrompt('inline', '' + quickInlinePromptInput.value);

    quickInlinePromptShown.value = false;
    quickInlinePromptInput.value = '';
    e.preventDefault();
  }
}

function quickSelectionPromptKeydown(e) {
  if (e === void 0) return

  if (e.keyCode === 13 && quickSelectionPromptShown.value && quickSelectionPromptInput.value.length > 0) {
    triggerQuickPrompt('selection', '' + quickSelectionPromptInput.value);

    quickSelectionPromptShown.value = false;
    quickSelectionPromptInput.value = '';
    e.preventDefault();
  }
}

const showPrompts = ref(true);
const currentInsertPromptCategory = ref('');
const currentSelectionPromptCategory = ref('');

const fileInfo = ref(null);
const fileInfoHover = useElementHover(fileInfo)

const confirmationWidgetData = computed(() => aiAgentStore.confirmationWidgetData);

const shouldShowDefaultBubbleMenu = ({ editor, view, state, from, to }) => {
  const { selection } = state;
  const { empty } = selection;

  if(empty || !selection) {
    return false;
  }

  // Hide default bubble menu only if current selection overlaps with paragraph that has pending confirmation
  if (!aiAgentStore.projectAgentUserAborted && confirmationWidgetData.value && confirmationWidgetData.value.paragraphRange) {
    const targetRange = confirmationWidgetData.value.paragraphRange;

    // Simplified overlap detection: ranges overlap if they're NOT completely separate
    // Two ranges are separate if: from >= targetRange.to OR to <= targetRange.from
    // So they overlap if: !(from >= targetRange.to || to <= targetRange.from)
    const overlapsWithPendingParagraph = !(from >= targetRange.to || to <= targetRange.from);

    console.log('BubbleMenu overlap check:', {
      selection: { from, to },
      targetRange,
      overlaps: overlapsWithPendingParagraph,
    });

    if (overlapsWithPendingParagraph) {
      console.log('Hiding default bubble menu due to overlap with pending confirmation');
      return false; // Hide default bubble menu for the paragraph with pending confirmation
    }
  }

  console.log('Showing default bubble menu for selection:', { from, to });
  return true; // Show default bubble menu for all other selections
};

// shouldShow function for Agent Confirmation BubbleMenu
function shouldShowConfirmationWidget ({ editor, view, state, from, to }) {
  if (!confirmationWidgetData.value || confirmationWidgetData.value.hidden || aiAgentStore.projectAgentUserAborted) {
    return false;
  }

  const targetRange = confirmationWidgetData.value.paragraphRange;
  // Show when selection overlaps with our target paragraph
  const overlaps = (from >= targetRange.from && from <= targetRange.to) ||
                   (to >= targetRange.from && to <= targetRange.to) ||
                   (from <= targetRange.from && to >= targetRange.to);

  return overlaps;
}
const emits = defineEmits(['update:modelValue']);
const writeClasses = computed(() => {
  return {
    'write-serif': (fileStore.selectedFile?.settings?.fontType ?? 'serif') === 'serif',
    'write-sans-serif': fileStore.selectedFile?.settings?.fontType === 'sans-serif',
    'write-monospace': fileStore.selectedFile?.settings?.fontType === 'monospace',
    'write-small': fileStore.selectedFile?.settings?.fontSize === 'small',
    'write-medium': (fileStore.selectedFile?.settings?.fontSize ?? 'medium') === 'medium',
    'write-large': fileStore.selectedFile?.settings?.fontSize === 'large',

    'text-editor': (fileStore.selectedFile?.settings?.editorType ?? 'regular') === 'regular',
    'text-editor-condensed': fileStore.selectedFile?.settings?.editorType === 'condensed',
    'text-editor-non-indented': fileStore.selectedFile?.settings?.editorType === 'non-indented',

    'text-editor-height': true,

    'text-editor-base': true,
  }
});

const windowWidthClases = computed(() => {
  return {
    'text-editor-width-regular': (fileStore.selectedFile?.settings?.windowWidth ?? 'regular') === 'regular',
    'text-editor-width-extended': (fileStore.selectedFile?.settings?.windowWidth ?? 'regular') === 'extended',
    'text-editor-width-fullwidth': (fileStore.selectedFile?.settings?.windowWidth ?? 'regular') === 'fullwidth',
  }
})

computed(() => {
  const prompts = promptStore.insertPrompts.filter(p => promptStore.canPrompt(p)).filter(p => p.category === currentInsertPromptCategory.value || (currentInsertPromptCategory.value === '' && !p.category))

  const grouping = groupBy(prompts, 'modelId');

  return groupByToArray(grouping);
});
function groupByToArray(grouping) {
  const retValue = [];

  for(const key in grouping) {
    retValue.push({
      modelId: key,
      prompts: grouping[key]
    });
  }

  return retValue;
}

function shouldShowFloatingMenu(props) {
  const {view, state } = props;
  const { selection } = state
  const { $anchor, empty } = selection
  const isRootDepth = $anchor.depth === 1

  const isEmptyTextBlock = $anchor.parent.isTextblock && !$anchor.parent.type.spec.code && !$anchor.parent.textContent && $anchor.parent.childCount === 0 && !getTextContent($anchor.parent)

  if (
    !view.hasFocus()
    || !empty
    //|| !isRootDepth
    //|| !isEmptyTextBlock
    || !this.editor.isEditable
  ) {
    return false
  }

  return true
}

function getTextContent(node) {
  return getText(node, { textSerializers: getTextSerializersFromSchema(editor.value.schema) })
}

watch(() => props.modelValue, (value) => {
  // HTML
  const isSame = editor.value.getHTML() === value

  // JSON
  // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

  if (isSame) {
    return
  }

  editor.value.commands.setContent(value, false);

  promptStore.updateTokens();
  promptStore.setCharsCount(editor.value.storage.characterCount.characters());
})



const characterLimit = computed(() => {
  return layoutStore.getMaxFileSize();
})

const editor = useEditor({
  extensions: [
    Document,
    Paragraph,
    Text,
    EditorContent,
    BubbleMenu,
    FloatingMenu,
    Image,
    History,
    HardBreak,
    Link,
    Underline,
    Italic,
    Bold,
    Details.configure({
      persist: true,
      HTMLAttributes: {
        class: 'details',
      },
    }),
    DetailsContent,
    DetailsSummary,
    HorizontalRule,
    /*UniqueID.configure({
      generateID: ({ node }) => `${node.type.name}-${uuidv4()}`,
      types: ['heading', 'paragraph'],
    }),*/
    CodeBlock,
    CharacterCount.configure({
      limit: characterLimit.value,
    }),
    ListItem,
    BulletList.configure({
      keepMarks: true,
    }),
    OrderedList.configure({
      keepMarks: true,
    }),
    Heading.configure({
      levels: [1, 2, 3],
    }),
    CustomParagraph,
    AutoCompletePlugin.configure({
      autocompleteValue: getAutocompleteResult,
      includeChildren: true,
    }),
    AgentDecorationPlugin.configure({
      pendingClass: 'agent-pending',
      processingClass: 'agent-processing',
      completedClass: 'agent-completed',
      errorClass: 'agent-error',
    }),
    Blockquote.configure({
      HTMLAttributes: {
        class: 'user-message',
      },
    }),
  ],
  content: props.modelValue,
  onUpdate: () => {

    emits('update:modelValue', editor.value.getHTML())
    promptStore.updateTokens();
    promptStore.setCharsCount(editor.value.storage.characterCount.characters());
    editorStore.setAutoCompleteText('');
  },
  onSelectionUpdate: async () => {

    editorStore.setAutoCompleteText('');
    scheduleAutocomplete();

    quickSelectionPromptShown.value = false;
    quickInlinePromptShown.value = false;

    // only if anything is selected
    if(editor.value.state.selection.empty) {
      return;
    }

    //layoutStore.setAnalysisWillBeTriggered(1000);
    //await debouncedFn();
  },
});

//const debouncedFn = useDebounceFn(() => {
//  promptSelectionAnalysisPrompts();
//}, 1500)

onMounted(() =>{
  editorStore.setEditor(editor.value);
  promptStore.updateTokens();
  promptStore.setCharsCount(editor.value.storage.characterCount.characters());
})

onDeactivated(() => {
  editorStore.setEditor(null);
});

function getPredefinedPrompts(type) {
  const promptId = promptStore.getPredefinedPromptId(type);

  if(!promptId || promptId.length === 0) {
    return [];
  }

  const retValue = [];

  for (const id of promptId) {
    const prompt = promptStore.getPromptById(id);

    retValue.push(prompt);
  }

  return retValue;
}

const predefinedWordFinderPrompts = computed(() => {
  return getPredefinedPrompts('Word Finder');
});

const quickInlineCommandPrompts = computed(() => {
  return getPredefinedPrompts('Quick Insert Prompt');
})

const quickSelectionCommandPrompts = computed(() => {
  return getPredefinedPrompts('Quick Selection Prompt');
})

const currentQuickInlinePrompt = computed(() => {
  const prompts = quickInlineCommandPrompts.value;
  if (!prompts || prompts.length === 0) return null;

  // If selected prompt exists in the list, use it, otherwise use first
  if (selectedQuickInlinePrompt.value && prompts.find(p => p.id === selectedQuickInlinePrompt.value.id)) {
    return selectedQuickInlinePrompt.value;
  }

  // Default to first prompt
  return prompts[0];
})

const currentQuickSelectionPrompt = computed(() => {
  const prompts = quickSelectionCommandPrompts.value;
  if (!prompts || prompts.length === 0) return null;

  // If selected prompt exists in the list, use it, otherwise use first
  if (selectedQuickSelectionPrompt.value && prompts.find(p => p.id === selectedQuickSelectionPrompt.value.id)) {
    return selectedQuickSelectionPrompt.value;
  }

  // Default to first prompt
  return prompts[0];
})

// Watch for changes to available prompts and initialize selected prompt if needed
watch(quickInlineCommandPrompts, (prompts) => {
  if (prompts && prompts.length > 0 && !selectedQuickInlinePrompt.value) {
    selectedQuickInlinePrompt.value = prompts[0];
  }
}, { immediate: true })

watch(quickSelectionCommandPrompts, (prompts) => {
  if (prompts && prompts.length > 0 && !selectedQuickSelectionPrompt.value) {
    selectedQuickSelectionPrompt.value = prompts[0];
  }
}, { immediate: true })

const autocompletePrompts = computed(() => {
  return getPredefinedPrompts('Auto Complete');
})

const autocompleteRunning = ref(false);

const autocompleteDebounceFn = useDebounceFn(async () => {
  await runAutocomplete();
}, 400)

async function scheduleAutocomplete() {
  await autocompleteDebounceFn();
}

function createAutocompleteInput() {
  const currentPosition = editor.value.state.selection.head;
  const autoCompleteInput = {
    position: currentPosition,
    text: getAllText(),
  }

  return autoCompleteInput;
}

function areAutocompleteInputsSame(input1, input2) {
  if(!input1 || !input2) return false; // one of them is not set

  return input1.position == input2.position && input1.text == input2.text;
}

function shouldRunAutocomplete() {
  if(!editor.value) return false;
  if(!autoCompleteEnabled.value) return false;

  // Check if editor is focused
  if(!editor.value.view.hasFocus()) {
    console.log('Autocomplete not triggered: editor not focused');
    return false;
  }

  const selectedText = getSelectedText();
  if(selectedText && selectedText.length > 0) {
    //console.log('Autocomplete not triggered: selected text');
    return false;
  }

  const autocompleteInput = createAutocompleteInput();

  // if the autocomplete is running, we need to check if the input is the same
  if(autocompleteRunning.value) {
    if(editorStore.pendingAutocompleteTextInput) {
      if(areAutocompleteInputsSame(editorStore.pendingAutocompleteTextInput, autocompleteInput)) {
        //console.log('Autocomplete not triggered: already running on same input');
        return false;
      }
    }
  }

  // existing autocomplete input
  if(editorStore.autoCompleteTextInput) {
    if(areAutocompleteInputsSame(editorStore.autoCompleteTextInput, autocompleteInput)) {
      //console.log('Autocomplete not triggered: same input ALREADY CREATED');
      return false;
    }
  }

  const isInMiddleOfWord = () => {
    if (!editor.value) return false;

    const { state } = editor.value;
    const { selection } = state;
    const { $cursor } = selection;

    // We need a cursor selection
    if (!$cursor) return false;

    const textBefore = $cursor.nodeBefore?.text || '';
    const textAfter = $cursor.nodeAfter?.text || '';

    // If there's text before and after, and neither is a space, we're in the middle of a word
    const hasTextBefore = textBefore.length > 0 && !/\s$/.test(textBefore);
    const hasTextAfter = textAfter.length > 0 && !/^\s/.test(textAfter);

    return hasTextBefore && hasTextAfter;
  };

  if (isInMiddleOfWord()) {
    //console.log('Autocomplete not triggered: cursor in middle of word');
    return false;
  }

  //console.log('Autocomplete allowed');

  return true;
}

async function runAutocomplete() {
  const prompts = autocompletePrompts.value;

  //console.log('-----------');
  //console.log('Tried autocomplete');

  if(!shouldRunAutocomplete()) {
    return;
  }

  const autocompleteInput = createAutocompleteInput();

  editorStore.setPendingAutocompleteTextInput(autocompleteInput);
  autocompleteRunning.value = true;

  try {
    for (const prompt of prompts) {

      const request = {
        prompt: prompt,
        text: '',
        clear: false,
        forceBypassMoreParameters: true,
        silent: true,
        noTrim: true,
      }

      //console.log('Autocomplete started', autocompleteInput);

      const result = await executePromptClick2(request);
      if(!result) {
        return;
      }

      // sleep 1s
      //await new Promise(resolve => setTimeout(resolve, 1000));

      // input has changed
      if(!areAutocompleteInputsSame(createAutocompleteInput(), autocompleteInput)) {
        //console.log('Autocomplete dropped, inputs have changed');
        return;
      }

      //console.log('Autocomplete finished: ' + result.originalText, autocompleteInput);

      editorStore.setAutoCompleteText(result.originalText, autocompleteInput);

      // take only 1 auto complete prompt for now
      break;
    }
  } finally {
    editorStore.setPendingAutocompleteTextInput(null);
    autocompleteRunning.value = false;
  }
}

function getAutocompleteResult(node) {
  if(!editorStore.autoCompleteText) return '';
  if(editorStore.autoCompleteText.trim() === 'X') return '';
  return editorStore.autoCompleteText;
}

function insertFromQuickCommand(type) {
  replaceOrInsertWord(markdownToHtml(quickCommandTemporaryResult.value))

  quickCommandTemporaryResult.value = '';
}

const quickCommandRunning = ref(false);
const quickCommandTemporaryResult = ref('');
const quickCommandTemporaryPromptResult = ref(null);

function closeQuickPromptResult() {
  quickCommandTemporaryPromptResult.value = null;
  quickCommandTemporaryResult.value = '';
}

function replacePromptResult(result) {
  quickCommandTemporaryPromptResult.value = result;
}

function insertQuickPromptResult(result) {
  replaceOrInsertWord(markdownToHtml(result.originalText));
}

async function triggerQuickPrompt(type, command) {
  if(quickCommandRunning.value) {
    return;
  }

  quickCommandRunning.value = true;

  try {
    if(type === 'inline') {
      const prompt = currentQuickInlinePrompt.value;
      if (!prompt) return;

      const onOutput = (fullText, newText, isFinished, isError, request, result) => {
        quickCommandTemporaryResult.value = fullText;
      };

      const request = {
        prompt: prompt,
        text: command,
        clear: false,
        forceBypassMoreParameters: true,
        silent: true,
        onOutput: onOutput
      }

      const result = await executePromptClick2(request);
      quickCommandTemporaryPromptResult.value = result;

    } else if(type === 'selection') {
      const prompt = currentQuickSelectionPrompt.value;
      if (!prompt) return;

      const onOutput = (fullText, newText, isFinished, isError, request, result) => {
        quickCommandTemporaryResult.value = fullText;
      };

      const request = {
        prompt: prompt,
        text: command,
        clear: false,
        forceBypassMoreParameters: true,
        silent: true,
        userInputs: [selectedTextPromptInput],
        onOutput: onOutput
      }

      const result = await executePromptClick2(request);
      quickCommandTemporaryPromptResult.value = result;
    }
  } finally {
    quickCommandRunning.value = false;
  }
}

async function runSelectionAnalysis() {
  await promptStore.promptSelectionAnalysisPrompts(true, true);
}

async function runWordFinder(replace = true) {
  const prompts = getPredefinedPrompts('Word Finder');

  try {
    wordFinderLoading.value = true;

    let followUps;
    if(replace) {
      followUps = undefined;
      wordFinderOutput.value = null;
    } else {
      followUps = wordFinderOutput.value;
    }

    for (const prompt of prompts) {
      let message = prompt.userPrompt;

      message = message.replaceAll('$textAround', getSelectedTextExpanded(300, 300, '...') ?? '');
      message = message.replaceAll('$textOrSelection', getSelectedText() ?? '');

      const previousSuggestions = wordFinderOutput.value ?? [];
      if(previousSuggestions) {
        message = message.replaceAll('$previousSuggestions', JSON.stringify(previousSuggestions, null, 2));
      } else {
        message = message.replaceAll('$previousSuggestions', '');
      }

      //console.log(message);

      const onOutput = (fullText, newText, isFinished, isError, request, result) => {
        //console.log(fullText);
      };

      const request = {
        prompt: prompt,
        text: message,
        userPrompt: message,
        clear: false,
        forceBypassMoreParameters: true,
        silent: true,
        userInputs: [selectedTextPromptInput],
        onOutput: onOutput
      }

      const result = await executePromptClick2(request);

      try {


        //TODO to helper

        // remove ```json and ```
        const json = result.originalText.replace(/```json/g, '').replace(/```/g, '').trim();
        const newFollowUps = JSON.parse(json);

        console.log(json);

        if(!followUps) {
          followUps = newFollowUps;
        } else {
          followUps = followUps.concat(newFollowUps);
        }

      } catch (error) {
        console.error(error);
      }
    }

    // eslint-disable-next-line vue/no-mutating-props
    wordFinderOutput.value = followUps;

    wordFinderOpen.value = true;
  } finally {
    wordFinderLoading.value = false;
  }
}

function replaceOrInsertWord(text) {
  const editor = getEditor();
  if(!editor) return;

  const { from, to, empty } = getEditorSelection();

  const selectedText = getSelectedText();

  if(selectedText) {
    // if text ends with ' '
    if(selectedText.endsWith(' ') && !text.endsWith(' ')) {
      text += ' ';
    }

    if(selectedText.startsWith(' ') && !text.startsWith(' ')) {
      text = ' ' + text;
    }
  } else {
    text = ' ' + text;
  }

  const resolvedFrom = editor.state.doc.resolve(from);
  const resolvedTo = editor.state.doc.resolve(to);

  // Find the parent node and its position
  const parentNodeFrom = resolvedFrom.node(resolvedFrom.depth);
  const parentNodeTo = resolvedTo.node(resolvedTo.depth);

  // Get the start and end positions of the parent node
  const startPos = resolvedFrom.start(resolvedFrom.depth);
  const endPos = startPos + parentNodeFrom.content.size;

  // Check if the selection spans the whole node
  const isWholeNodeSelected = from === startPos && to === endPos;

  let surroundedWithPTags = isWholeNodeSelected;

  if(!empty) {
    editor
      .chain()
      .focus()
      .deleteSelection()
      .run()
  }

  editor
    .chain()
    //.focus()
    .insertContentAt(from, text,
      {
        updateSelection: false,
        parseOptions: {
          preserveWhitespace: true,
        }
      })
    .run()


  // print editor text
  console.log(getEditor()?.getHTML());
}

const wordFinderLoading = ref(false);
const wordFinderOutput = ref([]);

/*async function promptSelectionAnalysisPrompts() {

  layoutStore.setAnalysisTriggered(false);
  await promptStore.promptSelectionAnalysisPrompts();
}*/

async function promptClick(promptClickData, forceAllFileText) {
  const prompt = promptClickData.prompt;
  let text;

  // force feed all text into this prompt
  if (forceAllFileText) {
    if (prompt.promptType === "general" || prompt.promptType === "selection" || prompt.promptType === "selectionAnalysis") {
      text = getAllMarkdown();
    }
  } else {
    if (prompt.promptType === "general" || prompt.promptType === "selection" || prompt.promptType === "selectionAnalysis") {
      editor.value.chain().focus().run();
    }

    if (prompt.promptType === "chat") {
      text = getSelectedTextAsChat();
    } else {
      text = getSelectedText();

      if(text === null && (prompt.promptType === "general" || prompt.promptType === "insert")) {
        text = getAllMarkdown();
      }
    }
  }

  const request = {
    prompt: prompt,
    text: text,
    forceModelId: promptClickData.forceModelId,
    forceTemperature: promptClickData.forceTemperature,
    reasoningEffort: promptClickData.reasoningEffort,
  }

  await executePromptClick2(request);
}

function getSelectedTextAsChat() {
  const { from, to, empty } = editor.value.state.selection;

  if (empty) {
    return null;
  }

  const texts = editorTextsBetween(editor.value.state.doc, { from, to }, '\n\n', '\n');
  let messages = convertTextsToChat(texts);

  return messages;
}

function onClickBelowEditor(event) {
  console.log('onClickBelowEditor', event);
  // append new line if there is no blank line at the end
  const text = editor.value.getText();
  console.log(text);
  if(!text.endsWith('\n')) {
    editor.value.commands.insertContentAt(editor.value.state.doc.content.size - 1, '<p></p>', {
      updateSelection: true,
    })
  }
  editor.value.chain().focus().run();
}

// Agent status computed properties
const agentState = computed(() => aiAgentStore.agentState);
const isAgentActive = computed(() => aiAgentStore.isAgentActive);
const agentSelectorButton = ref();
const agentSelectorButtonHovered = useElementHover(agentSelectorButton);

const agentIcon = computed(() => {
  switch (agentState.value) {
    case 'processing':
      return 'mdi-robot';
    case 'waiting_for_user':
      return 'mdi-robot-excited-outline';
    default:
      return 'mdi-robot-outline';
  }
});

const agentButtonClass = computed(() => {
  switch (agentState.value) {
    case 'processing':
      return 'text-orange';
    case 'waiting_for_user':
      return 'text-blue';
    default:
      return 'text-accent';
  }
});

const agentTooltip = computed(() => {
  switch (agentState.value) {
    case 'processing':
      return 'Agent is processing paragraphs...';
    case 'waiting_for_user':
      return 'Agent is waiting for your confirmation';
    default:
      return 'Run Project AI Agent';
  }
});

async function runProjectAgent(agent) {
  aiAgentStore.openProjectAgent(agent);
}

function stopAgentProcessing() {
  try {
    aiAgentStore.stopAgentProcessing();
  } catch (error) {
    console.error('Failed to stop agent processing:', error);
  }
}

async function handleUploadImageFromFile() {
  const user = useCurrentUser();
  if (!user.value) {
    console.error('No user logged in');
    return;
  }

  try {
    uploadingImage.value = true;
    const imageUrl = await uploadImageFromFile(user.value);

    if (imageUrl) {
      editor.value.chain().focus().setImage({ src: imageUrl }).run();
      imageUploadPopupOpen.value = false;
    }
  } catch (error) {
    console.error('Failed to upload image:', error);
  } finally {
    uploadingImage.value = false;
  }
}

async function handleUploadImageFromUrl() {
  const user = useCurrentUser();
  if (!user.value) {
    console.error('No user logged in');
    return;
  }

  if (!imageUrlInput.value || !imageUrlInput.value.trim()) {
    return;
  }

  try {
    uploadingImage.value = true;
    const imageUrl = await uploadImageFromUrl(user.value, imageUrlInput.value);

    if (imageUrl) {
      editor.value.chain().focus().setImage({ src: imageUrl }).run();
      imageUploadPopupOpen.value = false;
      imageUrlInput.value = '';
    }
  } catch (error) {
    console.error('Failed to upload image from URL:', error);
  } finally {
    uploadingImage.value = false;
  }
}

</script>

<style lang="scss">


.user-message {
  p {
    padding: 8px 0px 0px 0px;
    margin: 0px 0px 8px 0px;
  }
  padding: 0.5rem;
  border-radius: 0.5rem;
  border-left: 2px solid;
  margin: 0.5rem 0;
}


.user-message::before {
  content: '';
  font-weight: bold;
}


.bubble-menu {
  display: flex;
}

.has-focus {
  border-radius: 3px;
}


.floating-menu {
  display: flex;
}

.agent-confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}
</style>
