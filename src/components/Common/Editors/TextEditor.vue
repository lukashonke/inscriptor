<template>
  <div v-if="editor" class="bg-red">
    <bubble-menu
      class="bubble-menu"
      :tippy-options="{ duration: 100, placement: 'right', maxWidth: '600px', zIndex: 99999 }"
      :editor="editor"
    >
      <div class="q-gutter-x-xs">
        <q-btn size="12px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-white bordered" color="accent" :class="{ 'text-primary': showPrompts }">
          <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" >
            <q-card v-show="showPrompts">
              <PromptSelector prompt-types="selection" @promptClick="promptClick" />
            </q-card>
          </q-popup-proxy>
          <q-tooltip  :delay="1000">
            AI prompts
          </q-tooltip>
        </q-btn>

        <q-btn v-if="predefinedWordFinderPrompts && predefinedWordFinderPrompts.length > 0" size="12px" dense flat icon="mdi-auto-fix" padding="4px 6px" class="bg-white bordered" color="accent" @click="runWordFinder()" :loading="wordFinderLoading">
          <q-popup-proxy transition-show="jump-down" transition-hide="fade" :offset="[0, 10]" >
            <q-card style="width: 400px; min-height: 50px;" class="no-scroll">
              <div class="row" style="min-width: 100px; min-height: 50px;">
                <template v-for="(word, i) in wordFinderOutput" :key="i">
                  <div class="col-auto">
                    <q-item clickable v-close-popup @click="replaceSelectedWord(word)" dense>
                      <q-item-section>
                        <q-item-label>{{ word }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </div>
                </template>
              </div>
              <div class="full-width flex justify-center" v-if="wordFinderOutput && wordFinderOutput.length > 0">
                <q-btn label="More" no-caps @click="runWordFinder(false)" dense flat class="text-center full-width" :loading="wordFinderLoading"/>
              </div>


            </q-card>
          </q-popup-proxy>
          <q-tooltip  :delay="1000">
            Word Finder
          </q-tooltip>
        </q-btn>
      </div>
    </bubble-menu>

    <floating-menu
      class="floating-menu"
      :tippy-options="{ duration: 100, placement: 'bottom', maxWidth: '600px' }"
      :editor="editor"
    >
      <div class="">
        <q-btn size="12px" dense flat icon="mdi-creation-outline" padding="4px 6px" class="bg-white bordered" color="accent" :class="{ 'text-primary': showPrompts }">
          <q-popup-proxy transition-show="jump-down" transition-hide="fade" anchor="top right" self="top left" :offset="[10, 0]"  >
            <q-card v-show="showPrompts">
              <PromptSelector prompt-types="insert" @promptClick="promptClick" />
            </q-card>
          </q-popup-proxy>
          <q-tooltip  :delay="1000">
            AI prompts
          </q-tooltip>
        </q-btn>
      </div>

    </floating-menu>
  </div>

  <div v-if="editor" class="q-mb-md sticky">
    <q-card class="row justify-center q-gutter-x-xs" bordered flat>
      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="format_bold" @click="editor.chain().focus().toggleBold().run()" :class="{ 'text-grey-5': !editor.isActive('bold'), 'text-primary': editor.isActive('bold') }" />
      </div>
      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="format_italic"  @click="editor.chain().focus().toggleItalic().run()" :class="{ 'text-grey-5': !editor.isActive('italic'), 'text-primary': editor.isActive('italic') }"/>
      </div>
      <div class="col-auto">
        <q-btn-dropdown size="11px" dense flat square label="Style" class="text-grey-5">
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

      <!--<div class="col-auto">
        <q-btn size="11px" dense flat square icon="format_list_bulleted"  @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'text-light': !editor.isActive('bulletList'), 'text-primary': editor.isActive('bulletList') }"/>
      </div>
      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="format_list_numbered"  @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'text-light': !editor.isActive('orderedList'), 'text-primary': editor.isActive('orderedList') }"/>
      </div>-->
      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="code"  @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'text-grey-5': !editor.isActive('codeBlock'), 'text-primary': editor.isActive('codeBlock') }"/>
      </div>

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

        <q-chip dense v-if="fileStore.projectSettings.syncToCloud && promptStore.currentCharsCount >= layoutStore.getMaxFileSize()" color="negative" text-color="white" label="Max file size for your subscription plan reached." icon="las la-exclamation-triangle" class="text-caption" clickable @click="layoutStore.showUserDialog" />
      </div>

      <!--<div class="col-auto">
        <q-btn size="11px" dense flat square icon="person_outline"  @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'text-light': !editor.isActive('blockquote'), 'text-primary': editor.isActive('blockquote') }"/>
      </div>-->

      <div class="col-auto">
        <q-btn size="11px" id="togglePrompts" dense flat square icon="mdi-creation-outline" class="text-accent" :class="{ 'text-primary': showPrompts }">
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

      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="las la-font" @click="toggleAutomaticCorrections" class="" :class="{ 'text-primary': automaticCorrections, 'text-grey-5': !automaticCorrections }">
          <q-tooltip>
            Toggle Automatic Text Corrections
          </q-tooltip>
        </q-btn>
      </div>

      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="undo" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().chain().focus().undo().run()" class="text-primary" />
      </div>
      <div class="col-auto">
        <q-btn size="11px" dense flat square icon="redo" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().chain().focus().redo().run()" class="text-primary" />
      </div>

    </q-card>
  </div>

  <div class="flex justify-center">
    <div class="col-auto full-width" :class="windowWidthClases">
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
      <!--<q-btn @click="fileStore.spellCheck()">Spell check</q-btn>-->
    </div>
  </div>


  <q-page-sticky position="bottom-left" :offset="[18, 18]" v-if="promptStore.hasStickyPrompts(fileStore.selectedFile)">
    <q-fab
      v-model="aiFab"
      vertical-actions-align="left"
      color="primary"
      icon="mdi-creation-outline"
      direction="up"
    >
      <template v-for="prompt in promptStore.getStickyPrompts(fileStore.selectedFile)" :key="prompt.id">
        <q-fab-action @click="promptClick(prompt)" color="white" text-color="black" square >
          {{ prompt.title }}&nbsp;
          <q-badge color="secondary" :label="promptStore.getModel(prompt.modelId)?.name" />
        </q-fab-action>
      </template>
    </q-fab>
  </q-page-sticky>

</template>

<script setup>
import {mergeAttributes, useEditor} from '@tiptap/vue-3'
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
import { Node } from '@tiptap/core';
import {
  executePromptClick2
} from "src/common/helpers/promptHelper";
import {Blockquote} from "@tiptap/extension-blockquote";
import {
  convertTextsToChat,
  editorTextsBetween, getAllMarkdown, getEditor, getEditorSelection,
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

const promptStore = usePromptStore();
const fileStore = useFileStore();
const editorStore = useEditorStore();
const layoutStore = useLayoutStore();

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

const showPrompts = ref(true);
const aiFab = ref(false);
const currentInsertPromptCategory = ref('');
const currentSelectionPromptCategory = ref('');

const fileInfo = ref(null);
const fileInfoHover = useElementHover(fileInfo)

computed(() => {
  const prompts = promptStore.selectionPrompts.filter(p => promptStore.canPrompt(p)).map(p => p.category ?? "");

  return [...new Set(prompts)];
});
computed(() => {
  const prompts = promptStore.insertPrompts.filter(p => promptStore.canPrompt(p)).map(p => p.category ?? "");

  return [...new Set(prompts)];
});
const emits = defineEmits(['update:modelValue']);
computed(() => {
  const prompts = promptStore.selectionPrompts.filter(p => promptStore.canPrompt(p)).filter(p => p.category === currentSelectionPromptCategory.value || (currentSelectionPromptCategory.value === '' && !p.category))
  const grouping = groupBy(prompts, 'modelId');

  return groupByToArray(grouping);
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

const CustomParagraph = Node.create({
  name: 'userMessageParagraph',

  defaultOptions: {
    HTMLAttributes: {
      class: 'user-message',
    },
  },

  group: 'block',

  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'p.user-message',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

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
  },
  onSelectionUpdate: async () => {

    // only if anything is selected
    if(editor.value.state.selection.empty) {
      return;
    }

    layoutStore.setAnalysisWillBeTriggered(1000);
    await debouncedFn();
  },
});

const debouncedFn = useDebounceFn(() => {
  promptSelectionAnalysisPrompts();
}, 1500)

onMounted(() =>{
  editorStore.setEditor(editor.value);
  promptStore.updateTokens();
  promptStore.setCharsCount(editor.value.storage.characterCount.characters());
})

onDeactivated(() => {
  editorStore.setEditor(null);
});

const predefinedWordFinderPrompts = computed(() => {
  const promptId = promptStore.getPredefinedPromptId('Word Finder');

  if(!promptId || promptId.length === 0) {
    return [];
  }

  const retValue = [];

  for (const id of promptId) {
    const prompt = promptStore.getPromptById(id);

    retValue.push(prompt);
  }

  return retValue;
});

async function runWordFinder(replace = true) {
  const prompts = predefinedWordFinderPrompts.value;

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

      console.log(message);

      const request = {
        prompt: prompt,
        text: message,
        clear: false,
        forceBypassMoreParameters: true,
        silent: true
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

function replaceSelectedWord(text) {
  const editor = getEditor();
  if(!editor) return;

  const { from, to, empty } = getEditorSelection();

  const selectedText = getSelectedText();

  // if text ends with ' '
  if(selectedText.endsWith(' ') && !text.endsWith(' ')) {
    text += ' ';
  }

  if(selectedText.startsWith(' ') && !text.startsWith(' ')) {
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

async function promptSelectionAnalysisPrompts() {

  layoutStore.setAnalysisTriggered(false);
  await promptStore.promptSelectionAnalysisPrompts();
}

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

</script>

<style lang="scss">
/* Basic editor styles */
.text-editor {
  .tiptap {
    > * + * {
      margin-top: 0.75em;
    }

    ul,
    ol {
      margin-top: 0px;
      padding: 0 1rem;

      p {
        margin: 0 0 0 0;
      }
    }

    p {
      margin-bottom: 10px;
      margin-top: 0px;
    }

    img {
      max-width: 100%;
      height: auto;
      max-height: 40em;

      &.ProseMirror-selectednode {
        outline: 3px solid #68CEF8;
      }
    }

    h1 {
      font-size: 1.7em;
      font-weight: bold;
      line-height: 1.1;
      margin-bottom: 10px;
      margin-top: 30px;
    }

    h2 {
      font-size: 1.4em;
      font-weight: bold;
      line-height: 1.1;
      margin-bottom: 10px;
      margin-top: 30px;
    }

    h3 {
      font-size: 1.1em;
      font-weight: bold;
      line-height: 1.1;
      margin-bottom: 10px;
      margin-top: 30px;
    }


    outline: 0px solid #dddddd;

    code {
      background-color: rgba(#616161, 0.1);
      color: #616161;
    }

    pre {
      background: #ddd;
      color: #353535;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;

      code {
        color: inherit;
        padding: 0;
        background: none;
        font-size: 0.8rem;
      }
    }

  }

  .ProseMirror-focused {

  }
}

.user-message {
  p {
    padding: 8px 0px 0px 0px;
    margin: 0px 0px 8px 0px;
  }
  background-color: #f0f0f0;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border-left: 2px solid rgba(#0D0D0D, 0.1);

  margin: 0.5rem 0;
}

.user-message::before {
  content: 'User:';
  font-weight: bold;
  color: #626F9B;
}

.bubble-menu {
  display: flex;
}

.has-focus {
  border-radius: 3px;
  box-shadow: 0 0 0 3px #68cef8;
}

.floating-menu {
  display: flex;
}
</style>
