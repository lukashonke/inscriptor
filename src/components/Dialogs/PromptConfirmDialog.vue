<template>
  <q-dialog v-model="promptPreviewShown">
    <q-card style="min-width: 800px;">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ prompt.title }} prompt preview</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <template v-for="(textMessage, index) in [...promptPreview.textMessages]" :key="index">
        <q-card-section>
          <div class="text-subtitle2 row">
            <div class="col">
              {{ textMessage.type }} message:
            </div>
            <div class="col-auto">
              <q-btn class="q-ml-sm" flat dense icon="las la-ellipsis-h" size="10px" >
                <q-menu anchor="center middle">
                  <q-list dense>
                    <q-item
                      @click="textMessage.type = 'system'"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Set as 'system' message</q-item-section>
                    </q-item>
                    <q-item
                      @click="textMessage.type = 'user'"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Set as 'user' message</q-item-section>
                    </q-item>
                    <q-item
                      @click="textMessage.type = 'assistant'"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Set as 'assistant' (AI) message</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      @click="moveTextMessage(textMessage, -1)"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Move Up</q-item-section>
                    </q-item>
                    <q-item
                      @click="moveTextMessage(textMessage, 1)"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Move Down</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      @click="promptPreview.textMessages.splice(index, 1)"
                      dense
                      clickable
                      v-close-popup
                    >
                      <q-item-section>Delete message</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
                <q-tooltip>
                  Edit this message
                </q-tooltip>
              </q-btn>
            </div>
          </div>
          <div class="text bordered write-serif" style="max-height: 400px; overflow-y: auto">
            <q-input v-model="textMessage.text" dense filled autogrow />
          </div>
        </q-card-section>
      </template>
      <div class="text-center">
        <q-btn class="q-ml-md text-grey-7" unelevated dense icon="mdi-plus" size="10px" style="width: 100px" >
          <q-menu>
            <q-list dense>
              <q-item
                @click="addMessage('system')"
                dense
                clickable
                v-close-popup
              >
                <q-item-section>Add 'system' message</q-item-section>
              </q-item>
              <q-item
                @click="addMessage('user')"
                dense
                clickable
                v-close-popup
              >
                <q-item-section>Add 'user' message</q-item-section>
              </q-item>
              <q-item
                @click="addMessage('assistant')"
                dense
                clickable
                v-close-popup
              >
                <q-item-section>Add 'assistant' (AI) message</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <q-tooltip>
            Add custom message
          </q-tooltip>
        </q-btn>
      </div>
      <q-card-section>
        <div class="text-subtitle2">AI response:</div>
        <div class="text bordered q-pa-sm bg-yellow-1 write-serif">
          <div class="">
            <div class="row q-gutter-x-md q-mb-md">
              <div class="col">
                <q-select filled dense label="AI model" square :options="models" v-model="model" option-label="name" option-value="id" />
              </div>
              <div class="col">
                <q-select filled dense label="Creativity" square :options="creativityOptions" v-model="creativity" options-dense >
                  <template v-slot:prepend>
                    <q-icon :name="creativity.icon" v-if="creativity.icon" />
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon v-if="scope.opt.icon" :name="scope.opt.icon" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <div class="q-mb-md"><q-icon name="mdi-creation-outline q-mb-xs" />  Cost estimation (using {{ model.name }})</div>

            <div class="text-bold">≈ {{ promptPreviewEstimateCost.inputCost }} for {{ promptPreviewEstimateCost.inputTokens }} input tokens</div>

            <div class="text-subtitle2 text-bold q-mt-md"></div>
            <div class="text-caption">final cost depends on what AI generates: {{ promptPreviewEstimateCost.outputCost }}</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions class="text-primary">
        <div class="col-auto">
        </div>
        <div class="col">

        </div>
        <div class="col-auto">
          <q-btn color="accent" icon="mdi-creation-outline" label="Run Prompt" v-close-popup @click="confirmPrompt(true)" class="float-right" :disable="!canConfirmPrompt"/>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="promptStore.promptParametersShown">
    <q-card style="min-width: 700px">
      <q-card-section class="row items-center q-px-md q-pt-md q-pb-sm">
        <div class="text-h6 bg-accent text-white text-aleo q-px-md q-py-xs rounded-borders full-width row items-center">
          <q-icon name="mdi-creation-outline" class="q-mr-sm" />
          {{ prompt.title }} prompt
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </div>
        <q-tooltip class="q-px-md text-italic" v-if="prompt.description">
          Prompt Description: {{ prompt.description }}
        </q-tooltip>
      </q-card-section>

      <q-card-section class="q-py-sm q-px-md" v-if="prompt.guide && prompt.guide.length > 0">
        <div class="q-px-md text-italic" >
          Tip: {{ prompt.guide }}
        </div>
      </q-card-section>

      <q-card-section class="q-px-md q-pt-none q-pb-none" v-if="promptVariablesIncluded.length > 0">
        <div class="row q-px-md text-grey-7 text-weight-regular">
          <div class=" flex items-center"><q-icon name="las la-check" class="q-mr-xs" />Prompt Includes:</div>
          <template v-for="variable in promptVariablesIncluded" :key="variable">
            <q-chip color="transparent" text-color="grey-7">
              {{ variable }}
            </q-chip>
          </template>
        </div>
      </q-card-section>

      <q-separator class="q-mt-sm" />

      <template v-if="prompt.info?.tags?.includes('input')">
        <q-card-section class="q-px-md q-pt-sm">

          <div class="bordered rounded-borders q-mt-sm" flat>
            <div class="cursor-pointer context-selector q-px-md q-py-md">
              <div class="row">
                <div class="col text-subtitle2 flex items-center"><q-icon name="mdi-import" class="q-mr-xs" />Input</div>
                <div class="col-auto"><q-icon name="keyboard_arrow_down" size="sm" /></div>
              </div>

              <template v-if="promptStore.promptUserInputs?.length > 0 ?? false">
                <template v-for="input in promptStore.promptUserInputs" :key="input.id">
                  <q-chip :color="input.color + '-3'" removable @remove="removeInput(input)">
                    {{ input.label }}
                    &nbsp;<q-badge :color="inputWarning(input).color" v-if="inputWarning(input)">
                      <q-icon name="error" />&nbsp;
                      {{ inputWarning(input).warning }}
                    </q-badge>
                    <q-tooltip color="primary" >
                      {{ input.description }}
                    </q-tooltip>
                  </q-chip>
                </template>
              </template>
              <template v-else>
                <div>
                  No input provided to the prompt
                </div>
              </template>

              <q-popup-proxy >
                <q-card style="width: 668px">
                  <q-card-section class="no-padding">
                    <div class="row">
                      <div class="col q-pa-md">
                        <div class="row">
                          <div class="col-auto">
                            <q-chip :text-color="getInputChipFontColor(selectedTextPromptInput)" :color="getInputChipColor(selectedTextPromptInput)" :icon="getInputChipIcon(selectedTextPromptInput)" :clickable="isInputAllowedForThisPrompt(selectedTextPromptInput)" @click="toggleInput(selectedTextPromptInput)" >
                              {{ selectedTextPromptInput.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include selected text</div>
                                <div>
                                  <q-badge :color="inputWarning(selectedTextPromptInput).color" v-if="inputWarning(selectedTextPromptInput)">
                                    {{ inputWarning(selectedTextPromptInput).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                          <div class="col-auto">
                            <q-chip :text-color="getInputChipFontColor(currentFilePromptInput)" :color="getInputChipColor(currentFilePromptInput)" :icon="getInputChipIcon(currentFilePromptInput)" :clickable="isInputAllowedForThisPrompt(currentFilePromptInput)" @click="toggleInput(currentFilePromptInput)" >
                              {{ currentFilePromptInput.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include all text from {{ currentFile?.title }}</div>
                                <div>
                                  <q-badge :color="inputWarning(currentFilePromptContext).color" v-if="inputWarning(currentFilePromptContext)">
                                    {{ inputWarning(currentFilePromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>

                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

              </q-popup-proxy>

            </div>
          </div>
        </q-card-section>
      </template>

      <q-separator class="q-mt-sm" />


      <template v-if="prompt.info?.tags?.includes('context')">
        <q-card-section class="q-px-md q-pt-sm">
          <q-select v-if="promptStore.promptContextNames" v-model="promptStore.promptContextNames" :options="contextTypes" option-label="label" option-value="label" label="Contexts to include in the prompt" filled multiple use-chips clearable>
            <template v-slot:selected-item="scope">
              <q-chip
                removable
                dense
                @remove="scope.removeAtIndex(scope.index)"
                :tabindex="scope.tabindex"
                :color="scope.opt.color + '-3'"
                class="q-my-xs q-mx-xs"
              >
                {{ scope.opt.label }}
              </q-chip>
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps" class="">
                <q-item-section avatar>
                  <q-badge v-if="scope.opt.description">text</q-badge>
                  <q-badge v-else>context</q-badge>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption v-if="scope.opt.description?.length > 0 ?? false">{{ scope.opt.description }}</q-item-label>
                  <q-item-label caption v-else>Context stored in files</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div class="bordered rounded-borders q-mt-sm" flat>
            <div class="cursor-pointer context-selector q-px-md q-py-md">
              <div class="row">
                <div class="col text-subtitle2 flex items-center"><q-icon name="las la-book" class="q-mr-xs" />Context</div>
                <div class="col-auto"><q-icon name="keyboard_arrow_down" size="sm" /></div>
              </div>

              <template v-if="promptStore.promptContext?.length > 0 ?? false">
                <template v-for="context in promptStore.promptContext" :key="context.id">
                  <q-chip :color="context.color + '-3'" removable @remove="removeContext(context)">
                    {{ context.label }}
                    &nbsp;<q-badge :color="contextWarning(context).color" v-if="contextWarning(context)">
                    <q-icon name="error" />&nbsp;
                    {{ contextWarning(context).warning }}
                  </q-badge>
                    <q-tooltip color="primary" >
                      {{ context.description }}
                    </q-tooltip>
                  </q-chip>
                </template>
              </template>
              <template v-else>
                <div>
                  No additional context selected
                  <q-tooltip>
                    Use context to provide additional information to the prompt.
                  </q-tooltip>
                </div>
              </template>

              <q-popup-proxy >
                <q-card style="width: 668px">
                  <q-card-section class="no-padding">
                    <div class="row">
                      <div class="col-3 q-pa-md bg-grey-1">
                        <q-btn dense flat color="primary" icon="las la-save" label="Save Context" size="13px" @click="saveCurrentContext()" />

                        <template v-if="promptStore.savedPromptContexts.length > 0">
                          <div class="text-subtitle2 q-mt-md">Saved Contexts:</div>
                          <q-list dense class="">
                            <q-item dense v-for="savedContext in promptStore.savedPromptContexts" :key="savedContext.name" class="no-padding">
                              <q-item-section class="justify-start content-start">
                                <q-btn no-wrap dense flat padding="3px 10px" color="primary" no-caps :label="truncate(savedContext.name, 14)" @click="restoreSavedContext(savedContext)">
                                  <q-tooltip :delay="1000">
                                    <div>{{ savedContext.name }}</div>
                                  </q-tooltip>
                                </q-btn>
                              </q-item-section>
                              <q-item-section side><q-btn dense flat icon="las la-trash"  color="red" @click="deleteSavedContext(savedContext)"></q-btn></q-item-section>
                            </q-item>
                          </q-list>
                        </template>

                      </div>
                      <q-separator vertical />
                      <div class="col q-pa-md">
                        <div class="row">
                          <div class="col-auto">
                            <q-chip :text-color="getContextChipFontColor(currentFilePromptContext)" :color="getContextChipColor(currentFilePromptContext)" :icon="getContextChipIcon(currentFilePromptContext)" :clickable="isContextAllowedForThisPrompt(currentFilePromptContext)" @click="toggleContext(currentFilePromptContext)" >
                              {{ currentFilePromptContext.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include all text from {{ currentFile?.title }}</div>
                                <div>
                                  <q-badge :color="contextWarning(currentFilePromptContext).color" v-if="contextWarning(currentFilePromptContext)">
                                    {{ contextWarning(currentFilePromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                          <div class="col-auto">
                            <q-chip :text-color="getContextChipFontColor(currentFileSummaryPromptContext)" :color="getContextChipColor(currentFileSummaryPromptContext)" :icon="getContextChipIcon(currentFileSummaryPromptContext)" :clickable="isContextAllowedForThisPrompt(currentFileSummaryPromptContext)" @click="toggleContext(currentFileSummaryPromptContext)" >
                              {{ currentFileSummaryPromptContext.label }} &nbsp;
                              <q-tooltip color="primary" >
                                <div>summary of file {{ currentFile?.title }}</div>
                                <div>
                                  <q-badge :color="contextWarning(currentFileSummaryPromptContext).color" v-if="contextWarning(currentFileSummaryPromptContext)">
                                    {{ contextWarning(currentFileSummaryPromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>

                          </div>
                        </div>
                        <div class="row">
                          <div class="col-auto">
                            <q-chip :text-color="getContextChipFontColor(currentAndChildrenFilePromptContext)" :color="getContextChipColor(currentAndChildrenFilePromptContext)" :icon="getContextChipIcon(currentAndChildrenFilePromptContext)" :clickable="isContextAllowedForThisPrompt(currentAndChildrenFilePromptContext)" @click="toggleContext(currentAndChildrenFilePromptContext)" >
                              {{ currentAndChildrenFilePromptContext.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include all text from {{ currentFile?.title }} and its children</div>
                                <div>
                                  <q-badge :color="contextWarning(currentAndChildrenFilePromptContext).color" v-if="contextWarning(currentAndChildrenFilePromptContext)">
                                    {{ contextWarning(currentAndChildrenFilePromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                          <div class="col-auto">
                            <q-chip :text-color="getContextChipFontColor(currentAndChildrenFileSummaryPromptContext)" :color="getContextChipColor(currentAndChildrenFileSummaryPromptContext)" :icon="getContextChipIcon(currentAndChildrenFileSummaryPromptContext)" :clickable="isContextAllowedForThisPrompt(currentAndChildrenFileSummaryPromptContext)" @click="toggleContext(currentAndChildrenFileSummaryPromptContext)" >
                              {{ currentAndChildrenFileSummaryPromptContext.label }} &nbsp;
                              <q-tooltip color="primary">
                                <div>include summary of {{ currentFile?.title }} and its children</div>
                                <div>
                                  <q-badge :color="contextWarning(currentAndChildrenFileSummaryPromptContext).color" v-if="contextWarning(currentAndChildrenFileSummaryPromptContext)">
                                    {{ contextWarning(currentAndChildrenFileSummaryPromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                        </div>
                        <div class="row">
                          <div class="col-auto">
                            <q-chip :text-color="getContextChipFontColor(selectedTextPromptContext)" :color="getContextChipColor(selectedTextPromptContext)" :icon="getContextChipIcon(selectedTextPromptContext)" :clickable="isContextAllowedForThisPrompt(selectedTextPromptContext)" @click="toggleContext(selectedTextPromptContext)" >
                              {{ selectedTextPromptContext.label }} &nbsp;
                              <q-tooltip color="primary" >
                                <div>include mouse selected text</div>
                                <div>
                                  <q-badge :color="contextWarning(selectedTextPromptContext).color" v-if="contextWarning(selectedTextPromptContext)">
                                    {{ contextWarning(selectedTextPromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                          <div class="col-auto flex items-center q-mx-md"></div>
                          <div class="col-auto">
                            <q-chip :text-color="getContextChipFontColor(previousCharactersPromptContext)" :color="getContextChipColor(previousCharactersPromptContext)" :icon="getContextChipIcon(previousCharactersPromptContext)" :clickable="isContextAllowedForThisPrompt(previousCharactersPromptContext)" @click="toggleContext(previousCharactersPromptContext)" >
                              {{ previousCharactersPromptContext.label }} &nbsp;

                              <q-btn
                                padding="none"
                                flat
                                icon="more_horiz"
                                @click.stop
                              >
                                <q-menu>
                                  <q-list style="min-width: 100px" dense>
                                    <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 3000)">
                                      <q-item-section side><q-icon name="las la-plus" /></q-item-section>
                                      <q-item-section>Previous 3000 Characters</q-item-section>
                                    </q-item>
                                    <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 2000)">
                                      <q-item-section side><q-icon name="las la-plus" /></q-item-section>
                                      <q-item-section>Previous 2000 Characters</q-item-section>
                                    </q-item>
                                    <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 1000)">
                                      <q-item-section side><q-icon name="las la-plus" /></q-item-section>
                                      <q-item-section>Previous 1000 Characters</q-item-section>
                                    </q-item>
                                    <q-item clickable v-close-popup @click="toggleContext(previousCharactersPromptContext, 500)">
                                      <q-item-section side><q-icon name="las la-plus" /></q-item-section>
                                      <q-item-section>Previous 500 Characters</q-item-section>
                                    </q-item>
                                  </q-list>
                                </q-menu>
                              </q-btn>

                              <q-tooltip color="primary" >
                                <div>include text preceding selected text</div>
                                <div>
                                  <q-badge :color="contextWarning(previousCharactersPromptContext).color" v-if="contextWarning(previousCharactersPromptContext)">
                                    {{ contextWarning(previousCharactersPromptContext).warning }}
                                  </q-badge>
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                        </div>

                        <div class="text-subtitle2 q-mt-md">Files with Context Types:</div>
                        <div class="row">
                          <div class="col">
                            <template v-for="context in contextTypePromptContext" :key="context.id">
                              <q-chip :text-color="getContextChipFontColor(context)" :color="getContextChipColor(context)" :icon="getContextChipIcon(context)" :clickable="isContextAllowedForThisPrompt(context)" @click="toggleContext(context)" >
                                {{ context.label }} &nbsp;
                                <q-tooltip color="primary" >
                                  <div>{{ context.description }}</div>
                                  <div>
                                    <q-badge :color="contextWarning(context).color" v-if="contextWarning(context)">
                                      {{ contextWarning(context).warning }}
                                    </q-badge>
                                  </div>
                                </q-tooltip>
                              </q-chip>
                              <div v-if="context.contextType === 'Context Type'" class="flex-break" >
                              </div>
                            </template>
                          </div>
                        </div>

                        <div class="text-subtitle2 q-mt-md">Variables:</div>
                        <div class="row">
                          <div class="col">
                            <template v-for="context in variablesPromptContext" :key="context.id">
                              <q-chip :text-color="getContextChipFontColor(context)" :color="getContextChipColor(context)" :icon="getContextChipIcon(context)" :clickable="isContextAllowedForThisPrompt(context)" @click="toggleContext(context)" >
                                {{ context.label }} &nbsp;
                                <q-tooltip color="primary" >
                                  <div>{{ context.description }}</div>
                                  <div>
                                    <q-badge :color="contextWarning(context).color" v-if="contextWarning(context)">
                                      {{ contextWarning(context).warning }}
                                    </q-badge>
                                  </div>
                                </q-tooltip>
                              </q-chip>
                            </template>
                          </div>
                        </div>

                        <div class="text-subtitle2 q-mt-md">Individual Files:</div>
                        <div class="row q-gutter-x-sm">
                          <div class="col-12">
                            <q-select label="Add single file" input-debounce="0" @filter="filterFnFile" use-input options-dense dense filled square dropdown-icon="add" v-model="promptContextFile" :options="promptContextFiles" @update:model-value="(val) => addFileContext(val)" >
                            </q-select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

              </q-popup-proxy>
            </div>
          </div>

          <q-dialog v-model="addFileContextDialog">
            <q-card style="width: 500px;">
              <q-card-section>
                <div class="text-h6">Include {{ addFileContextDialogData?.file?.title }} as:</div>
              </q-card-section>

              <q-card-section>
                <div>
                  <q-btn flat :label="'All text of ' + addFileContextDialogData?.file?.title" no-caps color="primary" @click="confirmAddFileContext('file')" />
                </div>
                <div>
                  <q-btn flat :label="'Summary of ' + addFileContextDialogData?.file?.title" no-caps color="primary" @click="confirmAddFileContext('fileSummary')" />
                </div>
                <q-separator class="q-my-sm" />
                <div>
                  <q-btn flat :label="'All text of ' + addFileContextDialogData?.file?.title + ' and its text of its children'" no-caps color="primary" @click="confirmAddFileContext('fileChildren')" />
                </div>
                <div>
                  <q-btn flat :label="'Summary of ' + addFileContextDialogData?.file?.title + ' and summaries of its children'" no-caps color="primary" @click="confirmAddFileContext('fileChildrenSummary')" />
                </div>
              </q-card-section>
            </q-card>
          </q-dialog>

        </q-card-section>
      </template>

      <template v-if="promptStore.promptParametersValue && promptStore.promptParametersValue.length > 0">
        <q-card-section class="q-pt-none q-gutter-y-md q-mt-sm" >
          <div v-for="parameter in promptStore.promptParametersValue" :key="parameter.name">
            <template v-if="parameter.type === 'Select'">
              <q-select dense filled v-model="parameter.value" :options="parameter.values" :label="parameter.name"></q-select>
            </template>
            <template v-if="parameter.type === 'Select (advanced)'">
              <q-select dense filled v-model="parameter.value" :options="parameter.values" :label="parameter.name"></q-select>
            </template>
            <template v-if="parameter.type === 'Text'">
              <p class="text-subtitle2 q-mb-none" v-if="parameter.hint?.length > 0 ?? false">
                {{ parameter.hint }}
                <span v-if="parameter.required" class="text-red-4">*</span>
              </p>
              <p class="text-bold text-grey-7 q-mb-none" v-else>
                ${{ parameter.name }}:
                <span v-if="parameter.required" class="text-red-4">*</span>
              </p>

              <div class="row">
                <div class="col">
                  <CodeEditor v-model="parameter.value" :parameters="[]"/>
                </div>
                <div  v-if="parameter.examples && parameter.examples.length > 0" class="col-auto q-ml-sm flex items-center">
                  <q-btn
                    class="text-secondary"
                    no-caps
                    dense
                    icon-right="expand_more"
                    flat
                    label="Examples">
                    <q-popup-proxy>
                      <q-card style="width: 400px;">
                        <q-card-section>
                          <template v-for="(text, index) in separateTextByComma(parameter.examples)" :key="index">
                            <q-chip class="text-caption" :label="text" dense clickable @click="parameter.value = text" color="blue-grey-1">
                            </q-chip>
                          </template>
                        </q-card-section>
                      </q-card>
                    </q-popup-proxy>

                  </q-btn>
                </div>
              </div>
            </template>
          </div>
        </q-card-section>
      </template>

      <template v-if="model.args?.inferenceEngine === 'translation'">
        <q-card-section >
          <div class="row q-gutter-x-sm">
            <div class="col">
              <q-select v-model="promptStore.promptSourceLanguage" :options="sourceLanguages" label="Source Language" filled dense clearable :hint="sourceLanguageHint" @focus="enterConfirms.value = false" @blur="enterConfirms.value = true">
                <template v-slot:prepend>
                  <q-icon name="las la-language" />
                </template>
              </q-select>
            </div>
            <div class="col">
              <q-select v-model="promptStore.promptTargetLanguage" :options="targetLanguages" label="Target Language" filled dense  @focus="enterConfirms.value = false" @blur="enterConfirms.value = true">
                <template v-slot:prepend>
                  <q-icon name="las la-language" />
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </template>

      <q-separator />

      <q-card-actions class="text-primary">

        <div class="col-auto">
          <q-select filled dense label="AI model" square :options="models" v-model="model" option-label="name" option-value="id" options-dense />
        </div>
        <div class="col">
        </div>
        <div class="col-auto q-mr-md">
          <q-btn flat label="Preview & Cost" color="secondary" @click="previewPrompt" class="float-left" :disable="!canConfirmPrompt"/>
        </div>
        <div class="col-auto">
          <q-btn color="accent" icon="mdi-creation-outline" label="Run Prompt" v-close-popup @click="confirmPrompt(false)" class="float-right" :disable="!canConfirmPrompt"/>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {usePromptStore} from "stores/prompt-store";
  import {executeConfirmPrompt} from "src/common/helpers/promptHelper";
  import {computed, ref} from "vue";
  import {convertHtmlToText, removeHtmlTags, tokenise, truncate} from "src/common/utils/textUtils";
  import {useFileStore} from "stores/file-store";
  import CodeEditor from "components/Common/Editors/CodeEditor.vue";
  import {
    currentAndChildrenFilePromptContext,
    currentAndChildrenFileSummaryPromptContext,
    currentFilePromptContext, currentFilePromptInput, currentFileSummaryPromptContext, previousCharactersPromptContext,
    selectedTextPromptContext, selectedTextPromptInput
  } from "src/common/resources/promptContexts";
  import {useLayoutStore} from "stores/layout-store";
  import {Dialog} from "quasar";
  import {variables as fileVariables} from "src/common/resources/variables";
  import {getCloudModelApiKey} from "src/common/utils/modelUtils";
  import {onKeyStroke} from "@vueuse/core";
  import {getEditor, getEditorSelection} from "src/common/utils/editorUtils";

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const layoutStore = useLayoutStore();

  const promptContextFile = ref(null);
  const enterConfirms = ref(false);
  const addFileContextDialog = ref(false);
  const addFileContextDialogData = ref(null);

  const contextTypes = computed(() => promptStore.contextTypes
    .concat(currentFilePromptContext)
    .concat(selectedTextPromptContext)
    .concat(fileStore.variables.map(v => ({label: 'Variable ' + v.title, color: 'green', description: 'Content from variable ' + v.title})))
  );

  const prompt = computed(() => promptStore.currentPromptConfirmation);
  const model = computed({
    get () {
      return promptStore.getModel(promptStore.getCurrentPromptModelId(prompt.value));
    },
    set (value) {
      promptStore.setCurrentOverridePromptParameter(prompt.value, value.id, undefined, undefined, undefined);
    }
  });

  const creativity = computed({
    get () {
      const temperature = promptStore.getCurrentOverrideTemperature(prompt.value);

      if(temperature !== undefined && temperature !== null) {
        return creativityOptions.find(c => c.value === temperature);
      } else {
        return creativityOptions[0];
      }
    },
    set (value) {
      promptStore.setCurrentOverridePromptParameter(prompt.value, undefined, value.value, undefined, undefined);
    }
  });

  const models = computed(() => promptStore.models);
  const creativityOptions = [
    {label: 'Default', value: null, icon: null},
    {label: 'Very Creative (temperature 1)', value: 1, icon: 'mdi-palette'},
    {label: 'Creative (temperature 0.8)', value: 0.8, icon: 'mdi-palette-outline'},
    {label: 'Deterministic (temperature 0.5)', value: 0.5, icon: 'mdi-keyboard-outline'},
    {label: 'Very Deterministic (temperature 0)', value: 0, icon: 'mdi-keyboard'},
  ]

  const userData = computed(() => {
    return layoutStore.userData;
  });

  const sourceLanguageHint = computed(() => {
    if(promptStore.promptSourceLanguage) {
      return '';
    }
    return 'Source language will be detected automatically.';
  })

  const currentFile = computed(() => {
    return fileStore.selectedFile;
  });

  const sourceLanguages = computed(() => {
    return model.value.args?.sourceLanguages ?? [];
  });

  const targetLanguages = computed(() => {
    return model.value.args?.targetLanguages ?? [];
  });

  const promptVariablesIncluded = computed(() => {
    const variables = [];

    // find all $[variables] with regex
    const regex = /\$[a-zA-Z0-9]+/g;
    const text = prompt.value.userPrompt + ' ' + prompt.value.systemPrompt;

    let match;
    while ((match = regex.exec(text)) !== null) {
      // except $context
      if(match[0] === '$context' || match[0] === '$input') {
        continue;
      }

      /*if(prompt.value.parameters.find(p => p.name === match[0].substring(1))) {
        continue;
      }*/

      // distinct
      if(!variables.includes(match[0].substring(1))) {
        const v = fileVariables.find(v => v.label === match[0]);
        if(v) {
          variables.push(v.info);
        }
      }
    }

    return variables;
  });

  function separateTextByComma(text) {
    return text.split(',')?.map(t => t.trim()) ?? [];
  }

  const canConfirmPrompt = computed(() => {
    for (const parameter of promptStore.promptParametersValue) {
      if (parameter.required) {
        if(parameter.value?.value !== undefined) {
          if(convertHtmlToText(parameter.value.value).trim() === '') {
            return false;
          }
        } else if(!parameter.value || convertHtmlToText(parameter.value).trim() === '') {
          return false;
        }
      }
    }

    return true;
  });

  async function confirmPrompt(forceInput) {
    if (!canConfirmPrompt.value) {
      return;
    }

    promptStore.promptParametersShown = false;

    if(forceInput) {
      await executeConfirmPrompt(false, promptPreview.value);
    } else {
      await executeConfirmPrompt();
    }
  }

  async function previewPrompt() {
    if (!canConfirmPrompt.value) {
      return;
    }

    const input = await executeConfirmPrompt(true);

    promptPreview.value = input;
    promptPreviewShown.value = true;
  }

  const promptPreview = computed({
    get () {
      return layoutStore.promptPreview;
    },
    set (value) {
      layoutStore.promptPreview = value;
    }
  });

  const promptPreviewShown = computed({
    get () {
      return layoutStore.promptPreviewShown;
    },
    set (value) {
      layoutStore.promptPreviewShown = value;
    }
  });

  const contextTypePromptContext = computed(() => {
    const retValue = [];

    for (const contextType of promptStore.contextTypes) {

      retValue.push({
        id: 'Context Type Summary ' + contextType.label,
        label: '' + contextType.label + ' summaries',
        contextType: 'Context Type Summary',
        parameters: contextType.label,
        color: contextType.color ?? 'deep-purple',
        description: 'Summaries from all pages with Context Type ' + contextType.label
      });

      retValue.push({
        id: 'Context Type ' + contextType.label,
        label: '' + contextType.label + ' (texts)',
        contextType: 'Context Type',
        parameters: contextType.label,
        color: contextType.color ?? 'purple',
        description: 'Content from all pages with Context Type ' + contextType.label
      });
    }

    return retValue;
  })

  const variablesPromptContext = computed(() => {
    return fileStore.variables.map(c => ({
      id: 'Variable ' + c.title,
      label: '' + c.title,
      contextType: 'Variable',
      parameters: c.title,
      color: 'brown',
      description: 'Content from variable ' + c.title
    }));
  })

  const promptContextFilesText = ref('');
  const promptContextFileSummariesText = ref('');

  const promptContextFiles = computed(() => {
    return fileStore.queryFiles((f) => true, fileStore.files, true).map(f => ({
      id: 'File ' + f.title,
      label: '' + f.title,
      file: f,
    })).filter(f => {
      if(promptContextFilesText.value.trim() === '') {
        return true;
      }

      return f.label.toLowerCase().includes(promptContextFilesText.value.toLowerCase());
    });
  });

  function filterFnFile(val, update) {
    update(() => {
      promptContextFilesText.value = val;
    });
  }

  function addFileContext(context) {
    if (!containsContext(context)) {

      addFileContextDialogData.value = context;
      addFileContextDialog.value = true;
    }
  }

  function confirmAddFileContext(option) {
    const data = addFileContextDialogData.value;
    if(!data) return;

    let context;

    if(option === 'file') {
      context = {
        id: 'File ' + data.file.title,
        label: '' + data.file.title,
        contextType: 'File',
        parameters: data.file.id,
        color: 'blue',
        description: 'All text from file ' + data.file.title
      }
    } else if(option === 'fileSummary') {
      context = {
        id: 'File Summary ' + data.file.title,
        label: '' + data.file.title + '',
        contextType: 'File Summary',
        parameters: data.file.id,
        color: 'blue',
        description: 'Summary of file ' + data.file.title
      }
    } else if(option === 'fileChildren') {
      context = {
        id: 'File and Children ' + data.file.title,
        label: '' + data.file.title + '',
        contextType: 'File and Children',
        parameters: data.file.id,
        color: 'blue',
        description: 'File ' + data.file.title + ' and its children '
      }
    } else if(option === 'fileChildrenSummary') {
      context = {
        id: 'File and Children Summary ' + data.file.title,
        label: '' + data.file.title + '',
        contextType: 'File and Children Summary',
        parameters: data.file.id,
        color: 'blue',
        description: 'Summaries of the file '+ data.file.title + ' and its children '
      }
    }

    if(context) {
      toggleContext(context);
    }

    addFileContextDialog.value = false;
    addFileContextDialogData.value = null;
  }

  function toggleInput(input, parametersValue = undefined) {
    if (containsInput(input)) {
      removeInput(input);
    } else {
      addInput(input, parametersValue);
    }
  }

  function toggleContext(context, parametersValue = undefined) {
    if (containsContext(context)) {
      removeContext(context);
    } else {
      addContext(context, parametersValue);
    }

    promptContextFile.value = null;
    promptContextFileSummariesText.value = '';
    promptContextFilesText.value = '';
  }

  function containsInput(input) {
    return promptStore.promptUserInputs.some(c => c.id === input.id);
  }

  function containsContext(context) {
    return promptStore.promptContext.some(c => c.id === context.id);
  }

  function isInputAllowedForThisPrompt(input) {
    if(input === selectedTextPromptInput) {
      const selection = getEditorSelection();

      if(!selection || selection.empty === true) {
        return false;
      }
    }

    if(input === currentFilePromptInput) {
      if (!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
        return false;
      }
    }

    return true;
  }

  function isContextAllowedForThisPrompt(context) {
    if(prompt.value.overrideContexts === true) {
      if(prompt.value.excludedContextTypes && prompt.value.excludedContextTypes.includes(context.id)) {
        return false;
      }
    }

    if(context === selectedTextPromptContext ) {
      const selection = getEditorSelection();

      if(!selection || selection.empty === true) {
        return false;
      }
    }

    if(context === currentFilePromptContext) {
      if (!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
        return false;
      }
    }

    if(context === currentFileSummaryPromptContext) {
      if (!currentFile.value || !currentFile.value.synopsis || currentFile.value.synopsis.trim() === '') {
        return false;
      }
    }

    if(context === previousCharactersPromptContext) {

      const editor = getEditor();
      if(!editor) {
        return false;
      }

      if(!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
        return false;
      }

      const selection = getEditorSelection();
      if(!selection) {
        return false;
      }

      const {from, to, empty, $anchor, $head} = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(0, from, '\n\n');

      if(textBefore.length === 0) {
        return false;
      }
    }

    return true;
  }

  function getInputChipColor(input) {
    if(!isInputAllowedForThisPrompt(input)) {
      //return 'white';
    }

    return containsInput(input) ? (input.color + '-4') : (input.color + '-1');
  }

  function getContextChipColor(context) {
    if(!isContextAllowedForThisPrompt(context)) {
      //return 'white';
    }

    return containsContext(context) ? (context.color + '-4') : (context.color + '-1');
  }

  function getInputChipIcon(input) {
    if(!isInputAllowedForThisPrompt(input)) {
      return undefined;
    }

    return containsInput(input) ? 'las la-check' : 'las la-plus';
  }

  function getContextChipIcon(context) {
    if(!isContextAllowedForThisPrompt(context)) {
      return undefined;
    }

    return containsContext(context) ? 'las la-check' : 'las la-plus';
  }

  function getInputChipFontColor(context) {
    if(!isInputAllowedForThisPrompt(context)) {
      return 'grey-4';
    }

    return 'black'
  }

  function getContextChipFontColor(context) {
    if(!isContextAllowedForThisPrompt(context)) {
      return 'grey-4';
    }

    return 'black'
  }

  function addInput(input, parametersValue = undefined) {
    if(input === selectedTextPromptInput) {
      removeInput(currentFilePromptInput);
    }

    if(input === currentFilePromptInput) {
      removeInput(selectedTextPromptInput);
    }

    if(parametersValue) {
      input.parameters = parametersValue;
    }

    promptStore.promptUserInputs.push(input);
  }

  function addContext(context, parametersValue = undefined) {
    if(context === selectedTextPromptContext) {
      removeContext(currentFilePromptContext);
      removeContext(currentAndChildrenFileSummaryPromptContext);
    }

    if(context === currentFilePromptContext || context === currentAndChildrenFileSummaryPromptContext) {
      removeContext(selectedTextPromptContext);
    }

    if(parametersValue) {
      context.parameters = parametersValue;
    }

    if(context === previousCharactersPromptContext) {
      context.description = '' + context.parameters + ' characters preceding your selected text';
      context.label = 'Previous ' + context.parameters + ' characters';
    }

    promptStore.promptContext.push(context);
  }

  function removeContext(context) {
    promptStore.promptContext = promptStore.promptContext.filter(c => c.id !== context.id);
  }

  function removeInput(input) {
    promptStore.promptUserInputs = promptStore.promptUserInputs.filter(c => c.id !== input.id);
  }

  function inputWarning(input) {
    return null;
  }

  function contextWarning(context) {
    if(context.id === selectedTextPromptContext.id) {
      const selection = getEditorSelection();

      if(!selection || selection.empty === true) {
        return {color: 'red-3', warning: 'No text was selected.'};
      }
    } else if(context.id === currentFilePromptContext.id) {
      if(!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
        return {color: 'red-3', warning: 'Current file has no text.'};
      }
    } else if(context.id === currentFileSummaryPromptContext.id) {
      if (!currentFile.value || !currentFile.value.synopsis || currentFile.value.synopsis.trim() === '') {
        return {color: 'red-3', warning: 'Current file has no synopsis. Write it first.'};
      }
    } else if(context.id === previousCharactersPromptContext.id) {

      const editor = getEditor();
      if(!editor) {
        return {color: 'red-3', warning: 'No file selected.'};
      }

      if(!currentFile.value || !currentFile.value.content || removeHtmlTags(currentFile.value.content).trim() === '') {
        return {color: 'red-3', warning: 'Current file has no text.'};
      }

      const selection = getEditorSelection();
      if(!selection) {
        return {color: 'red-3', warning: 'No text was selected.'};
      }

      const {from, to, empty, $anchor, $head} = selection;
      const textBefore = editor.state.doc.textBetween(0, from, '\n\n');

      if(textBefore.length === 0) {
        return {color: 'red-3', warning: 'There is no text before your selection.'};
      }
    }

    return null;
  }


  function saveCurrentContext() {
    Dialog.create({
      title: 'Prompt',
      message: 'Enter a name for the context',
      prompt: {
        model: 'My context',
        type: 'text' // optional
      },
      cancel: true,
      persistent: true
    }).onOk(data => {
      promptStore.savedPromptContexts.push({
        name: data,
        value: [...promptStore.promptContext]
      });
    }).onCancel(() => {
    }).onDismiss(() => {
    })
  }

  function restoreSavedContext(savedContext) {
    promptStore.promptContext = [];

    for(const context of savedContext.value) {
      addContext(context);
    }
  }

  function deleteSavedContext(savedContext) {
    promptStore.savedPromptContexts = promptStore.savedPromptContexts.filter(sc => sc.name !== savedContext.name);
  }

  const promptPreviewEstimateCost = computed(() => {
    if(!promptPreview.value) {
      return;
    }

    let textMessagesContentLength = 0;
    let inputTokens = 0;

    const modelData = layoutStore.getModelData(model.value.modelName);


    promptPreview.value.textMessages.forEach(tm => {
      textMessagesContentLength += tm.text.length;
      inputTokens += tokenise(tm.text)?.length ?? 0;
    });


    let inputCost = modelData ? ((modelData.inputPrice * inputTokens / 1000000) + '+ credits for input') : 'N/A';
    let outputCost = modelData ? ((modelData.outputPrice / 1000) + ' output credits per 1000 tokens') : 'N/A';

    if(model.value.type === 'client-dall-e') {
      inputCost = modelData ? ((modelData.inputPrice) + '+ per image') : 'N/A';
      outputCost = '';
    }

    if(userData.value?.subscriptionLevel > 0) {
      const key = getCloudModelApiKey(model.value.id, model.value.args?.inferenceEngine);

      if(key && key.key && key.key.length > 0) {
        inputCost = 'Credits not consumed - using own cloud API';
        outputCost = '';
      }
    }

    return {
      textMessagesContentLength,
      inputTokens,
      inputCost: inputCost,
      outputCost: outputCost
    }
  });

  onKeyStroke('Enter', (e) => {
    if(!promptPreviewShown.value && promptStore.promptParametersShown && enterConfirms.value) {
      confirmPrompt(promptPreviewShown.value ? true : false);
    }
  })

  function moveTextMessage(message, byIndex) {
    const index = promptPreview.value.textMessages.indexOf(message);
    if (index === -1) return;

    const newIndex = index + byIndex;
    if (newIndex < 0 || newIndex >= promptPreview.value.textMessages.length) return;

    const [movedMessage] = promptPreview.value.textMessages.splice(index, 1);
    promptPreview.value.textMessages.splice(newIndex, 0, movedMessage);
  }

  function addMessage(type) {
    promptPreview.value.textMessages.push({
      type: type,
      text: ''
    });
  }
</script>

<style scoped>

.context-selector:hover {
  background-color: rgb(240, 240, 240);
  transition: background-color 0.5s;
}

</style>
