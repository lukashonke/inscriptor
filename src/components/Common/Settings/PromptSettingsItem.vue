<template>
  <q-card class="q-mb-md" :class="{ 'bg-red-1': !enabled }" bordered flat>
    <q-card-section class="q-px-md q-py-sm">
      <div class="row flex items-center">
        <div class="col q-ml-sm">
          <div class="">
            <span class="text-subtitle1 text-weight-medium">{{ title }}</span>
          </div>
          <div v-if="description">
            <span class="text-caption ">{{ description }}</span>
          </div>
        </div>

        <div class="col">

        </div>
        <div class="col flex items-center q-mr-xl q-gutter-y-xs">
          <q-badge class="q-ml-sm" color="" v-if="promptType?.label.length > 0">
            {{ promptType.label }} prompt
            <q-tooltip>
              Prompt Trigger Type
            </q-tooltip>
          </q-badge>
          <q-badge class="q-ml-sm" color="secondary" v-if="promptCategory?.length > 0">
            <q-icon name="las la-tag" />
            {{ promptCategory }}
            <q-tooltip>
              Prompt Category
            </q-tooltip>
          </q-badge>
          <q-badge class="q-ml-sm" color="secondary" v-if="promptFolder?.length > 0">
            <q-icon name="las la-folder" />
            {{ promptFolder }}
            <q-tooltip>
              Folder
            </q-tooltip>
          </q-badge>
          <q-badge v-if="prompt.info?.tags.includes('context')" class="q-ml-sm" color="warning" >
            <q-icon name="las la-user" />
            Context
            <q-tooltip>
              This prompt will ask for context
            </q-tooltip>
          </q-badge>
          <q-badge v-if="prompt.hasParameters" class="q-ml-sm" color="warning" >
            <q-icon name="las la-user" />
            Parameters
            <q-tooltip>
              This prompt will ask for extra parameters
            </q-tooltip>
          </q-badge>
        </div>

        <template v-if="!startExpanded">
          <div class="col-auto row q-ml-sm"><q-btn icon="las la-trash" color="red" flat @click="promptStore.removePrompt(prompt)" label="" class="float-right" dense/></div>
          <div class="col-auto row q-ml-sm"><q-btn icon="las la-copy" color="primary" flat @click="promptStore.clonePrompt(prompt)" label="" class="float-right" dense/></div>

          <div class="col-auto row q-ml-sm">
            <q-btn icon="las la-arrow-up" color="primary" flat @click="promptStore.pushPromptOrder(prompt, -1)" label="" class="float-right" dense/>
            <q-btn icon="las la-arrow-down" color="primary" flat @click="promptStore.pushPromptOrder(prompt, 1)" label="" class="float-right" dense/>
          </div>

          <div class="col-auto row q-ml-sm"><q-btn icon="las la-cog" color="primary" flat @click="settingsExpanded = !settingsExpanded" label="" class="float-right" dense/></div>
        </template>


      </div>

      <q-slide-transition v-if="settingsExpanded">
        <q-card bordered flat>
          <q-card-section class="q-gutter-y-sm">
            <div class="row">
              <div class="col-auto"><ColorPicker v-model="color"></ColorPicker></div>
              <div class="col-aut flex items-center bordered q-ml-sm">
                <IconPicker v-model="icon" :color="color" />
              </div>

              <div class="col q-ml-sm"><q-input outlined filled dense label="Prompt Name" v-model="title" /></div>
              <div class="col-auto q-ml-sm" v-if="allowPromptCategorization">
                <q-select outlined filled dense label="Category Tab" v-model="promptCategory" :options="promptStore.promptCategories" option-label="label" option-value="label" emit-value use-input clearable hide-dropdown-icon @new-value="(val, done) => promptStore.addListItem(promptStore.promptCategories, val, 'white', done)" options-dense >
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
              <div class="col-auto q-ml-sm" v-if="allowPromptCategorization">
                <q-select outlined filled dense label="Folder" v-model="promptFolder" :options="promptStore.promptFolders" option-label="label" option-value="label" emit-value use-input clearable hide-dropdown-icon @new-value="(val, done) => promptStore.addListItem(promptStore.promptFolders, val, 'white', done)" options-dense >
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
            <div class="row q-gutter-x-sm">
              <div class="col"><InputWithAi v-model="description" label="Description" :prompt-ids="promptStore.getPredefinedPromptId('Prompt Description Generator')" :prompt-input="promptInput" /></div>
              <div class="col"><q-input autogrow outlined filled dense label="Usage Guide / Tips" v-model="guide" /></div>
            </div>
            <div class="row">

            </div>
          </q-card-section>

          <q-separator class="q-my-sm"></q-separator>

          <q-card-section class="q-gutter-y-md">
            <div class="row">
              <div class="col">
                <span class="text-subtitle2">Prompt AI Settings</span>
              </div>
            </div>
            <div class="row q-gutter-x-sm">
              <div class="col">
                <q-select v-model="modelId" filled dense label="Model" :options="models" options-dense />
              </div>
              <div class="col-auto" v-if="showPromptType">
                <q-select v-model="promptType" filled dense label="Prompt Type" :options="promptTypes" style="min-width: 150px" >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon :name="scope.opt.icon" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                        <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:after>
                    <HelpIcon :tooltip="$t('tooltips.parameters.promptTypes')"></HelpIcon>
                  </template>
                </q-select>
              </div>
              <div class="col">
                <q-select filled dense v-model="promptStyle" label="Prompt UI Style" :options="promptStyles" v-if="showPromptUiStyle" options-dense/>
              </div>
            </div>

            <div class="row q-gutter-x-md" v-if="showPromptToggles">
              <div class="col-auto">
                <q-checkbox v-model="hasExtraParameters" dense label="Extra Parameters" />
                <HelpIcon :tooltip="$t('tooltips.parameters.extraParameters')"></HelpIcon>
              </div>
              <div class="col-auto">
                <q-checkbox v-model="overrideSystemPrompt" dense label="Override system prompt" />
              </div>
              <div class="col-auto">
                <q-checkbox v-model="overridePromptFormat" dense label="Override prompt format" />
              </div>
              <div class="col-auto" v-if="prompt.info?.tags.includes('context') && canChangeContextTypes">
                <q-checkbox v-model="overrideContexts" dense label="Change Context Types" />
              </div>
              <div class="col-auto">
                <q-checkbox v-model="hasExtendedChatMessages" dense label="Include more prompt messages" />
              </div>

            </div>

            <div class="row" v-if="overridePromptFormat">
              <div class="col q-gutter-y-xs">

                <div class="text-subtitle2 q-mt-sm ">Prompt Format</div>
                <q-input dense filled square label="System Prompt Prefix" v-model="systemPromptPrefix" autogrow />
                <q-input dense filled square label="System Prompt Suffix" v-model="systemPromptSuffix" autogrow />
                <q-input dense filled square label="User Prompt Prefix" v-model="userPromptPrefix" autogrow />
                <q-input dense filled square label="User Prompt Suffix" v-model="userPromptSuffix" autogrow />
                <q-input dense filled square label="Assistant Prompt Prefix" v-model="assistantPromptPrefix" autogrow />
                <q-input dense filled square label="Assistant Prompt Suffix" v-model="assistantPromptSuffix" autogrow />
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.promptFormat')"></HelpIcon>
              </div>
            </div>

            <div class="row q-gutter-x-sm" v-if="overrideContexts">
              <div class="col">
                <q-select outlined filled dense label="Default Context" v-model="defaultContextTypes" :options="contextTypes" option-label="label" option-value="value" emit-value clearable multiple >
                  <q-tooltip>
                    Default Context types for this prompt, can be overriden when triggering the prompt.
                  </q-tooltip>
                </q-select>
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.defaultContextTypes')"></HelpIcon>
              </div>
              <div class="col">
                <q-select outlined filled dense label="Excluded Context" v-model="excludedContextTypes" :options="contextTypes" option-label="label" option-value="value" emit-value clearable multiple >
                  <q-tooltip>
                    These context types will not be available when triggering the prompt, as they are already hardcoded within the prompt.
                  </q-tooltip>
                </q-select>
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.excludedContextTypes')"></HelpIcon>
              </div>
            </div>

            <div class="row" v-if="overrideSystemPrompt">
              <div class="col">
                <CodeEditor v-model="systemPrompt" :parameters="parameters" label="System Prompt" />
              </div>
              <div class="col-auto items-center flex">
                <HelpIcon :tooltip="$t('tooltips.parameters.systemPrompt')"></HelpIcon>
              </div>
            </div>

            <template v-if="showUserPrompt">
              <div class="row">
                <div class="col">
                  <CodeEditor v-model="userPrompt" :parameters="parameters" label="User Prompt" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.userPrompt')"></HelpIcon>
                </div>
              </div>

              <div class="row" v-if="hasExtendedChatMessages">
                <div class="col">
                  <CodeEditor v-model="assistantPrompt" :parameters="parameters" label="Assistant Prompt" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.userPrompt')"></HelpIcon>
                </div>
              </div>

              <div class="row" v-if="hasExtendedChatMessages">
                <div class="col">
                  <CodeEditor v-model="userPrompt2" :parameters="parameters" label="User Prompt" />
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon :tooltip="$t('tooltips.parameters.userPrompt')"></HelpIcon>
                </div>
              </div>

              <div class="row" v-if="showPromptFormat">
                <div class="col">
                  <q-input dense autogrow label="Prompt Format Preview" v-model="promptFormat" readonly/>
                </div>
                <div class="col-auto items-center flex">
                  <HelpIcon tooltip="Prompt Preview"></HelpIcon>
                </div>
              </div>
            </template>

            <q-card bordered flat v-if="model.args?.inferenceEngine === 'translation'">
              <q-card-section>
                <div class="text-subtitle2">Translation Settings</div>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div class="row  q-gutter-x-sm">
                  <div class="col" v-if="model.args?.sourceLanguages">
                    <q-select :options="model.args.sourceLanguages" v-model="sourceLanguage" filled dense label="Source Language" clearable :hint="sourceLanguageHint">
                      <template v-slot:prepend>
                        <q-icon name="las la-language" />
                      </template>
                    </q-select>
                  </div>
                  <div class="col" v-if="model.args?.targetLanguages">
                    <q-select :options="model.args.targetLanguages" v-model="targetLanguage" filled dense label="Target Language" clearable :hint="targetLanguageHint">
                      <template v-slot:prepend>
                        <q-icon name="las la-language" />
                      </template>
                    </q-select>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card bordered flat v-if="hasExtraParameters" class="q-px-md bg-primary-1">
              <template v-if="parameters?.length > 0 ?? false">
                <q-card-section>
                  <div class="row">
                    <div class="col">
                      <span class="text-h6">Extra Parameters</span>
                    </div>
                  </div>
                </q-card-section>

                <template v-for="(parameter) in parameters" :key="parameter">
                  <q-expansion-item
                    :label="parameter.name" dense>

                    <q-card-section  class="q-gutter-y-sm">
                      <div class="row q-gutter-x-sm">
                        <div class="col-3">
                          <q-input dense filled square label="Parameter Name" :model-value="parameter.name" v-on:update:model-value="updateParameter(prompt, parameter, {name: $event})" />
                        </div>
                        <div class="col">
                          <q-input dense filled square label="Description" :model-value="parameter.hint" v-on:update:model-value="updateParameter(prompt, parameter, {hint: $event})" />
                        </div>
                        <div class="col-auto row">
                          <q-btn icon="las la-trash q-ml-sm q-mr-sm" color="red" flat dense @click="deleteParameter(prompt, parameter)" label="" class="float-right"/>

                          <q-btn dense icon="las la-arrow-up" color="primary" flat @click="promptStore.pushParameterOrder(prompt, parameter, -1)" label="" class="float-right"/>
                          <q-btn dense icon="las la-arrow-down" color="primary" flat @click="promptStore.pushParameterOrder(prompt, parameter, 1)" label="" class="float-right"/>

                        </div>
                      </div>

                      <div class="row q-gutter-x-sm">
                        <div class="col">
                          <q-input dense filled square label="Default value" :model-value="parameter.default" v-on:update:model-value="updateParameter(prompt, parameter, {default: $event})" />
                        </div>
                        <div class="col">
                          <q-select dense filled square label="Type" :model-value="parameter.type" :options="parameterTypes" v-on:update:model-value="updateParameter(prompt, parameter, {type: $event})" />
                        </div>
                      </div>

                      <template v-if="parameter.type === 'Select'">
                        <q-list dense class="q-mt-md">
                          <q-item v-for="(value, index) in parameter.values" :key="index">
                            <q-input dense outlined autogrow :model-value="value" v-on:update:model-value="updateParameterValue(prompt, parameter, index, $event)" class="full-width"/>
                            <q-btn icon="las la-trash" flat dense @click="deletePromptParameterValue(prompt, parameter, index)" class="text-red float-right"/>
                          </q-item>

                        </q-list>

                        <q-btn label="Add Option" icon="las la-plus" flat dense class="q-my-md" @click="addParameterValue(prompt, parameter)" />
                      </template>

                      <div class="row q-gutter-x-sm">
                        <div class="col">
                          <q-input dense filled square label="Examples:" :model-value="parameter.examples" v-on:update:model-value="updateParameter(prompt, parameter, {examples: $event})" hint="Example values, separate them by comma (,), eg: 'apple, banana'"/>
                        </div>
                      </div>


                      <div class="row q-gutter-x-sm">
                        <div class="col">
                          <q-input dense filled square label="Prefix with" :model-value="parameter.prefixWith" v-on:update:model-value="updateParameter(prompt, parameter, {prefixWith: $event})" hint="This text is inserted before the parameter."/>
                        </div>
                        <div class="col">
                          <q-input dense filled square label="Suffix with" :model-value="parameter.suffixWith" v-on:update:model-value="updateParameter(prompt, parameter, {suffixWith: $event})" hint="This text is inserted after the parameter."/>
                        </div>
                      </div>

                      <q-checkbox :model-value="parameter.required ?? false" v-on:update:model-value="updateParameter(prompt, parameter, {required: $event})" label="Required (parameter must be set before executing prompt)" />
                    </q-card-section>


                  </q-expansion-item>
                </template>




              </template>
              <q-card-actions>
                <q-btn label="Add parameter" outline icon="las la-plus" flat dense @click="addParameter(prompt)"/>
              </q-card-actions>
            </q-card>


          </q-card-section>

          <q-card-section class="q-pt-none" v-if="showAdvancedSettings">
            <q-expansion-item label="Advanced" switch-toggle-side dense>
              <q-card bordered>
                <q-card-section class="q-gutter-y-md">
                  <div class="row q-gutter-x-md">
                    <div class="col-auto">
                      <q-checkbox v-model="overrideTemperature" dense label="Override temperature" />
                      <HelpIcon :tooltip="$t('tooltips.parameters.temperature')"></HelpIcon>
                    </div>
                    <div class="col-auto">
                      <q-checkbox v-model="overrideTopP" dense label="Override Top P" />
                      <HelpIcon :tooltip="$t('tooltips.parameters.topP')"></HelpIcon>
                    </div>
                    <div class="col-auto">
                      <q-checkbox v-model="overrideMaxTokens" dense label="Override Max Tokens" />
                      <HelpIcon :tooltip="$t('tooltips.parameters.maxTokens')"></HelpIcon>
                    </div>
                    <div class="col-auto">
                      <q-checkbox v-model="overridePresencePenalty" dense label="Override Presence Penalty" />
                      <HelpIcon :tooltip="$t('tooltips.parameters.presencePenalty')"></HelpIcon>
                    </div>
                    <div class="col-auto">
                      <q-checkbox v-model="overrideFrequencyPenalty" dense label="Override Frequency Penalty" />
                      <HelpIcon :tooltip="$t('tooltips.parameters.frequencyPenalty')"></HelpIcon>
                    </div>
                  </div>

                  <div v-if="overrideTemperature">
                    <q-badge>Temperature: {{ temperature }}</q-badge>
                    <HelpIcon :tooltip="$t('tooltips.parameters.temperature')"></HelpIcon>
                    <q-slider v-model="temperature" :min="0" :max="1" :step="0.01" />
                  </div>

                  <template v-if="overrideMaxTokens">
                    <q-badge>max Tokens: {{ maxTokens }}</q-badge>
                    <HelpIcon :tooltip="$t('tooltips.parameters.maxTokens')"></HelpIcon>
                    <q-slider v-model="maxTokens" :max="modelMaxTokens" dense label="Max Tokens To Generate"/>
                  </template>

                  <div v-if="overrideTopP">
                    <q-badge>Top P: {{ topP }}</q-badge>
                    <HelpIcon :tooltip="$t('tooltips.parameters.topP')"></HelpIcon>
                    <q-slider v-model="topP" :min="0" :max="1" :step="0.01" />
                  </div>

                  <template v-if="overridePresencePenalty">
                    <HelpIcon :tooltip="$t('tooltips.parameters.presencePenalty')"></HelpIcon>
                    <q-input dense outlined autogrow label="Presence Penalty" v-model="presencePenalty" />
                  </template>

                  <template v-if="overrideFrequencyPenalty">
                    <HelpIcon :tooltip="$t('tooltips.parameters.frequencyPenalty')"></HelpIcon>
                    <q-input dense outlined autogrow label="Frequency Penalty" v-model="frequencyPenalty" />
                  </template>

                </q-card-section>
              </q-card>

            </q-expansion-item>

            <q-expansion-item label="Post Execute Actions" switch-toggle-side dense v-if="allowActions">
              <q-card bordered>
                <q-card-section class="q-gutter-y-md" v-if="prompt.actions?.length > 0">
                  <q-card v-for="(action, index) in prompt.actions" :key="index">
                    <q-card-section>
                      <div class="row">
                        <div class="col">
                          <q-input dense filled square label="Action Name" :model-value="action.title" v-on:update:model-value="updateAction(prompt, action, {title: $event})" hint=""/>
                        </div>
                        <div class="col-auto row">
                          <q-btn icon="las la-trash q-ml-sm q-mr-sm" color="red" flat dense @click="deleteAction(prompt, action)" label="" class=""/>
                        </div>
                      </div>
                      <q-select dense filled square label="Type" :model-value="action.type" v-on:update:model-value="updateAction(prompt, action, {type: $event})" :options="actionTypes" emit-value>
                      </q-select>
                    </q-card-section>

                    <q-card-section v-if="action.type === 'Run Prompt'" >
                      <q-select dense filled square label="Prompt" :model-value="getPrompt(action.typeParameter)?.title" v-on:update:model-value="updateAction(prompt, action, {typeParameter: $event})" :options="runPromptTypeParameters" emit-value>
                      </q-select>
                    </q-card-section>

                    <q-card-section v-if="action.type === 'Reply'" >
                      <q-input dense filled square label="Reply Message" :model-value="action.typeParameter" v-on:update:model-value="updateAction(prompt, action, {typeParameter: $event})" hint="Message to send to AI as the reply"/>
                    </q-card-section>

                    <q-card-section v-if="action.type === 'Add to Context'" >
                      <q-select dense filled square label="Context" :model-value="action.typeParameter" v-on:update:model-value="updateAction(prompt, action, {typeParameter: $event})" :options="addToContextTypeParameter" emit-value>
                      </q-select>
                    </q-card-section>

                    <q-card-section v-if="action.type === 'Save to Variable'" >
                      <q-select dense filled square label="Variable" :model-value="action.typeParameter" v-on:update:model-value="updateAction(prompt, action, {typeParameter: $event})" :options="saveToVariableVariables" emit-value>
                      </q-select>
                    </q-card-section>
                  </q-card>
                </q-card-section>
                <q-card-actions>
                  <q-btn label="Add action" outline icon="las la-plus" flat dense @click="addAction(prompt)"/>
                </q-card-actions>
              </q-card>
            </q-expansion-item>

            <q-expansion-item label="Multiple Prompt Executions" switch-toggle-side dense v-if="allowMultipleRuns">
              <q-card bordered>
                <q-card-section v-if="showPromptResultCount">
                  <div  class="row">
                    <div class="col">
                      <q-input dense filled square label="Promp Result Count" v-model="overridePromptTimes" type="number" :shadow-text="overridePromptTimes?.length === 0 ? 'Using default from model' : ''" />
                    </div>
                    <div class="col-auto flex items-center">
                      <HelpIcon tooltip="How many times is the prompt executed. Use value > 1 to prompt multiple times so that you can choose the result you like the best."></HelpIcon>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section>
                  <div class="row">
                    <div class="col">
                      <q-checkbox v-model="enablePromptRuns" dense label="Enable Prompt Runs" />
                    </div>
                    <div class="col-auto flex items-center">
                      <HelpIcon tooltip="Allows you to run multiple prompts when you trigger this prompt, chaining one after another. For example, one prompt can feed input into another prompt."></HelpIcon>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section v-if="enablePromptRuns" class="">
                  <div class="text-subtitle2">Prompt runs:</div>

                  <div class="full-width" bordered>
                    <q-card v-for="(run, index) in prompt.runs" :key="index" class="q-mb-sm">
                      <q-card-section>
                        <div class="row q-gutter-x-sm full-width">
                          <div class="col-auto flex items-center q-mr-md">
                            <q-input v-model="run.name" label="name" filled dense square/>
                          </div>

                          <div class="col-auto column items-center">
                            <q-checkbox v-model="run.changeModel" label="Change model" dense />
                          </div>

                          <div class="col-auto column items-center">
                            <q-checkbox v-model="run.changeTemperature" label="Change temperature" dense />
                          </div>

                          <div class="col-auto column items-center">
                            <q-checkbox v-model="run.changePrompts" label="Set prompts" dense />
                          </div>

                          <div class="col">

                          </div>

                          <div class="col-auto flex items-center">
                            <q-btn icon="las la-trash" flat color="red" @click="promptStore.removePromptRun(prompt, run)" />
                          </div>
                        </div>

                        <div class="row q-gutter-x-sm full-width q-mt-sm">
                          <div class="col-auto ">
                            <q-select v-if="run.changeModel" v-model="run.changeModelValue" filled dense label="Model" :options="models" emit-value />
                          </div>

                          <div class="col-auto">
                            <q-badge v-if="run.changeTemperature">Temperature: {{ run.changeTemperatureValue }}</q-badge>
                            <q-slider v-if="run.changeTemperature" v-model="run.changeTemperatureValue" :min="0" :max="1" :step="0.01" />
                          </div>
                        </div>

                        <div class="row q-gutter-x-sm full-width q-mt-sm" v-if="run.changePrompts">
                          <div class="col">
                            <CodeEditor v-model="run.systemPrompt" :parameters="parameters" label="System Prompt" />
                          </div>

                          <div class="col">
                            <CodeEditor v-model="run.userPrompt" :parameters="parameters" label="User Prompt" />
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                  <q-btn color="primary" icon="las la-plus" label="Add run" @click="promptStore.addPromptRun(prompt)" class="q-mx-md q-mt-md q-mb-md"/>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-card-section>
          <q-card-actions>
            <q-btn label="Export" unelevated @click="exportPrompt()"  />
          </q-card-actions>
        </q-card>
      </q-slide-transition>
    </q-card-section>

  </q-card>
</template>

<script setup>
import {computed, ref} from "vue";
import {usePromptStore} from "stores/prompt-store";
import HelpIcon from "components/Common/HelpIcon.vue";
import ColorPicker from "components/Common/ColorPicker.vue";
import {applyPromptFormatPrefixSuffix, exportPromptToJson} from "src/common/helpers/promptHelper";
import {Dialog} from "quasar";
import IconPicker from "components/Common/IconPicker.vue";
import {useFileStore} from "stores/file-store";
import CodeEditor from "components/Common/Editors/CodeEditor.vue";
import InputWithAi from "components/Common/InputWithAi.vue";
import {
  allPromptContexts
} from "src/common/resources/promptContexts";

  const promptStore = usePromptStore();
  const fileStore = useFileStore();

  const props = defineProps({
    prompt: {
      type: Object,
      required: true,
    },
    startExpanded: {
      type: Boolean,
      default: false,
    }
  });

  const promptTypes = [
    {label: "General Prompt", value: "general", description: "Prompt can be used everywhere, with or without selecting any text.", icon: "mdi-creation"},
    {label: "Insert Prompt", value: "insert", description: "Prompt can be triggered when you click in empty space, with no text selected.", icon: "las la-plus"},
    {label: "Selection Prompt", value: "selection", description: "Prompt can be triggered only when you select some text.", icon: "las la-text-width"},
    {label: "Chat Prompt", value: "chat", description: "Prompt is only available in Chat tab.", icon: "mdi-chat"},
    //{label: "Selection Analysis Prompt", value: "selectionAnalysis", description: "Prompt will be automatically triggered every time you select some text.", icon: "mdi-chart-timeline-variant-shimmer"},
  ]

  const promptStyles = [
    {label: "None", value: "none"},
    {label: "Change (show colored differences)", value: "change"},
    {label: "Generate (generates new text)", value: "generate"},
    {label: "Brainstorm", value: "brainstorm"},
    {label: "Mermaid", value: "mermaid"},
  ]

  const actionTypes = [
    { label: "Add to Context", value: "Add to Context" },
    { label: "Run Prompt", value: "Run Prompt" },
    { label: "Reply", value: "Reply" },
    { label: "Save to Variable", value: "Save to Variable" },
  ];

  const contextTypes = computed(() => {
    const values = allPromptContexts;

    return values.map(v => ({
      label: v.label,
      value: v.id,
      color: v.color,
    }));
  });

  const saveToVariableVariables = computed(() => {
    return fileStore.variables.map(v => ({label: v.title, value: v.title}));
  });

  const addToContextTypeParameter = computed(() => {
    return promptStore.contextTypes.map(t => ({label: t.label, value: t.label}));
  });

  const runPromptTypeParameters = computed(() => {
    return promptStore.prompts.map(t => ({label: t.title + ' (' + getModel(t.modelId)?.name + ')', value: t.id}));
  });

  function getModel(modelId) {
    return promptStore.getModel(modelId);
  }

  const newPromptCategories = ref([]);

  const settingsExpanded = ref(props.startExpanded);

  const tabs = computed(() => promptStore.tabs.map(tab => ({label: tab.title, value: tab.id})));
  const models = computed(() => promptStore.models.map(tab => ({label: tab.name, value: tab.id})));

  const showAdvancedSettings = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    return true;
  });

  const showPromptType = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    //if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const allowPromptCategorization = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const allowActions = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const allowMultipleRuns = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const canChangeContextTypes = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const showPromptResultCount = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    return true;
  });

  const showUserPrompt= computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    return true;
  });

  const showPromptToggles = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const showPromptUiStyle = computed(() => {
    const model = promptStore.getModel(props.prompt.modelId);

    if(model.args?.inferenceEngine === 'translation') return false;

    if(props.prompt.promptType === 'chat') return false;

    return true;
  });

  const title = computed({
    get: () => props.prompt.title,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {title: value});
    }
  });

  const systemPrompt = computed({
    get: () => props.prompt.systemPrompt,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {systemPrompt: value});
    }
  });

  const defaultContextTypes = computed({
    get: () => props.prompt.defaultContextTypes,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {defaultContextTypes: value});
    }
  });

  const excludedContextTypes = computed({
    get: () => props.prompt.excludedContextTypes,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {excludedContextTypes: value});
    }
  });

  const promptCategories = computed(() => {
    return promptStore.getCategories().concat(newPromptCategories.value);
  });

  const promptCategory = computed({
    get: () => props.prompt.category ?? "",
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {category: value});
    }
  });

  const promptFolder = computed({
    get: () => props.prompt.folder ?? "",
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {folder: value});
    }
  });

  const promptStyle = computed({
    get: () => props.prompt.promptStyle ?? promptStyles[0].value,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {promptStyle: value.value});
    }
  });

  const color = computed({
    get: () => props.prompt.color,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {color: value});
    }
  });

  const icon = computed({
    get: () => props.prompt.icon ?? "las la-icons",
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {icon: value});
    }
  });

  const modelId = computed({
    get: () => {
      const t = promptStore.getModel(props.prompt.modelId);
      return {
        label: t.name,
        value: t.id,
      };
    },
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {modelId: value});
    }
  });

  const model = computed(() => promptStore.getModel(props.prompt.modelId));

  const userPrompt = computed({
    get: () => props.prompt.userPrompt,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {userPrompt: value});
    }
  });

  const assistantPrompt = computed({
    get: () => props.prompt.assistantPrompt,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {assistantPrompt: value});
    }
  });

  const userPrompt2 = computed({
    get: () => props.prompt.userPrompt2,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {userPrompt2: value});
    }
  });

  const enabled = computed({
    get: () => props.prompt.enabled,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {enabled: value});
    }
  });

  const description = computed({
    get: () => props.prompt.description,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {description: value});
    }
  });

  const promptInput = computed(() => {
    let retValue = '';

    if(props.prompt.systemPrompt) {
      retValue += '\n System Prompt: \n';
      retValue += props.prompt.systemPrompt;
    }

    if(props.prompt.userPrompt) {
      retValue += '\n User Prompt: \n';
      retValue += props.prompt.userPrompt;
    }

    return retValue;
  });

  const guide = computed({
    get: () => props.prompt.guide,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {guide: value});
    }
  });

  const sourceLanguage = computed({
    get: () => props.prompt.sourceLanguage,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {sourceLanguage: value});
    }
  });

  const sourceLanguageHint = computed(() => {
    if(!props.prompt.sourceLanguage) {
      return 'Source language will be detected automatically.';
    }

    return '';
  })

  const targetLanguageHint = computed(() => {
    if(!props.prompt.targetLanguage) {
      return 'No value selected = it will ask you every time.';
    }

    return '';
  })

  const targetLanguage = computed({
    get: () => props.prompt.targetLanguage,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {targetLanguage: value});
    }
  });


  const overridePromptTimes = computed({
    get: () => props.prompt.overridePromptTimes,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {overridePromptTimes: value});
    }
  });

  const promptType = computed({
    get: () => {
      return promptTypes.find(t => t.value === props.prompt.promptType);
    },
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {promptType: value.value});
    }
  });

  const overrideSystemPrompt = computed({
    get: () => props.prompt.overrideSystemPrompt,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {overrideSystemPrompt: value});
    }
  });

  const hasExtendedChatMessages = computed({
    get: () => props.prompt.hasExtendedChatMessages ?? false,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {hasExtendedChatMessages: value});
    }
  });

  const overridePromptFormat = computed({
    get: () => props.prompt.overridePromptFormat,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {overridePromptFormat: value});
    }
  });

  const overrideContexts = computed({
    get: () => props.prompt.overrideContexts ?? false,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {overrideContexts: value});
    }
  });

  const systemPromptPrefix = computed({
    get: () => props.prompt.systemPromptPrefix,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {systemPromptPrefix: value});
    }
  });

  const systemPromptSuffix = computed({
    get: () => props.prompt.systemPromptSuffix,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {systemPromptSuffix: value});
    }
  });

  const userPromptPrefix = computed({
    get: () => props.prompt.userPromptPrefix,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {userPromptPrefix: value});
    }
  });

  const userPromptSuffix = computed({
    get: () => props.prompt.userPromptSuffix,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {userPromptSuffix: value});
    }
  });

  const assistantPromptPrefix = computed({
    get: () => props.prompt.assistantPromptPrefix,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {assistantPromptPrefix: value});
    }
  });

  const assistantPromptSuffix = computed({
    get: () => props.prompt.assistantPromptSuffix,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {assistantPromptSuffix: value});
    }
  });

  function getPrompt(promptId) {
    return promptStore.getPromptById(promptId);
  }

  const showPromptFormat = computed(() => {
    let model = promptStore.getModel(props.prompt.modelId);

    return model.args?.apiCallType === 'raw';
  })

  const promptFormat = computed(() => {
    let model = promptStore.getModel(props.prompt.modelId);
    let systemPrefix = props.prompt.overridePromptFormat ? props.prompt.systemPromptPrefix ?? '' : model.defaultSystemPromptPrefix;
    let systemSuffix = props.prompt.overridePromptFormat ? props.prompt.systemPromptSuffix ?? '' : model.defaultSystemPromptSuffix;
    let systemPrompt = props.prompt.overrideSystemPrompt ? props.prompt.systemPrompt ?? '' : model.defaultSystemPrompt;
    let userPrefix = props.prompt.overridePromptFormat ? props.prompt.userPromptPrefix ?? '' : model.defaultUserPromptPrefix;
    let userSuffix = props.prompt.overridePromptFormat ? props.prompt.userPromptSuffix ?? '' : model.defaultUserPromptSuffix;
    let userPrompt = props.prompt.userPrompt;
    let assistantPrefix = props.prompt.overridePromptFormat ? props.prompt.assistantPromptPrefix ?? '' : model.defaultAssistantPromptPrefix;
    let assistantSuffix = props.prompt.overridePromptFormat ? props.prompt.assistantPromptSuffix ?? '' : model.defaultAssistantPromptSuffix;

    return applyPromptFormatPrefixSuffix(systemPrefix, systemSuffix, systemPrompt, userPrefix, userSuffix, userPrompt, assistantPrefix, assistantSuffix);
  })

  const hasExtraParameters = computed({
    get: () => props.prompt.hasParameters,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {hasParameters: value});
    }
  });

  const overrideTopP = computed({
    get: () => props.prompt.settings.overrideTopP ?? false,
    set: (value) => {
      promptStore.updatePrompt(props.prompt, {overrideTopP: value});
    }
  });

  const overrideTemperature = computed({
    get: () => props.prompt.settings.overrideTemperature ?? false,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {overrideTemperature: value});
    }
  });

  const overrideMaxTokens = computed({
    get: () => props.prompt.settings.overrideMaxTokens ?? false,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {overrideMaxTokens: value});
    }
  });

  const enablePromptRuns = computed({
    get: () => props.prompt.enablePromptRuns ?? false,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {enablePromptRuns: value});
    }
  });

  const overridePresencePenalty = computed({
    get: () => props.prompt.settings.overridePresencePenalty ?? false,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {overridePresencePenalty: value});
    }
  });

  const overrideFrequencyPenalty = computed({
    get: () => props.prompt.settings.overrideFrequencyPenalty ?? false,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {overrideFrequencyPenalty: value});
    }
  });

  const temperature = computed({
    get: () => props.prompt.settings.temperature ?? 0.7,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {temperature: value});
    }
  });

  const maxTokens = computed({
    get: () => props.prompt.settings.maxTokens ?? 4096,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {maxTokens: value});
    }
  });

  const modelMaxTokens = computed(() => {
    return promptStore.getModel(props.prompt.modelId)?.defaultMaxTokens ?? 0;
  });

  const topP = computed({
    get: () => props.prompt.settings.topP ?? 0.9,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {topP: value});
    }
  });

  const frequencyPenalty = computed({
    get: () => props.prompt.settings.frequencyPenalty ?? 0,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {frequencyPenalty: value});
    }
  });

  const presencePenalty = computed({
    get: () => props.prompt.settings.presencePenalty ?? 0,
    set: (value) => {
      console.log(value);
      promptStore.updatePrompt(props.prompt, {presencePenalty: value});
    }
  });

  const parameters = computed(() => {
    return props.prompt.parameters;
  });

  const parameterTypes = [
    'Text',
    'Select',
  ]

  function updateParameter(prompt, parameter, args) {
    promptStore.updatePromptParameter(prompt, parameter, args);
  }

  function addParameterValue(prompt, parameter) {
    promptStore.addPromptParameterValue(prompt, parameter);
  }

  function updateParameterValue(prompt, parameter, index, value) {
    promptStore.updateParameterValue(prompt, parameter, index, value);
  }

  function deletePromptParameterValue(prompt, parameter, index) {
    promptStore.deletePromptParameterValue(prompt, parameter, index);
  }

  function addParameter(prompt) {
    promptStore.addPromptParameter(prompt);
  }

  function addAction(prompt) {
    promptStore.addPromptAction(prompt);
  }

  function deleteAction(prompt, action) {
    promptStore.deletePromptAction(prompt, action);
  }

  function updateAction(prompt, action, args) {
    promptStore.updatePromptAction(prompt, action, args);
  }

  function deleteParameter(prompt, parameter) {
    promptStore.deletePromptParameter(prompt, parameter);
  }

  function exportPrompt() {
    let json = exportPromptToJson([props.prompt]);

    const obj = JSON.parse(json);

    if(obj.length === 1) {
      json = JSON.stringify(obj[0], null, 2);
    }

    Dialog.create({
      title: 'Export prompt',
      message: 'Copy the prompt JSON below and save it to a file.',
      html: true,
      prompt: {
        model: json,
        type: 'text' // optional
      },
      ok: 'Copy',
      cancel: 'Close',
    }).onOk(() => {
      navigator.clipboard.writeText(json);
    });
  }
</script>

<style scoped>

</style>
