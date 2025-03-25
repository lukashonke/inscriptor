<template>

  <bubble-menu :editor="editor" :tippy-options="{ duration: 100 }" v-if="editor">
    <q-card class="bubble-menu">
      <q-card-section class="q-pa-xs q-gutter-xs">
        <div class="row q-gutter-x-xs">
          <div class="col-auto">
            <q-btn @click="promptResultInlinePrompt(promptResult.prompt, 'Expand')" label="Expand" no-caps size="12px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-white" color="primary">
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn @click="promptResultInlinePrompt(promptResult.prompt, 'Explain')" label="Explain" no-caps size="12px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-white" color="primary">
            </q-btn>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <q-input square autofocus dense filled v-model="inlineReactText" label="Instruction" />
          </div>
          <div class="col-auto flex items-center">
            <q-btn @click="promptResultInlinePrompt(promptResult.prompt, inlineReactText)" no-caps size="12px" dense flat icon="mdi-send" padding="4px 6px" class="bg-white" color="primary">
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </bubble-menu>

  <template v-if="showAsChat">
    <q-card flat ref="myHoverableElement" class="bg-grey-4" :class="classes">
      <q-card-section>
        <div class="write-serif">
          You:
          <contenteditable tag="span" ref="userPromptInput" contenteditable="true" v-model="promptResultInput" :no-html="false">
          </contenteditable>
        </div>
      </q-card-section>

    </q-card>
  </template>

  <transition appear enter-active-class="animated fadeIn slow" leave-active-class="animated fadeOut">

    <q-card bordered ref="myHoverableElement" :class="isReactionToAnotherPrompt ? 'q-ml-md' : ''">
      <div class="prompt-actions sticky-top">
        <div class="row no-wrap ellipsis">
          <div class="col-auto">
            <q-btn color="primary" flat unelevated size="sm" :icon="type === 'inline' ? 'las la-plus' : 'las la-angle-double-left'" @click="insert" :loading="copying">
              <q-tooltip :delay="1000">
                Click to insert
              </q-tooltip>
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn color="primary" flat unelevated size="sm" icon="las la-copy" v-if="type !== 'inline'">
              <q-menu>
                <q-list dense>
                  <template v-if="!hasImages">
                    <q-item clickable @click="copyToClipboard($event)">
                      <q-item-section side>
                        <q-icon name="las la-clipboard" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Copy to clipboard
                      </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="copyToVariable($event, variable)" v-for="variable in variables" :key="variable.title">
                      <q-item-section side>
                        <q-icon name="las la-cogs" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Copy to variable ${{variable.title}}
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-if="hasImages">
                    <q-separator />
                    <q-item clickable @click="copyToFileImage($event)">
                      <q-item-section side>
                        <q-icon name="las la-image" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Copy to file cover image
                      </q-item-section>
                    </q-item>
                  </template>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <div class="col ellipsis">
            <q-badge class="q-ml-md q-gutter-x-xs">
              <span>{{ promptResultTitle }}</span>
              <span><q-icon name="las la-microchip" v-if="promptResultModel" /> {{ promptResultModel }}</span>
              <span><q-icon v-if="promptResultTemperature" name="mdi-thermometer-low" /> {{ promptResultTemperature }}</span>
            </q-badge>
          </div>

          <div class="col-auto" v-if="collapsed">
            <q-btn color="primary" flat unelevated size="sm" :icon="collapsed ? 'las la-plus-square' : 'las la-minus-square'" @click="collapsed = !collapsed">
            </q-btn>
          </div>

          <div class="col-auto" v-if="hasClose">
            <q-btn color="primary" flat unelevated size="sm" icon="las la-times" @click="onClose">
            </q-btn>
          </div>
          <div class="col-auto" v-else>
            <div class="col-auto">
              <q-btn color="primary" flat unelevated size="sm" icon="las la-ellipsis-v">
                <q-menu>
                  <q-list dense>
                    <q-item clickable @click="expanded = !expanded; collapsed = false">
                      <q-item-section side>
                        <q-icon name="las la-expand-arrows-alt" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        {{ expanded ? 'Collapse' : 'Expand' }}
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="collapsed = !collapsed" v-if="!isPrompting && type !== 'inline'">
                      <q-item-section side>
                        <q-icon :name="collapsed ? 'las la-plus-square' : 'las la-minus-square'" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        {{ collapsed ? 'Maximize' : 'Minimize' }}
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="htmlViewOverride = !(htmlView ?? defaultHtmlView)">
                      <q-item-section side>
                        <q-icon name="mdi-view-agenda-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Raw view
                      </q-item-section>
                    </q-item>
                    <q-item clickable @click="editEnabled = !editEnabled">
                      <q-item-section side>
                        <q-icon name="mdi-pen" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Edit
                      </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="removePromptResult($event)" v-if="!isPrompting && type !== 'inline'" class="text-negative">
                      <q-item-section side>
                        <q-icon name="las la-trash" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        Delete
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
          <div class="col-auto">
            <q-btn class="float-right" flat color="warning" unelevated size="sm" icon="las la-stop" @click.prevent="stopPrompting($event)" v-if="isPrompting">
              <q-tooltip>Stop</q-tooltip>
            </q-btn>
          </div>
          <!--<q-btn class="float-right" flat color="primary" unelevated size="sm" icon="las la-robot" v-if="!isPrompting">
          <q-tooltip>Prompt this</q-tooltip>
          <q-menu>
            <q-card>
              <PromptSelector prompt-types="inline" @promptClick="promptClick"></PromptSelector>
            </q-card>
          </q-menu>
        </q-btn>-->
        </div>
        <q-separator />
      </div>
      <q-card-section v-if="collapsed === false">
        <q-spinner-grid v-if="promptResult.waitingForResponse" />

        <div class="q-pa-none" :class="classes">
          <template v-if="hasImages">
            <q-img v-for="(image, index) in promptResult.images" :src="imageUrl(image)" :key="index" fit="contain" height="400px" />
          </template>

          <div v-if="hasAppendMessages" class="cursor-pointer">
            <div v-if="!appendMessagesExpanded" class="write-serif bg-grey-4 q-pa-none q-my-sm cursor-pointer" @click="appendMessagesExpanded = true">
              You: {{ lastUserAppendMessage.text }}
              <span class="text-italic">({{ appendMessagesCount}} more messages)</span>
            </div>

            <div v-if="appendMessagesExpanded" @click="appendMessagesExpanded = false">
              <div v-for="(message, index) in promptResult.appendMessages" :key="index">
                <div v-if="message.type === 'assistant'" class="write-serif all-border" v-html="message.text" />
                <div v-if="message.type === 'user'" class="bg-grey-4 all-border">
                  You:
                  <span :class="writeClasses" v-html="message.text" />
                </div>
              </div>
            </div>
          </div>

          <template v-if="promptResult.prompt.promptStyle === 'brainstorm'">
            <template v-if="promptBrainstormValueTree != null && promptBrainstormValueTree.length > 0">
              <q-card v-for="(idea, index) in promptBrainstormValueTree" :key="index" flat class="no-margin">
                <q-card-section class="q-px-sm q-py-none">
                  <div class="prompt-brainstorm-idea">
                    <q-btn @click="promptBrainstormValueTree.splice(index, 1)" flat size="sm" class="float-right" icon="las la-times" color="negative" dense />
                    <span v-html="markdownToHtml(idea.text)"></span>

                    <div class="full-width flex q-my-xs prompt-brainstorm-actions">
                      <template v-if="!idea.loading">
                        <q-btn flat padding="xs xs" no-caps color="primary" size="sm" icon="mdi-creation-outline" label="Expand" @click="promptTreeRespond(idea, 'Create ideas that are building on this idea')" class="q-mr-md"/>
                        <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Similar" @click="promptTreeRespond(idea, 'Create ideas similar to this idea')"  class="q-mr-md"/>
                        <template v-if="idea.customReplyEnabled">
                          <q-input v-model="idea.customReply" filled dense square autofocus autogrow/>
                          <q-btn flat padding="xs sm" no-caps color="primary" icon="las la-reply" size="sm" @click="idea.customReplyEnabled = false; promptTreeRespond(idea, 'Perform this custom instruction - \'' + idea.customReply + '\'')" class="q-mr-sm"/>
                          <q-btn flat padding="xs sm" no-caps color="primary" icon="las la-times" size="sm" @click="idea.customReplyEnabled = false"  class="q-mr-sm"/>
                        </template>
                        <template v-else>
                          <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Reply" @click="idea.customReplyEnabled = true"  class="q-mr-sm"/>
                        </template>

                      </template>
                    </div>

                    <q-card v-if="idea.children && idea.children.length > 0" bordered flat class="bg-grey-1 q-py-md q-mb-md">
                      <template v-for="(child, i) in idea.children " :key="i">
                        <q-card-section class="q-px-md q-py-none" >
                          <q-btn @click="idea.children.splice(i, 1)" flat size="sm" class="float-right" icon="las la-times" color="negative" dense />
                          <span v-html="markdownToHtml(child.text)" class=""></span>


                          <div class="full-width flex q-my-xs prompt-brainstorm-actions">
                            <template v-if="!child.loading">
                              <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Expand" @click="promptTreeRespond(child, 'Create ideas that are expanding on this idea')"  class="q-mr-sm"/>
                              <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Similar" @click="promptTreeRespond(child, 'Create ideas similar to this idea')"  class="q-mr-sm"/>
                              <template v-if="child.customReplyEnabled">
                                <q-input v-model="child.customReply" filled dense square autofocus autogrow/>
                                <q-btn flat padding="xs sm" no-caps color="primary" icon="las la-reply" size="sm" @click="child.customReplyEnabled = false; promptTreeRespond(child, 'Perform this custom instruction - \'' + child.customReply + '\'')" class="q-mr-sm"/>
                                <q-btn flat padding="xs sm" no-caps color="primary" icon="las la-times" size="sm" @click="child.customReplyEnabled = false"  class="q-mr-sm"/>
                              </template>
                              <template v-else>
                                <q-btn flat padding="xs xs" no-caps color="primary" icon="mdi-creation-outline" size="sm" label="Reply" @click="child.customReplyEnabled = true"  class="q-mr-sm"/>
                              </template>
                            </template>
                          </div>
                          <div v-if="child.loading">
                            <q-spinner-grid class="q-mt-sm q-mb-md" />
                          </div>

                          <q-card v-if="child.children && child.children.length > 0" bordered flat class="q-mt-md bg-blue-grey-1 q-mb-md">

                            <template v-for="(childChild, ii) in child.children " :key="ii">
                              <q-card-section class="q-pa-md">
                                <q-btn @click="child.children.splice(ii, 1)" flat size="sm" class="float-right" icon="las la-times" color="negative" dense />
                                <span v-html="markdownToHtml(childChild.text)"></span>
                              </q-card-section>
                            </template>
                          </q-card>

                        </q-card-section>
                      </template>
                    </q-card>

                  </div>
                  <div v-if="idea.loading">
                    <q-spinner-grid class="q-mt-sm q-mb-md" />
                  </div>
                </q-card-section>
              </q-card>
            </template>
            <template v-else>
              <div v-html="formatPendingBrainstormingPrompt(promptResultText)" />
            </template>
          </template>
          <template v-else-if="promptResult.prompt.promptStyle === 'mermaid'">
            <vue-mermaid-string :value="promptResult.text" :options="{ securityLevel: 'loose' }"/>
          </template>
          <template v-else>
            <q-input v-if="!hasImages && editEnabled" filled dense square v-model="promptResultText" type="textarea"
              autogrow />
            <template v-else-if="promptResultText">
              <contenteditable tag="div" :class="writeClasses" class="no-outline" v-model="promptResultText"
                v-if="!hasImages && !htmlView" ref="promptResultRef" contenteditable="false" spellcheck="false"
                :no-html="false">
              </contenteditable>

              <div>
                <editor-content :editor="editor" spellcheck="false" class="no-outline" :class="writeClasses"
                  v-if="htmlView" />
              </div>

            </template>
          </template>
        </div>

        <div v-if="promptResult.error">
          <span class="text-negative">
            <q-icon name="las la-exclamation-triangle" />
            Error while prompting: {{ promptResult.error }}
          </span>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions v-if="type === 'inline'">
        <q-btn class="text-weight-bold" label="Reply" flat color="primary" unelevated size="sm" icon="las la-reply" @click.prevent="toggleReply()" :loading="replyLoading">
          <q-tooltip>Reply on this prompt to AI</q-tooltip>
        </q-btn>
      </q-card-actions>

      <q-card-actions
        v-if="!isPrompting && allowRegenerate && collapsed === false && promptResult.prompt.promptType !== 'chat'"
        class="row">
        <q-btn class="text-weight-bold" label="Reply" flat color="primary" unelevated size="sm" icon="las la-reply" @click.prevent="toggleReply()">
          <q-tooltip>Reply on this prompt to AI</q-tooltip>
        </q-btn>



        <div class="col q-ml-md">
          <q-btn class="col-auto text-weight-bold" flat color="primary" unelevated size="sm"
            @click.prevent="generateFollowUpQuestions()" icon="mdi-creation-outline"
            v-if="promptStore.getPredefinedPromptId('Prompt Follow-Up Generator')"
            :loading="promptStore.isPrompting && promptStore.isSilentPrompting">
            <q-tooltip>
              Generate Follow-up questions
            </q-tooltip>
          </q-btn>
          <template v-if="promptResult.followUpQuestions">
            <template v-for="question in promptResult.followUpQuestions" :key="question.title">
              <q-btn class="col-auto text-weight-bold" :label="question.title" flat color="accent" unelevated size="sm"
                @click.prevent="doPromptAction({type: 'Reply', typeParameter: question.followUp})">
                <q-tooltip>
                  Reply: '{{ question.followUp }}'
                </q-tooltip>
              </q-btn>
            </template>
            <q-btn class="col-auto text-weight-bold" flat color="primary" unelevated size="sm"
              @click.prevent="removeFollowUpQuestions()" icon="las la-times">
            </q-btn>
          </template>
          <template v-else>
            <template v-for="(promptAction, index) in promptResult.prompt.actions ?? []" :key="index">
              <q-btn class="col-auto text-weight-bold" :label="promptAction.title" flat color="primary" unelevated
                size="sm" @click.prevent="doPromptAction(promptAction)" :icon="getPromptActionIcon(promptAction)">
                <q-tooltip v-if="promptAction.type === 'Add to Context'">
                  Add this text to a file with context '{{promptAction.typeParameter}}'
                </q-tooltip>
                <q-tooltip v-if="promptAction.type === 'Run Prompt'">
                  Runs prompt with this text as input
                </q-tooltip>
                <q-tooltip v-if="promptAction.type === 'Save to Variable'">
                  Saves this text to a variable
                </q-tooltip>
                <q-tooltip v-if="promptAction.type === 'Reply'">
                  Reply: '{{ promptAction.typeParameter }}'
                </q-tooltip>
              </q-btn>
            </template>
          </template>
        </div>

        <q-space />

        <q-btn class="text-weight-bold float-right" label="Prompt Again" flat color="primary" unelevated size="sm"
          icon="las la-sync" @click.prevent="regeneratePrompt($event, false)">
          <q-tooltip>Generate this prompt again</q-tooltip>
        </q-btn>

        <q-btn v-if="!promptResult.prompt.enablePromptRuns" class="text-weight-bold float-right" flat color="primary"
          unelevated size="sm" icon="arrow_drop_down">
          <q-menu>
            <q-list dense>

              <q-item clickable v-ripple>
                <q-item-section>Prompt with creativity...</q-item-section>
                <q-item-section side>
                  <q-icon name="keyboard_arrow_right" />
                </q-item-section>

                <q-menu anchor="top end" self="top start">
                  <q-list dense>
                    <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 1)">
                      <q-item-section side>
                        <q-icon name="mdi-palette" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Very Creative (temperature 1)</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 0.8)">
                      <q-item-section side>
                        <q-icon name="mdi-palette-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Creative (temperature 0.8)</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 0.5)">
                      <q-item-section side>
                        <q-icon name="mdi-keyboard-outline" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Deterministic (temperature 0.5)</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup @click="regeneratePrompt($event, false, 0)">
                      <q-item-section side>
                        <q-icon name="mdi-keyboard" size="xs" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Very Deterministic (temperature 0)</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-item>

              <q-item clickable v-ripple>
                <q-item-section>Prompt using model...</q-item-section>
                <q-item-section side>
                  <q-icon name="keyboard_arrow_right" />
                </q-item-section>

                <q-menu anchor="top end" self="top start">
                  <q-list>


                    <q-item v-for="model in promptStore.models" :key="model"
                      @click="regeneratePrompt($event, false, undefined, model)" dense clickable>
                      <q-item-section side>
                        <q-icon name="las la-microchip" size="xs" />
                      </q-item-section>
                      <q-item-section>{{ model.name }}</q-item-section>
                    </q-item>

                  </q-list>
                </q-menu>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

      </q-card-actions>

      <q-slide-transition>
        <div v-show="reactExpanded" class="row q-mx-md q-mb-md">
          <div class="col q-mr-sm">
            <q-input v-model="reactInput" filled dense square label="Message" autofocus autogrow ref="reactInputRef" @keyup="onReplyKeyup" />
          </div>
          <div class="col-auto">
            <q-btn icon="las la-reply" @click="promptReactClick(promptResult.prompt)" color="primary" />
          </div>
        </div>
      </q-slide-transition>

      <q-menu touch-position context-menu>
        <q-card>
          <PromptSelector prompt-types="selection" @promptClick="promptClick"></PromptSelector>
        </q-card>
      </q-menu>
    </q-card>

  </transition>
</template>

<script setup>
  import {useTextSelection} from '@vueuse/core'
  import mermaid from 'mermaid';
  import {computed, ref, watch, watchEffect} from "vue";

  import { writeText } from '@tauri-apps/plugin-clipboard-manager';
  import {usePromptStore} from "stores/prompt-store";
  import {executePromptClick} from "src/common/helpers/promptHelper";
  import {
    convertHtmlToText,
    convertToParagraphs,
    hasMultiBreaks,
    markdownToHtml,
    replaceParameterEditorText, truncate
  } from "src/common/utils/textUtils";
  import PromptSelector from "components/Common/PromptSelector/PromptSelector.vue";
  import contenteditable from 'vue-contenteditable';
  import {useFileStore} from "stores/file-store";
  import {useQuasar} from "quasar";
  import {uploadImage} from "src/common/apiServices/imageGenService";
  import {useCurrentUser} from "vuefire";
  import {useLayoutStore} from "stores/layout-store";
  import {editorTextBetween, getEditor, getEditorSelection} from "src/common/utils/editorUtils";
  import {BubbleMenu, EditorContent, FloatingMenu, useEditor} from "@tiptap/vue-3";
  import Document from "@tiptap/extension-document";
  import Paragraph from "@tiptap/extension-paragraph";
  import Text from "@tiptap/extension-text";
  import Image from "@tiptap/extension-image";
  import History from "@tiptap/extension-history";
  import {HardBreak} from "@tiptap/extension-hard-break";
  import {Link} from "@tiptap/extension-link";
  import {Underline} from "@tiptap/extension-underline";
  import {Italic} from "@tiptap/extension-italic";
  import {Bold} from "@tiptap/extension-bold";
  import {CodeBlock} from "@tiptap/extension-code-block";
  import {ListItem} from "@tiptap/extension-list-item";
  import {BulletList} from "@tiptap/extension-bullet-list";
  import {OrderedList} from "@tiptap/extension-ordered-list";
  import {Heading} from "@tiptap/extension-heading";
  import {Blockquote} from "@tiptap/extension-blockquote";
  import VueMermaidString from 'vue-mermaid-string'

  const promptStore = usePromptStore();
  const fileStore = useFileStore();
  const $q = useQuasar();

  const reactInputRef = ref();

  const props = defineProps({
    promptResult: Object,
    showAsChat: {
      type: Boolean,
      default: false,
    },
    allowRegenerate: {
      type: Boolean,
      default: false,
    },
    insertTarget: {
      type: Object,
    },
    type: {
      type: String,
      default: 'default',
    },
    hasClose: {
      type: Boolean,
      default: false,
    },
  });

  const selection = useTextSelection();

  const emits = defineEmits(['close', 'replaceSelf']);

  function onClose() {
    emits('close')
  }

  const expanded = ref(false);
  const userPromptInput = ref(null);
  const promptResultRef = ref(null);
  const reactInput = ref('');
  const reactExpanded = ref(false);
  const appendMessagesExpanded = ref(false);
  const replyLoading = ref(false);

  const collapsed = computed({
    get: () => {
      return props.promptResult.collapsed;
    },
    set: (value) => {
      const pr = props.promptResult;
      pr.collapsed = value;
    }
  })
  const defaultHtmlView = computed(() => {
    if(props.promptResult.prompt.promptStyle === 'change') {
      return false;
    }
    return true;
  });
  const htmlViewOverride = ref(null);
  const htmlView = computed(() => {
    if(htmlViewOverride.value !== null) {
      return htmlViewOverride.value;
    }
    return defaultHtmlView.value;
  });

  const editEnabled = ref(false);

  const hasImages = computed(() => {
    return props.promptResult.type === 'image' && (props.promptResult.images?.length > 0 ?? false)
    });

  const classes = computed(() => {
    return {
      //'bg-grey-1': isHovered.value,
      'prompt-card': !hasImages.value && !expanded.value,
      'prompt-card-expanded': !hasImages.value && expanded.value,
      //'prompt-card-image': hasImages.value,
    }
  });

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

      'prompt-text-editor': true,

      'prompt-results': true,
    }
  });

  const variables = computed(() => {
    return fileStore.variables;
  });

  const hasAppendMessages = computed(() => {
    return props.promptResult.appendMessages && props.promptResult.appendMessages.length > 0;
  });

  const isReactionToAnotherPrompt = computed(() => {
    return hasAppendMessages.value;
  });

  const appendMessagesCount = computed(() => {
    return props.promptResult.appendMessages.length;
  });

  const lastUserAppendMessage = computed(() => {
    const msgs = props.promptResult.appendMessages.filter(msg => msg.type === 'user');
    return msgs[msgs.length - 1] ?? null;
  });

  function imageUrl(imgName) {
    //return url + "/Files/Images/" + imgName;
    return imgName;
  }

  const promptResultInput = computed({
    get: () => {
      return props.promptResult.input;
    },
    set: (value) => {
      const pr = props.promptResult;
      pr.input = value;
    }
  });

  const inlineReactText = ref('');

  const promptBrainstormValueTree = computed(() => {
    if(isPrompting.value === true) {
      return null;
    }

    if(!props.promptResult.valueTree) {
      if(!props.promptResult.text) {
        return null;
      }

      const pr = props.promptResult;
      let tree = pr.text.split('<split/>').map(item => ({ text: item })).filter(item => item.text.trim() !== '');

      pr.valueTree = tree;

      return props.promptResult.valueTree;
    }

    return props.promptResult.valueTree;
  });

  function formatPendingBrainstormingPrompt() {
    return promptResultText.value.replaceAll('<split/>', '<br>');
  }

  const promptResultText = computed({
    get: () => {
      //console.log(props.promptResult.text);
      //return props.promptResult.text.trimStart().replace(/\n/g, '<br>');

      if(editEnabled.value === true) {
        return (props.promptResult.originalText.trimStart());
      }

      if(htmlView.value === true) {
        return markdownToHtml((props.promptResult.originalText ?? props.promptResult.text).trimStart()).replace(/\\n/g, '<br>');
      }

      const doDiff = props.promptResult.diff &&
        (!props.promptResult.prompt.promptStyle || props.promptResult.prompt.promptStyle === 'change');

      if(!doDiff) {
        return (props.promptResult.text.trimStart());
      }

      let text = '';
      for(const part of props.promptResult.diff) {

        let value = part.value;
        if(part.added) { text += '<span class="text-green-7">' + value + '</span>'; }
        //else if(part.removed) { text += '<span class="text-negative">' + part.value + '</span>';}
        else if(!part.added && !part.removed) { text += value;}
      }

      /*for (const el of props.promptResult.diff) {
        if (el[0] === 1) { text += '<span class="text-positive">' + el[1] + '</span>'; }
        //else if (el[0] === -1) { text += '<span class="text-negative">' + el[1] + '</span>'; }
        else if(el[0] === 0) { text += el[1]; }
      }*/

      return (text);
    },
    set: (value) => {
      const pr = props.promptResult;
      pr.text = value;
      pr.originalText = value;
    }
  });

  const myHoverableElement = ref()

  async function doPromptAction(action, parameter) {
    await promptStore.runPromptResultAction(props.promptResult, action, parameter);
  }

  function removeFollowUpQuestions() {
    // eslint-disable-next-line vue/no-mutating-props
    props.promptResult.followUpQuestions = null;
  }

  async function generateFollowUpQuestions() {
    const promptId = promptStore.getPredefinedPromptId('Prompt Follow-Up Generator');
    if(!promptId || promptId.length === 0 || !props.promptResult.prompt.systemPrompt) {
      return;
    }

    let followUps = null;

    for (const id of promptId) {
      const prompt = promptStore.getPromptById(id);

      let message = prompt.userPrompt;

      message = message.replaceAll('$template_systemPrompt', props.promptResult.prompt.systemPrompt);
      message = message.replaceAll('$template_aiReply', props.promptResult.originalText);

      const previousQuestions = props.promptResult.followUpQuestions;
      if(previousQuestions) {
        message = message.replaceAll('$previousFollowups', '\n\n(These follow up questions have already been provided to the user, come up with new ones: ' + JSON.stringify(previousQuestions, null, 2) + ')');
      } else {
        message = message.replaceAll('$previousFollowups', '');
      }

      message += '$$$replaceUserPrompt$$$';

      console.log(message);

      const result = await executePromptClick(prompt, message, false, null, true, null, true);

      try {
        //TODO to helper

        // remove ```json and ```
        const json = result.originalText.replace(/```json/g, '').replace(/```/g, '').trim();
        const newFollowUps = JSON.parse(json);

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
    props.promptResult.followUpQuestions = followUps;
  }

  function getPromptActionIcon(action) {
    if(action.type === 'Add to Context') {
      return 'las la-file-alt';
    }
    if(action.type === 'Run Prompt') {
      return 'mdi-creation-outline';
    }
    if(action.type === 'Save to Variable') {
      return 'las la-cogs';
    }
    if(action.type === 'Reply') {
      return undefined;
    }
    return undefined;
  }

  async function promptClick(prompt, promptType) {
    await executePromptClick(prompt, replaceParameterEditorText(promptResultText.value));
  }

  async function promptReactClick(prompt) {
    if(reactInput.value.trim() === '') return;

    const appendMessages = [];

    let overrideText = null;
    if(prompt.promptStyle === 'mermaid') {
      overrideText = props.promptResult.text;
    }

    if(props.promptResult.appendMessages) {
      appendMessages.push(...props.promptResult.appendMessages);
    }
    appendMessages.push({type: 'assistant', text: overrideText ?? convertHtmlToText(replaceParameterEditorText(promptResultText.value))});
    appendMessages.push({type: 'user', text: reactInput.value});

    reactInput.value = '';
    reactExpanded.value = false;

    promptStore.setCurrentOverridePromptParameters(props.promptResult.promptArgs.overridePromptParameters);

    if(props.type === 'inline') {
      replyLoading.value = true;

      const result = await executePromptClick(prompt, props.promptResult.input, false, appendMessages, true, null, true);
      replyLoading.value = false;

      emits('replaceSelf', result);
    } else {
      collapsed.value = true;
      await executePromptClick(prompt, props.promptResult.input, false, appendMessages, true);
    }
  }

  async function promptTreeRespond(treeItem, instruction) {
    if(!instruction) return;
    const appendMessages = [];

    if(props.promptResult.appendMessages) {
      appendMessages.push(...props.promptResult.appendMessages);
    }

    appendMessages.push({type: 'assistant', text: convertHtmlToText(replaceParameterEditorText(promptResultText.value))});
    appendMessages.push({type: 'user', text: instruction + ': ' + treeItem.text});

    promptStore.setCurrentOverridePromptParameters(props.promptResult.promptArgs.overridePromptParameters);

    replyLoading.value = true;

    treeItem.loading = true;

    const result = await executePromptClick(props.promptResult.prompt, props.promptResult.input, false, appendMessages, true, null, true);
    replyLoading.value = false;

    if(!treeItem.children) {
      treeItem.children = [];
    }

    const childTree = result.text.split('<split/>').map(item => ({ text: item })).filter(item => item.text.trim() !== '');

    treeItem.children.push(...childTree);

    treeItem.loading = false;

    return result;
  }

  async function promptResultInlinePrompt(prompt, instruction) {
    const appendMessages = [];

    if(props.promptResult.appendMessages) {
      appendMessages.push(...props.promptResult.appendMessages);
    }

    const selectedText = getSelectedText();

    appendMessages.push({type: 'assistant', text: convertHtmlToText(replaceParameterEditorText(promptResultText.value))});
    appendMessages.push({type: 'user', text: instruction + ': ' + selectedText});

    promptStore.setCurrentOverridePromptParameters(props.promptResult.promptArgs.overridePromptParameters);

    if(props.type === 'inline') {
      replyLoading.value = true;

      const result = await executePromptClick(prompt, props.promptResult.input, false, appendMessages, true, null, true);
      replyLoading.value = false;

      emits('replaceSelf', result);
    } else {
      collapsed.value = true;
      await executePromptClick(prompt, props.promptResult.input, false, appendMessages, true);
    }
  }

  function getSelectedText() {
    const { from, to, empty } = editor.value.state.selection;

    if (empty) {
      return null;
    }

    const text = editorTextBetween(editor.value.state.doc, { from, to }, '\n', '\n');

    return text;
  }

  function toggleReply() {
    reactExpanded.value = !reactExpanded.value;

    if(reactExpanded.value) {
      reactInputRef.value.focus();
    }
  }

  const copying = ref(false);

  async function insert() {
    try {
      copying.value = true;
      await insertInternal();
    } finally {
      copying.value = false;
    }
  }

  async function insertInternal() {
    let text;

    if(props.insertTarget) {
      if(htmlView.value === true) {
        text = markdownToHtml(props.promptResult.originalText);
      } else {
        text = props.promptResult.text;
      }

      props.insertTarget(text);
      emits('close')
      return;
    }

    const editor = getEditor();
    if(!editor) return;

    const { from, to, empty } = getEditorSelection();

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
    console.log(surroundedWithPTags);

    if(!empty) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .run()
    }

    const user = useCurrentUser();

    const idToken = await user.value.getIdToken();

    if(hasImages.value) {

      try {
        const newUrl = await uploadImage(idToken, props.promptResult.images[0], useCurrentUser().value.uid);
        text = '<img src=\"' + newUrl + '\" ></img>';
      } catch (error) {
        return;
      }

    } else {

      if(htmlView.value === true) {
        text = markdownToHtml(props.promptResult.originalText);
      } else {
        text = props.promptResult.text;

        if(surroundedWithPTags || hasMultiBreaks(text)) {
          //text = "<p>" + text + "</p>";
          text = convertToParagraphs(text);
        }
      }
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
  async function copyToClipboard(event) {
    event.stopPropagation();
    await writeText(replaceParameterEditorText(promptResultText.value));
    $q.notify({
      message: 'Copied to clipboard',
      color: 'positive',
      position: 'top-right',
      timeout: 1000,
    });
  }

  async function copyToFileImage(event) {
    try {
      const user = useCurrentUser();

      const idToken = await user.value.getIdToken();

      const newUrl = await uploadImage(idToken, props.promptResult.images[0], useCurrentUser().value.uid);
      fileStore.selectedFile.imageUrl = newUrl;
    } catch (error) {
      return;
    }
  }

  async function copyToVariable(event, variable) {
    variable.value = replaceParameterEditorText(promptResultText.value);
    $q.notify({
      message: 'Copied to ' + variable.title,
      color: 'positive',
      position: 'top-right',
      timeout: 1000,
    });
  }

  async function stopPrompting(event) {
    event.stopPropagation();
    const promptStore = usePromptStore();
    promptStore.stopPrompt();
    promptStore.finishPromptResult(props.promptResult);
  }

  async function regeneratePrompt(event, removeCurrent = true, forceTemperature = null, forceModel = null) {
    event.stopPropagation();
    const promptStore = usePromptStore();
    const layoutStore = useLayoutStore();

    if(removeCurrent === true) {
      await removePromptResult(event);
    }

    //await promptStore.reprompt(props.promptResult);

    let appendMessages = null;

    if(props.promptResult.appendMessages) {
      appendMessages = [];
      appendMessages.push(...props.promptResult.appendMessages);
    }

    let promptAgainArgs = {
      forceTemperature: forceTemperature,
      forceModel: forceModel,
    };

    if(event.ctrlKey) {
      await promptStore.promptAgain(props.promptResult, appendMessages, promptAgainArgs);
    } else {
      const data = await promptStore.promptAgain(props.promptResult, appendMessages, promptAgainArgs, true);

      data.isRegenerating = true;
      layoutStore.promptPreview = data;
      layoutStore.promptPreviewShown = true;
    }
  }

  async function removePromptResult(event) {
    event.stopPropagation();
    const promptStore = usePromptStore();
    promptStore.removePromptResult(props.promptResult);
  }

  const isPrompting = computed(() => {
    return promptStore.isPrompting && !promptStore.isSilentPrompting;
  });

  const promptResultTitle = computed(() => {
    let retValue = '';

    if(isReactionToAnotherPrompt.value) {
      retValue += 'Reply: ';
    }

    retValue += truncate(props.promptResult.prompt.title, 30);

    //retValue += ' [' + truncate(promptStore.getModel(props.promptResult.model?.id)?.name, 12) + ']';

    /*if(props.promptResult.temperature !== undefined && props.promptResult.temperature !== null) {
      retValue += ' (temperature ' + props.promptResult.temperature + ')';
    }*/

    return retValue;
  });

  const promptResultModel = computed(() => {
    return '' + truncate(promptStore.getModel(props.promptResult.model?.id)?.name, 12) + '';
  });

  const promptResultTemperature = computed(() => {
    if(props.promptResult.temperature !== undefined && props.promptResult.temperature !== null) {
      return '' + props.promptResult.temperature + '';
    }

    return undefined;
  });

  function onReplyKeyup(event) {
    if(event.key === 'Enter' && (!event.shiftKey)) {
      promptReactClick(props.promptResult.prompt);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const editor = useEditor({
    content: promptResultText.value,
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
      CodeBlock,
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
      Blockquote.configure({
        HTMLAttributes: {
          class: 'user-message',
        },
      }),
    ],

  })

  watch(() => promptResultText.value, (value) => {
    // HTML
    const isSame = editor.value.getHTML() === value

    // JSON
    // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

    if (isSame) {
      return
    }

    editor.value.commands.setContent(value, false);
  })

</script>

<style scoped>
  .prompt-actions{
    background-color: white;
    z-index: 1000;
    height: 1.7rem;
  }

  h3 {
    font-size: 1.1rem;
  }
  h2 {
    font-size: 1.2rem;
  }
  h1 {
    font-size: 1.3rem;
  }
</style>
