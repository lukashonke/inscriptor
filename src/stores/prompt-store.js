import { defineStore } from 'pinia';
import {parseFromJson, createFile} from "src/common/utils/fileUtils";
import {promptStream} from "src/common/apiServices/promptStreamService";
import {
  applyPromptChatFormat,
  applyPromptFormatPrefixSuffix,
  executePromptClick, replyToPrompt
} from "src/common/helpers/promptHelper";
import {
  convertHtmlToText,
  diffStrings, getTextBeforeKeepingWordsIntact, reduceLineBreaks,
  replaceMentionEditorText, replaceParameterEditorText, tokenise,
} from "src/common/utils/textUtils";
import {guid} from "src/common/utils/guidUtils";
import {useFileStore} from "stores/file-store";
import OpenAI from "openai";
import {Dialog, Notify} from "quasar";
import {generateImage, promptLocalAutomatic1111} from "src/common/apiServices/imageGenService";
import {
  editorMarkdownBetween,
  getAllMarkdown,
  getEditor,
  getEditorSelection,
  getSelectedMarkdown
} from "src/common/utils/editorUtils";
import {Ollama} from 'ollama/browser'
import {downloadOllamaModel, removeOllamaModel} from "src/common/apiServices/ollamaApiService";
import {useLayoutStore} from "stores/layout-store";
import {useCurrentUser} from "vuefire";
import {useLocalDataStore} from "stores/localdata-store";
import {getCloudModelApiKey} from "src/common/utils/modelUtils";
import Anthropic from "@anthropic-ai/sdk";

export const usePromptStore = defineStore('prompts', {
  state: () => ({
    models: [],

    currentModelForChatId: null,
    currentPromptForChatId: null,
    currentChatInsertUserQueries: true,

    tabs: [],

    tabData: {

    },

    prompts: [],
    predefinedPrompts: [],
    predefinedPromptInstances: [],

    analysisEnabled: false,
    selectedAnalysisPrompts: [],
    selectionPromptResults: [],

    lastPrompts: [],

    currentTab: null,
    currentTokensCount: 0,
    currentWordsCount: 0,
    currentCharsCount: 0,

    isPrompting: false,
    isSilentPrompting: false,
    promptAbortController: null,

    promptParametersShown: false,
    promptInput: '',
    currentPromptConfirmation: null,
    currentPromptConfirmationSelectedText: null,
    promptParametersValue:  [],
    promptSourceLanguage: null,
    promptTargetLanguage: null,
    previousPromptParameterValue: [], // TODO rename
    promptContext: [],
    savedPromptContexts: [],

    promptCategories: [],
    promptFolders: [],

    labels: [],
    statuses: [],
    metadata: [

    ],

    currentDataPath: '',
    currentModelPath: '',

    contextTypes: [

    ],

    defaultFileTemplate: null,
    fileTemplates: [],
    currentSpellCheckLanguage: null,

    lastSettingsSyncHash: null,

    currentOverridePromptParameters: null,

    hubPromptPacks: [],
    modelPromptPacks: [],
  }),
  getters: {
    selectionPrompts: (state) => state.prompts.filter(p => (p.promptType === "selection" || p.promptType === "general") && p.enabled),
    insertPrompts: (state) => state.prompts.filter(p => (p.promptType === "insert" || p.promptType === "general") && p.enabled),
    selectionAnalysisPrompts: (state) => state.prompts.filter(p => p.promptType === "selectionAnalysis" && p.enabled).filter(p => true),
    selectionAnalysisAvailablePrompts: (state) => state.prompts.filter(p => (p.promptType === "selectionAnalysis" || p.promptType === "selection" || p.promptType === "general") && p.enabled).filter(p => true),
  },
  actions: {
    initialise() {
      this.restoreDefaultSettings();

      this.currentTab = this.tabs[0];

      if(!this.defaultFileTemplate) {
        const fileStore = useFileStore();

        this.defaultFileTemplate = createFile('Template file');
      }
    },
    async promptMultiple(prompt, text, parametersValue, contextTypes, promptType, counts=3, clear = true, appendMessages = null, forceTemperature = null, previewOnly = false, forceInput = null, silent = false, promptSource = null) {
      if(!this.canPrompt(prompt)) {
        return;
      }

      if(previewOnly) {
        const input = this.constructPromptInput(null, null, prompt, text, parametersValue, contextTypes, promptType, appendMessages, forceTemperature, silent);
        return input;
      }

      if(clear && !silent && prompt.promptType !== "selectionAnalysis" && promptSource !== 'selectionAnalysis') {
        //this.clearPromptResults();
        this.newPromptResultsPage();
      }

      this.updateTokens();

      let lastResult = null;

      try {
        if(prompt.enablePromptRuns === true && prompt.runs && prompt.runs.length > 0) {
          let runResults = [];

          for (const run of prompt.runs) {

            this.setCurrentOverridePromptParameters(null);

            if(run.changeModel === true) {
              this.setCurrentOverridePromptParameter(prompt, run.changeModelValue, undefined);
            }

            if(run.changeTemperature === true) {
              this.setCurrentOverridePromptParameter(prompt, undefined, run.changeTemperatureValue);
            }

            if(run.changePrompts === true) {
              let systemPrompt = run.systemPrompt;
              let userPrompt = run.userPrompt;

              for (const runResult of runResults) {
                systemPrompt = systemPrompt.replace('$output.' + runResult.runName, runResult.result?.originalText ?? '');
                userPrompt = userPrompt.replace('$output.' + runResult.runName, runResult.result?.originalText ?? '');
              }

              this.setCurrentOverridePromptParameter(prompt, undefined, undefined, systemPrompt, userPrompt);
            }

            let overridePromptParameters = {
              prompt: this.currentOverridePromptParameters?.prompt,
              temperature: this.currentOverridePromptParameters?.temperature,
              modelId: this.currentOverridePromptParameters?.modelId,
              systemPrompt: this.currentOverridePromptParameters?.systemPrompt,
              userPrompt: this.currentOverridePromptParameters?.userPrompt,
              textMessages: this.currentOverridePromptParameters?.textMessages ? [...this.currentOverridePromptParameters?.textMessages] : undefined,
            }

            const promptArgs = { prompt, parametersValue, text, promptType, contextTypes, overridePromptParameters };

            const result = await this.promptInternal(prompt, text, parametersValue, contextTypes, promptType, appendMessages, forceTemperature, forceInput, promptArgs, silent, promptSource);

            if(promptType === "general" || promptType === "selection" || promptType === "selectionAnalysis") {
              const trimmedResultText = result.text.trimStart().replace(/\n/g, '<br>');
              if(trimmedResultText.length > 0) {
                result.diff = diffStrings(text, trimmedResultText);
              }
            }

            runResults.push({
              runName: run.name,
              result: result
            })

            console.log(result.diff);
          }
        } else {
          for(let i = 0; i < counts; i++) {
            let overridePromptParameters = {
              prompt: this.currentOverridePromptParameters?.prompt,
              temperature: this.currentOverridePromptParameters?.temperature,
              modelId: this.currentOverridePromptParameters?.modelId,
              systemPrompt: this.currentOverridePromptParameters?.systemPrompt,
              userPrompt: this.currentOverridePromptParameters?.userPrompt,
              textMessages: this.currentOverridePromptParameters?.textMessages ? [...this.currentOverridePromptParameters?.textMessages] : undefined,
            }

            const promptArgs = { prompt, parametersValue, text, promptType, contextTypes, overridePromptParameters };

            const result = await this.promptInternal(prompt, text, parametersValue, contextTypes, promptType, appendMessages, forceTemperature, forceInput, promptArgs, silent, promptSource);

            if(promptType === "general" || promptType === "selection" || promptType === "selectionAnalysis") {
              const trimmedResultText = result.text.trimStart().replace(/\n/g, '<br>');
              if(trimmedResultText.length > 0) {
                result.diff = diffStrings(text, trimmedResultText);
              }
            }

            lastResult = result;

            console.log(result.diff);
          }
        }
      } catch (e) {
        console.log(e);
        Notify.create({
          icon: 'error',
          color: 'negative',
          position: 'bottom-right',
          message: 'An error occurred while prompting',
          actions: [
            { icon: 'close', color: 'white', round: true, handler: () => { /* ... */ } }
          ]
        })
      }

      return lastResult;
    },
    async promptAgain(promptResult, appendMessages, promptAgainArgs, previewOnly = false) {
      const promptArgs = promptResult.promptArgs;
      const prompt = promptArgs.prompt;

      this.setCurrentOverridePromptParameters(promptArgs.overridePromptParameters);

      const modelId = this.getCurrentPromptModelId(prompt);

      const model = this.getModel(modelId);

      const promptTimes = prompt.overridePromptTimes?.length > 0 ? parseInt(prompt.overridePromptTimes) : model.promptTimes;

      const forceTemperature = promptAgainArgs?.forceTemperature;
      if(forceTemperature !== null && forceTemperature !== undefined) {
        this.setCurrentOverridePromptParameter(prompt, undefined, forceTemperature);
      }
      const forceModel = promptAgainArgs?.forceModel;
      if(forceModel !== null && forceModel !== undefined) {
        this.setCurrentOverridePromptParameter(prompt, forceModel.id, null);
      }

      if(promptResult.executedTextMessages) {
        this.setCurrentOverridePromptParameter(prompt, undefined, undefined, undefined, undefined, promptResult.executedTextMessages)
      }

      return await this.promptMultiple(prompt, promptArgs.text, promptArgs.parametersValue, promptArgs.contextTypes, promptArgs.promptType, promptTimes, false, appendMessages, forceTemperature, previewOnly);
    },
    async promptSelectionAnalysisPrompts() {

      if(getEditorSelection()?.empty ?? true) {
        return;
      }

      const prompts = ([...this.selectionAnalysisPrompts, ...this.selectionPrompts] ?? [])
        .filter(p => p.enabled)
        .filter(p => this.selectedAnalysisPrompts.find(ap => ap.value === p.id));

      if(!this.analysisEnabled || prompts.length === 0) {
        return;
      }

      this.clearSelectionAnalysisPrompts();

      for (const prompt of prompts) {
        const text = getSelectedMarkdown();
        await executePromptClick(prompt, text, undefined, null, true, null, undefined, false, 'selectionAnalysis');
      }
    },
    clearSelectionAnalysisPrompts() {
      this.selectionPromptResults = [];
    },
    canPrompt(prompt) {
      const model = this.getModel(this.getCurrentPromptModelId(prompt));
      if(!model) {
        return false;
      }
      const modelReady = model.enabled && model.downloaded;
      if(!modelReady) {
        return false;
      }

      return true;
    },
    getCurrentPromptModelId(prompt) {
      let modelId = prompt.modelId;

      if(this.currentOverridePromptParameters && this.currentOverridePromptParameters.prompt === prompt) {
        if(this.currentOverridePromptParameters.modelId) {
          modelId = this.currentOverridePromptParameters.modelId;
        }
      }

      return modelId;
    },
    getCurrentOverrideTemperature(prompt) {
      if(this.currentOverridePromptParameters && this.currentOverridePromptParameters.prompt === prompt) {
        return this.currentOverridePromptParameters.temperature;
      }

      return null;
    },
    constructPromptInput(forceInput, pr, prompt, inputText, parametersValue, contextTypes, promptType, appendMessages, forceTemperature, silent) {
      const fileStore = useFileStore();

      let modelId = this.getCurrentPromptModelId(prompt);

      let forceMessages = undefined;

      if(this.currentOverridePromptParameters && this.currentOverridePromptParameters.prompt === prompt) {
        if(this.currentOverridePromptParameters.temperature !== undefined && this.currentOverridePromptParameters.temperature !== null) {
          forceTemperature = this.currentOverridePromptParameters.temperature;
        }

        if(this.currentOverridePromptParameters.textMessages) {
          forceMessages = this.currentOverridePromptParameters.textMessages;

          if(appendMessages) {
            // insert if not exists
            for (const message of appendMessages) {
              if(!forceMessages.find(m => m.text === message.text)) {
                forceMessages.push(message);
              }
            }
          }
        }
      }

      const model = this.getModel(modelId);
      let temperature = forceTemperature != null ? forceTemperature : (prompt.settings.overrideTemperature ?? false) ? prompt.settings.temperature : model.defaultTemperature;

      // input object already provided from previous run, just use it
      if(forceInput) {
        if(pr && forceInput.promptResultInput) {
          pr.input = forceInput.promptResultInput;
        }

        if(pr && forceInput.promptResultAppendMessages) {
          pr.appendMessages = forceInput.promptResultAppendMessages;
        }

        forceInput.temperature = temperature;
        forceInput.model = model;

        return forceInput;
      }


      let maxTokens = (prompt.settings.overrideMaxTokens ?? false) ? prompt.settings.maxTokens : model.defaultMaxTokens;
      let topP = (prompt.settings.overrideTopP ?? false) ? prompt.settings.topP : model.defaultTopP;
      let minP = model.defaultMinP;
      let topK = model.defaultTopK;
      let repeatPenalty = model.defaultRepeatPenalty;
      let frequencyPenalty = (prompt.settings.overrideFrequencyPenalty ?? false) ? prompt.settings.frequencyPenalty : model.defaultFrequencyPenalty;
      let presencePenalty = (prompt.settings.overridePresencePenalty ?? false) ? prompt.settings.presencePenalty : model.defaultPresencePenalty;

      let systemPrefix = prompt.overridePromptFormat ? prompt.systemPromptPrefix : model.defaultSystemPromptPrefix;
      let systemSuffix = prompt.overridePromptFormat ? prompt.systemPromptSuffix : model.defaultSystemPromptSuffix;
      let userPrefix = prompt.overridePromptFormat ? prompt.userPromptPrefix : model.defaultUserPromptPrefix;
      let userSuffix = prompt.overridePromptFormat ? prompt.userPromptSuffix : model.defaultUserPromptSuffix;
      let assistantPrefix = prompt.overridePromptFormat ? prompt.assistantPromptPrefix : model.defaultAssistantPromptPrefix;
      let assistantSuffix = prompt.overridePromptFormat ? prompt.assistantPromptSuffix : model.defaultAssistantPromptSuffix;

      let jsonMode = prompt.promptStyle === 'brainstorm';
      jsonMode = false; // disable json mode for now

      let systemPrompt = prompt.overrideSystemPrompt ? prompt.systemPrompt : model.defaultSystemPrompt;

      let userPrompt = prompt.userPrompt;
      let assistantPrompt = prompt.hasExtendedChatMessages ? prompt.assistantPrompt : undefined;
      let userPrompt2 = prompt.hasExtendedChatMessages ? prompt.userPrompt2 : undefined;

      if(pr?.promptArgs?.overridePromptParameters) {
        if(pr.promptArgs.overridePromptParameters.userPrompt !== null && pr.promptArgs.overridePromptParameters.userPrompt !== undefined) {
          userPrompt = pr.promptArgs.overridePromptParameters.userPrompt;
        }

        if(pr.promptArgs.overridePromptParameters.systemPrompt !== null && pr.promptArgs.overridePromptParameters.systemPrompt !== undefined) {
          systemPrompt = pr.promptArgs.overridePromptParameters.systemPrompt;
        }
      }

      let textMessages = [];
      // prompt chat messages inserted from included contexts - some contexts are not inserted into $context variable, but as another chat message to fool the AI thinking it wrote it
      let contextTextMessages = [];

      let inputIsText;
      let selectedText;
      let textBefore;
      let textAfter;
      let text;

      let promptResultInput; // input value for the prompt result
      let promptResultAppendMessages;

      let nodeBefore = '';
      let nodeAfter = '';
      let nodeParent = '';

      let missingVariable = null;

      systemPrompt = replaceParameterEditorText(systemPrompt);
      userPrompt = replaceParameterEditorText(userPrompt);

      if(assistantPrompt) {
        assistantPrompt = replaceParameterEditorText(assistantPrompt);
      }

      if(userPrompt2) {
        userPrompt2 = replaceParameterEditorText(userPrompt2);
      }

      if(Array.isArray(inputText)) {
        textMessages = [...inputText];
        selectedText = null;
        inputIsText = false;

        promptResultInput = inputText[inputText.length - 1].text;

      } else {
        selectedText = inputText;
        inputIsText = true;

        if(inputText.includes('$$$replaceUserPrompt$$$')) {
          inputText = inputText.replace('$$$replaceUserPrompt$$$', '');
          userPrompt = inputText;
        }

        promptResultInput = inputText;
      }

      for (const textMessage of textMessages) {
        if(textMessage.text && textMessage.text.length > 0) {
          textMessage.text = replaceMentionEditorText(textMessage.text);
        }
      }
      console.log(textMessages);

      systemPrompt = systemPrompt.replace('$selection', selectedText ?? '');
      userPrompt = userPrompt.replace('$selection', selectedText ?? '');
      if(assistantPrompt) {
        assistantPrompt = assistantPrompt.replace('$selection', selectedText ?? '');
      }
      if(userPrompt2) {
        userPrompt2 = userPrompt2.replace('$selection', selectedText ?? '');
      }

      systemPrompt = systemPrompt.replace('$textOrSelection', selectedText ?? '');
      userPrompt = userPrompt.replace('$textOrSelection', selectedText ?? '');
      if(assistantPrompt) {
        assistantPrompt = assistantPrompt.replace('$textOrSelection', selectedText ?? '');
      }
      if(userPrompt2) {
        userPrompt2 = userPrompt2.replace('$textOrSelection', selectedText ?? '');
      }

      systemPrompt = systemPrompt.replace('$chat', selectedText ?? '');
      userPrompt = userPrompt.replace('$chat', selectedText ?? '');
      if(assistantPrompt) {
        assistantPrompt = assistantPrompt.replace('$chat', selectedText ?? '');
      }
      if(userPrompt2) {
        userPrompt2 = userPrompt2.replace('$chat', selectedText ?? '');
      }

      const editor = getEditor();

      if(editor) {
        const {from, to, empty, $anchor, $head} = getEditorSelection();

        nodeBefore = $anchor.nodeBefore?.text ?? '';
        nodeAfter = $anchor.nodeAfter?.text ?? '';
        nodeParent = $anchor.parent?.textContent ?? '';

        //textBefore = editor.state.doc.textBetween(0, from, '\n\n');
        //textAfter = editor.state.doc.textBetween(to, editor.state.doc.content.size, '\n\n');
        //text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n\n');

        textBefore = editorMarkdownBetween(editor.state, { from: 0, to: from });
        textAfter = editorMarkdownBetween(editor.state, { from: to, to: editor.state.doc.content.size });
        text = getAllMarkdown();

        function replaceDynamic(regex) {
          for (const match of userPrompt.matchAll(regex)) {
            const indexBackwards = parseInt(match[1]);
            const indexForwards = parseInt(match[2]);

            //TODO do not split mid word, but expand to the nearest word
            const text = editor.state.doc.textBetween(Math.max(0, from - indexBackwards), Math.min(to + indexForwards, editor.state.doc.content.size), '\n\n');
            userPrompt = userPrompt.replace(match[0], text);
          }
          for (const match of systemPrompt.matchAll(regex)) {
            const indexBackwards = parseInt(match[1]);
            const indexForwards = parseInt(match[2]);

            //TODO do not split mid word, but expand to the nearest word
            const text = editor.state.doc.textBetween(Math.max(0, from - indexBackwards), Math.min(to + indexForwards, editor.state.doc.content.size), '\n\n');
            systemPrompt = systemPrompt.replace(match[0], text);
          }

          if(assistantPrompt) {
            for (const match of assistantPrompt.matchAll(regex)) {
              const indexBackwards = parseInt(match[1]);
              const indexForwards = parseInt(match[2]);

              //TODO do not split mid word, but expand to the nearest word
              const text = editor.state.doc.textBetween(Math.max(0, from - indexBackwards), Math.min(to + indexForwards, editor.state.doc.content.size), '\n\n');
              assistantPrompt = assistantPrompt.replace(match[0], text);
            }
          }

          if(userPrompt2) {
            for (const match of userPrompt2.matchAll(regex)) {
              const indexBackwards = parseInt(match[1]);
              const indexForwards = parseInt(match[2]);

              //TODO do not split mid word, but expand to the nearest word
              const text = editor.state.doc.textBetween(Math.max(0, from - indexBackwards), Math.min(to + indexForwards, editor.state.doc.content.size), '\n\n');
              userPrompt2 = userPrompt2.replace(match[0], text);
            }
          }
        }

        replaceDynamic(/\$textAround\((\d+)\)\((\d+)\)/g);
      }

      console.log('textBefore:', textBefore);
      console.log('textAfter:', textAfter);

      function replace(what, withWhat) {
        if(systemPrefix.includes(what)) {
          systemPrefix = systemPrefix.replace(what, withWhat());
        }

        if(systemSuffix.includes(what)) {
          systemSuffix = systemSuffix.replace(what, withWhat());
        }

        if(systemPrompt.includes(what)) {
          systemPrompt = systemPrompt.replace(what, withWhat());
        }

        if(userPrefix.includes(what)) {
          userPrefix = userPrefix.replace(what, withWhat());
        }

        if(userSuffix.includes(what)) {
          userSuffix = userSuffix.replace(what, withWhat());
        }

        if(userPrompt.includes(what)) {
          userPrompt = userPrompt.replace(what, withWhat());
        }

        if(assistantPrompt) {
          if(assistantPrompt.includes(what)) {
            assistantPrompt = assistantPrompt.replace(what, withWhat());
          }
        }

        if(userPrompt2) {
          if(userPrompt2.includes(what)) {
            userPrompt2 = userPrompt2.replace(what, withWhat());
          }
        }

        if(assistantPrefix.includes(what)) {
          assistantPrefix = assistantPrefix.replace(what, withWhat());
        }

        if(assistantSuffix.includes(what)) {
          assistantSuffix = assistantSuffix.replace(what, withWhat());
        }
      }

      replace('$textBefore', () => convertHtmlToText(textBefore) ?? '');
      replace('$text2000Before', () => getTextBeforeKeepingWordsIntact(convertHtmlToText(textBefore), 2000));
      replace('$text1000Before', () => getTextBeforeKeepingWordsIntact(convertHtmlToText(textBefore), 1000));
      replace('$text500Before', () => getTextBeforeKeepingWordsIntact(convertHtmlToText(textBefore), 500));
      replace('$textAfter', () => convertHtmlToText(textAfter) ?? '');
      replace('$text', () => convertHtmlToText(text) ?? '');
      replace('$nodeBefore', () => convertHtmlToText(nodeBefore) ?? '');
      replace('$nodeAfter', () => convertHtmlToText(nodeAfter) ?? '');
      replace('$nodeParent', () => convertHtmlToText(nodeParent) ?? '');

      if(prompt.hasParameters && parametersValue !== null) {
        for (const parameter of prompt.parameters) {
          const parameterValue = parametersValue.find(p => p.name === parameter.name);
          if(parameterValue) {
            const parameterValuePlainText = convertHtmlToText(parameterValue.value ?? '');

            let valueWithPrefixSuffix;
            if(parameterValuePlainText === '') {
              valueWithPrefixSuffix = parameterValuePlainText;
            } else {
              valueWithPrefixSuffix = (parameter.prefixWith ?? '') + (parameterValuePlainText) + (parameter.suffixWith ?? '');
            }

            const parameterValueText = replaceMentionEditorText(valueWithPrefixSuffix);

            systemPrompt = systemPrompt.replace('$' + parameter.name, parameterValueText);
            userPrompt = userPrompt.replace('$' + parameter.name, parameterValueText);
            if(assistantPrompt) {
              assistantPrompt = assistantPrompt.replace('$' + parameter.name, parameterValueText);
            }
            if(userPrompt2) {
              userPrompt2 = userPrompt2.replace('$' + parameter.name, parameterValueText);
            }
          }
        }
      }

      for (const variable of fileStore.variables) {
        if(variable.value === null || variable.value === undefined || variable.value === '') {
          if(systemPrompt.includes('$' + variable.title)
            || userPrompt.includes('$' + variable.title)
            || (assistantPrompt && assistantPrompt.includes('$' + variable.title))
            || (userPrompt2 && userPrompt2.includes('$' + variable.title))) {

            missingVariable = variable;
            break;
          }
        }

        systemPrompt = systemPrompt.replace('$' + variable.title, variable.value);
        userPrompt = userPrompt.replace('$' + variable.title, variable.value);
        if(assistantPrompt) {
          assistantPrompt = assistantPrompt.replace('$' + variable.title, variable.value);
        }
        if(userPrompt2) {
          userPrompt2 = userPrompt2.replace('$' + variable.title, variable.value);
        }
      }

      systemPrompt = replaceMentionEditorText(systemPrompt);
      userPrompt = replaceMentionEditorText(userPrompt);
      if(assistantPrompt) {
        assistantPrompt = replaceMentionEditorText(assistantPrompt);
      }
      if(userPrompt2) {
        userPrompt2 = replaceMentionEditorText(userPrompt2);
      }

      if(!promptResultInput || promptResultInput.length === 0) {
        promptResultInput = userPrompt;
      }

      if(contextTypes && contextTypes.length > 0) {
        let context = '';

        let prefixWithContextWord = true;
        if(userPrompt?.trim() == '$context' || systemPrompt?.trim() == '$context') {
          prefixWithContextWord = false;
        }

        for (const contextType of contextTypes) {
          if(contextType.id === 'Current File') {
            if(text && text.length > 0) {
              if(contextTypes.length > 1) {
                context += fileStore.getFileNameWithPath(fileStore.selectedFile) + ' Text: ';
              }
              context += convertHtmlToText(text);
              context += '\n-----\n';
            }
          } else if(contextType.id === 'Selected Text') {
            if(selectedText && selectedText.length > 0) {
              if(contextTypes.length > 1) {
                context += 'Selected Text inside ' + (fileStore.getFileNameWithPath(fileStore.selectedFile)) + ': ';
              }
              context += convertHtmlToText(selectedText);
              context += '\n-----\n';
            }
          } else if(contextType.id === 'Current File Summary') {
            const contextValue = fileStore.selectedFile?.synopsis ?? '';
            if(contextValue && contextValue.length > 0) {
              context += fileStore.getFileNameWithPath(fileStore.selectedFile) + ' Summary: ' + convertHtmlToText(contextValue);
              context += '\n-----\n';
            }
          } else if(contextType.id === 'Previous Text') {
            if(textBefore && textBefore.length > 0) {
              const charactersToTake = contextType.parameters;
              const previousCharacters = getTextBeforeKeepingWordsIntact(textBefore, charactersToTake);

              context += 'Preceding text: ' + convertHtmlToText(previousCharacters);
              context += '\n-----\n';

              //contextTextMessages.push({type: 'assistant', text: previousCharacters});
            }

          } else if(contextType.contextType === 'Context Type') {
            const contextValue = fileStore.getContextText(contextType.parameters);

            if(contextValue && contextValue.length > 0) {
              context += 'Context: ' + contextType.parameters + ': \n';
              context += convertHtmlToText(contextValue);
              context += '\n-----\n';
            }
          } else if(contextType.contextType === 'File' || contextType.contextType === 'File and Children') {
            const fileId = contextType.parameters;
            const file = fileStore.getFile(fileId);

            if(file) {
              const fileText = convertHtmlToText(file.content);

              if(fileText && fileText.length > 0) {
                context += '' + fileStore.getFileNameWithPath(file) + ' Text: \n';
                context += fileText;
                context += '\n-----\n';
              }

              if(contextType.contextType === 'File and Children') {
                const addChildrenFunc = (f) => {
                  if(f.children) {
                    for (const child of f.children) {
                      const childText = convertHtmlToText(child.content);

                      if(childText && childText.length > 0) {
                        context += '' + fileStore.getFileNameWithPath(child) + ' Text: \n';
                        context += childText;
                        context += '\n-----\n';
                      }

                      addChildrenFunc(child);
                    }
                  }
                }

                addChildrenFunc(file);
              }
            }

          } else if(contextType.contextType === 'File Summary' || contextType.contextType === 'File and Children Summary') {
            const fileId = contextType.parameters;
            const file = fileStore.getFile(fileId);

            if(file) {

              const fileText = file.synopsis ?? '';

              if(fileText && fileText.length > 0) {
                context += '' + fileStore.getFileNameWithPath(file) + ' Text Summary:\n';
                context += convertHtmlToText(fileText);
                context += '\n-----\n';
              }

              if(contextType.contextType === 'File and Children Summary') {
                const addChildrenFunc = (f) => {
                  if(f.children) {
                    for (const child of f.children) {
                      const childText = child.synopsis ?? '';

                      if(childText && childText.length > 0) {
                        context += '' + fileStore.getFileNameWithPath(child) + ' Text Summary:\n';
                        context += convertHtmlToText(childText);
                        context += '\n-----\n';
                      }

                      addChildrenFunc(child);
                    }
                  }
                }
              }
            }
          } else if(contextType.contextType === 'Context Type Summary') {
            const contextValue = fileStore.getContextSummary(contextType.parameters);

            if(contextValue && contextValue.length > 0) {
              context += 'Context Summaries: ' + contextType.parameters + ':\n';
              context += convertHtmlToText(contextValue);
              context += '\n-----\n';
            }
          } else if(contextType.contextType === "Variable") {
            const variable = fileStore.variables.find(v => v.title === contextType.parameters);
            const variableText = variable?.value ?? '';

            if(variableText && variableText.length > 0) {
              context += variable.title + ': ' + convertHtmlToText(variableText);
              context += '\n-----\n';
            }
          } else {
            // log
            console.log('Unknown context type:', contextType);
          }
        }

        if(prefixWithContextWord) {
          // is whitespace - add "No context provided"
          if(context.trim() === '') {
            context = 'No context provided';
          }
          replace('$context', () => '-----\nContext:\n' + context);
        } else {
          replace('$context', () => context);
        }


      } else {
        replace('$context', () => '');
      }

      // insert system message at first place
      textMessages.unshift({type: 'system', text: systemPrompt}); // input which is a string is treated as user message

      if(inputIsText // input which is a string is treated as user message
        || textMessages.length == 1 || textMessages[1].type !== 'user') { // the second message must be user message
        // insert at second place
        textMessages.splice(1, 0, {type: 'user', text: userPrompt});
      }

      if(contextTextMessages.length > 0) {

        // insert at third place
        textMessages.splice(2, 0, ...contextTextMessages);

        // copy 2nd to 4th
        textMessages.splice(3, 0, ...textMessages.slice(1, 3));
      }

      if(assistantPrompt) {
        // push at index 2
        textMessages.splice(2, 0, {type: 'assistant', text: assistantPrompt});
      }

      if(userPrompt2) {
        // push at index 3
        textMessages.splice(3, 0, {type: 'user', text: userPrompt2});
      }

      if(appendMessages) {

        if(!promptResultAppendMessages) {
          promptResultAppendMessages = [];
        }

        textMessages.push(...appendMessages);
        promptResultAppendMessages.push(...appendMessages);
      }

      if(pr && promptResultInput) {
        pr.input = promptResultInput;
      }

      if(pr && promptResultAppendMessages) {
        pr.appendMessages = promptResultAppendMessages;
      }

      if(forceMessages) {
        textMessages = forceMessages;
      }

      for (const textMessage of textMessages ?? []) {
        if(textMessage.text === '') {
          textMessage.text = ' '; // fix for some AI models that do not accept empty string
        }
        textMessage.text = reduceLineBreaks(textMessage.text);
      }

      return {
        systemPrefix, systemSuffix, userPrefix, userSuffix, assistantPrefix, assistantSuffix,
        textMessages, contextTextMessages,
        systemPrompt, userPrompt,
        temperature, maxTokens, topP, minP, topK, repeatPenalty, frequencyPenalty, presencePenalty,
        inputIsText, selectedText, textBefore, textAfter, text, nodeBefore, nodeAfter, nodeParent,
        missingVariable,
        promptResultInput, promptResultAppendMessages,
        model,
        jsonMode
      }
    },
    promptInternal(prompt, inputText, parametersValue, contextTypes, promptType, appendMessages, forceTemperature, forceInput, promptArgs, silent, promptSource) {
      if(this.isPrompting) {
        this.promptAbortController?.abort();
      }

      this.isPrompting = true;
      this.isSilentPrompting = silent;

      const layoutStore = useLayoutStore();
      const localDataStore = useLocalDataStore();

      const pr = this.createPromptResult(prompt, contextTypes, parametersValue, promptArgs, silent, promptSource);

      const input = this.constructPromptInput(forceInput, pr, prompt, inputText, parametersValue, contextTypes, promptType, appendMessages, forceTemperature, silent);

      if(input.missingVariable !== null) {
        Notify.create({
          icon: 'error',
          color: 'warning',
          position: 'bottom-right',
          message: 'Variable $' + input.missingVariable.title + ' is not set. The prompt output might not be ideal.',
          actions: [
            { icon: 'close', color: 'white', round: true, handler: () => { /* ... */ } }
          ]
        });
      }

      if(!silent) {
        this.setCurrentOverridePromptParameters(null);
      }

      this.promptAbortController = new AbortController();

      const promise = new Promise(async (resolve, reject) => {

        const model = input.model;

        pr.model = model;
        pr.temperature = input.temperature;
        pr.executedTextMessages = input.textMessages ? [...input.textMessages] : undefined;

        const inferenceEngine = input.model.args.inferenceEngine;
        let customApiKey = null;
        let customApiUrl = undefined;

        let promptingEngineToUse;
        if((model.type === 'cloud') && model.enabled && model.downloaded) {
          promptingEngineToUse = 'cloud';

          if(layoutStore.userData?.subscriptionLevel !== 0) {
            customApiKey = getCloudModelApiKey(model.id, inferenceEngine)?.key;
            if(customApiKey) {
              if(inferenceEngine === 'openai') {
                promptingEngineToUse = 'client-openai';
              } else if(inferenceEngine === 'groq') {
                promptingEngineToUse = 'client-openai';
                customApiUrl = 'https://api.groq.com/openai/v1';
              } else if(inferenceEngine === 'openRouter') {
                promptingEngineToUse = 'client-openai';
                customApiUrl = 'https://openrouter.ai/api/v1';
              } else if(inferenceEngine === 'anthropic') {
                promptingEngineToUse = 'client-anthropic';
              }
            }
          }

        } else if(model.type === 'lmstudio') {
          promptingEngineToUse = 'lmstudio';
        } else if(model.type === 'client-openai' && model.enabled && model.downloaded) {
          promptingEngineToUse = 'client-openai';
        } else if(model.type === 'client-ollama' && model.enabled && model.downloaded) {
          promptingEngineToUse = 'client-ollama';
        } else if(model.type === 'client-dall-e' && model.enabled && model.downloaded) {
          promptingEngineToUse = 'client-dall-e';
        } else if(model.type === 'automatic1111-sd' && model.enabled && model.downloaded) {
          promptingEngineToUse = 'automatic1111-sd';
        }
        else {
          Notify.create({
            icon: 'error',
            color: 'negative',
            position: 'bottom-right',
            message: 'Prompt cannot be executed, no execution engine found.',
            actions: [
              { icon: 'close', color: 'white', round: true, handler: () => { /* ... */ } }
            ]
          });

          pr.error = 'Model is not downloaded or enabled.';
          reject(new Error('Model is not downloaded or enabled.'));
          this.isPrompting = false;
          return;
        }

        if(promptingEngineToUse === 'cloud' && useCurrentUser().value.isAnonymous) {
          Notify.create({
            icon: 'error',
            color: 'negative',
            position: 'bottom-right',
            message: 'Inscriptor Cloud AI cannot be executed when signed in as guest. You can still provide API tokens.',
            actions: [
              { icon: 'close', color: 'white', handler: () => { /* ... */ } },
              { icon: 'settings', color: 'white', label: 'API Keys', handler: () => { layoutStore.openConfiguration('apiKeys') } }
            ]
          });

          pr.error = 'Inscriptor Cloud AI prompting not available to guests. You can still provide API tokens.';
          resolve(pr);
          this.isPrompting = false;
          pr.waitingForResponse = false;
          return;
        }

        if (promptingEngineToUse === 'cloud') {

          let request;
          let controllerName, actionName;
          let loggedPrompt;

          let callType = model.type;
          let inferenceEngine = model.args.inferenceEngine;

          let targetLanguage = prompt.targetLanguage ?? this.promptTargetLanguage;
          let sourceLanguage = prompt.sourceLanguage ?? this.promptSourceLanguage;

          if(model.args.apiCallType === 'raw') {

            controllerName = "Prompt";
            actionName = "RawPromptStream";

            let cloudInput = applyPromptChatFormat(input.systemPrefix, input.systemSuffix, input.userPrefix, input.userSuffix, input.assistantPrefix, input.assistantSuffix, input.textMessages);
            const inputTokens = tokenise(input)?.length ?? 0;

            if(input.maxTokens && inputTokens > input.maxTokens) {
              Notify.create({
                icon: 'error',
                color: 'negative',
                position: 'bottom-right',
                message: 'Input text is too long for the model.',
                actions: [
                  { icon: 'close', color: 'white', round: true, handler: () => { /* ... */ } }
                ]
              });

              pr.error = 'Input text is too long for the model.';

              reject(new Error('Input text is too long for the model.'));
              this.isPrompting = false;
              return;
            }

            request = {
              callType: callType,
              inferenceEngine: inferenceEngine,
              apiUrl: model.args.url,

              input: cloudInput,
              modelName: model.modelName,
              modelQuants: model.modelQuants,

              contextSize: model.contextSize,
              gpuLayers: model.gpuLayers,

              translationOptions: {
                sourceLanguage: sourceLanguage?.code,
                targetLanguage: targetLanguage?.code,
              },
              antiPrompts: model.defaultStopStrings,
              temperature: input.temperature,
              maxTokens: input.maxTokens,
              topP: input.topP,
              minP: input.minP,
              topK: input.topK,
              repeatPenalty: input.repeatPenalty,
              frequencyPenalty: input.frequencyPenalty,
              presencePenalty: input.presencePenalty,

              jsonMode: input.jsonMode,
            };

            loggedPrompt = this.pushLastPrompt({
              model: model.modelName,
              input: cloudInput,
              timeStamp: new Date().toISOString(),
              pr: pr
            });

            console.log(cloudInput, model.defaultStopStrings, input.temperature, input.maxTokens, input.topP, input.minP, input.topK, input.repeatPenalty, input.frequencyPenalty, input.presencePenalty);

          } else if (model.args.apiCallType === 'chat') {

            controllerName = "Prompt";
            actionName = "ChatPromptStream";

            const messages = input.textMessages.map(m => {
              return {
                role: m.type,
                content: m.text,
              };
            });

            const inputTokens = tokenise(JSON.stringify(messages))?.length ?? 0;

            loggedPrompt = this.pushLastPrompt({
              model: model.modelName,
              input: JSON.stringify(messages),
              timeStamp: new Date().toISOString(),
              pr: pr
            });

            request = {
              callType: callType,
              inferenceEngine: inferenceEngine,
              apiUrl: model.args.url,

              messages: messages,
              modelName: model.modelName,
              modelQuants: model.modelQuants,

              contextSize: model.contextSize,
              gpuLayers: model.gpuLayers,

              translationOptions: {
                sourceLanguage: sourceLanguage?.code,
                targetLanguage: targetLanguage?.code,
              },

              antiPrompts: model.defaultStopStrings,
              temperature: input.temperature,
              maxTokens: input.maxTokens,
              topP: input.topP,
              minP: input.minP,
              topK: input.topK,
              repeatPenalty: input.repeatPenalty,
              frequencyPenalty: input.frequencyPenalty,
              presencePenalty: input.presencePenalty,

              jsonMode: input.jsonMode,
            }
          }

          console.log('Prompting with:', request);

          const user = useCurrentUser();

          const idToken = await user.value.getIdToken();

          promptStream(idToken, request,
            (text) => {
              pr.waitingForResponse = false;

              if(pr.meta === null) {
                pr.text += text;
                pr.originalText += text;

                if(pr.text.includes('[[META]]')) {
                  // extract text after [[META]]
                  const meta = pr.text.split('[[META]]')[1];
                  pr.text = pr.text.split('[[META]]')[0];
                  pr.originalText = pr.originalText.split('[[META]]')[0];

                  pr.meta = '';
                  pr.meta += meta;
                }
              } else {
                pr.meta += text;
              }
            },
            () => {

              pr.waitingForResponse = false;

              let meta = pr.meta ?? '';

              if(meta.startsWith('[[INFO]]')) {
                meta = meta.substring('[[INFO]]'.length);

                Notify.create({
                  message: meta,
                  group: false,
                  color: 'primary',
                  position: 'bottom-right',
                });
              } else if(meta.startsWith('[[NOCREDITS]]')) {

                layoutStore.lowOnCreditsDialog = true;
              } else if(meta.startsWith('[[ERROR]]')) {
                meta = meta.substring('[[ERROR]]'.length);

                Notify.create({
                  message: meta,
                  group: false,
                  color: 'negative',
                  position: 'bottom-right',
                });
              } else if(meta.startsWith('[[STATS]]')) {
                meta = meta.substring('[[STATS]]'.length);
                const obj = JSON.parse(meta);

                pr.stats = obj;
              }

              const stopStrings = model.defaultStopStrings.split(',');
              // remove stop strings
              for (const stopString of stopStrings) {
                pr.text = pr.text.replace(stopString, '');
                pr.originalText = pr.originalText.replace(stopString, '');
              }

              if (pr.text.trimEnd().endsWith('>')) {
                pr.text = pr.text.trimEnd().substring(0, pr.text.length - 2);
                pr.originalText = pr.originalText.trimEnd().substring(0, pr.originalText.length - 2);
              }

              // trim start
              pr.text = pr.text.trimStart();
              pr.originalText = pr.originalText.trimStart();

              // trim end
              pr.text = pr.text.trimEnd();
              pr.originalText = pr.originalText.trimEnd();

              // replace new lines with <br>
              //pr.text = pr.text.replace(/\n/g, '<br>');

              // transform into paragraphs
              //pr.text = transformBrToParagraphs(pr.text);

              resolve(pr);

              this.isPrompting = false;
            },
            (err) => {
              pr.waitingForResponse = false;

              if(loggedPrompt) loggedPrompt.error = err;
              pr.error = err;

              reject(err);

              this.isPrompting = false;
            },
            this.promptAbortController,
            controllerName, actionName);
        }
        else if (promptingEngineToUse === 'lmstudio') {

          let modelUrl = model.args.url;
          if(modelUrl.endsWith('/')) {
            modelUrl = modelUrl.substring(0, modelUrl.length - 1);
          }

          const openai = new OpenAI({
            apiKey: 'lm-studio',
            baseURL: modelUrl + '/v1',
            dangerouslyAllowBrowser: true,
          });

          const messages = input.textMessages.map(m => {
            return {
              role: m.type,
              content: m.text,
            };
          })

          const loggedPrompt = this.pushLastPrompt({
            model: model.modelName,
            input: JSON.stringify(messages),
            timeStamp: new Date().toISOString(),
            pr: pr
          });

          try {

            const stream = await openai.chat.completions.create({
                model: model.modelName,
                messages: messages,
                stream: true,

                frequency_penalty: input.frequencyPenalty,
                presence_penalty: input.presencePenalty,

                temperature: input.temperature,
                top_p: input.topP,

                max_tokens: input.maxTokens,
                stop: model.defaultStopStrings.length > 0 ? undefined : model.defaultStopStrings,
                //response_format: input.jsonMode === true ? { "type": "json_object" } : undefined,
              },
              {
                signal: this.promptAbortController.signal,
                method: 'POST',
              });
            for await (const chunk of stream) {
              pr.waitingForResponse = false;
              pr.text += chunk.choices[0]?.delta?.content ?? '';
              pr.originalText += chunk.choices[0]?.delta?.content ?? '';
            }

            pr.waitingForResponse = false;

            resolve(pr);

            this.isPrompting = false;
          }
          catch (err) {
            pr.waitingForResponse = false;
            if(loggedPrompt) loggedPrompt.error = err;
            pr.error = err;

            reject(err);

            this.isPrompting = false;
          }
        }
        else if (promptingEngineToUse === 'client-openai') { // JS client for openai

          let options = {
            apiKey: customApiKey ?? model.auth.apiKey,
            dangerouslyAllowBrowser: true,
          }

          if(customApiUrl) {
            options.baseURL = customApiUrl;
          }

          const openai = new OpenAI(options);

          const messages = input.textMessages.map(m => {
            return {
              role: m.type,
              content: m.text,
            };
          })

          const loggedPrompt = this.pushLastPrompt({
            model: model.modelName,
            input: JSON.stringify(messages),
            timeStamp: new Date().toISOString(),
            pr: pr
          });

          try {
            const stream = await openai.chat.completions.create({
                model: model.modelName,
                messages: messages,
                stream: true,

                frequency_penalty: input.frequencyPenalty,
                presence_penalty: input.presencePenalty,

                temperature: input.temperature,
                top_p: input.topP,

                max_tokens: input.maxTokens,
                stop: model.defaultStopStrings.length > 0 ? undefined : model.defaultStopStrings,
                response_format: input.jsonMode === true ? { type: "json_object" } : undefined,
              },
              {
                signal: this.promptAbortController.signal,
              });
            for await (const chunk of stream) {
              pr.waitingForResponse = false;
              pr.text += chunk.choices[0]?.delta?.content ?? '';
              pr.originalText += chunk.choices[0]?.delta?.content ?? '';
            }

            pr.waitingForResponse = false;

            resolve(pr);

            this.isPrompting = false;
          }
          catch (err) {
            pr.waitingForResponse = false;
            if(loggedPrompt) loggedPrompt.error = err;
            pr.error = err;

            reject(err);

            this.isPrompting = false;
          }
        }
        else if (promptingEngineToUse === 'client-anthropic') { // JS client for openai

          const client = new Anthropic({
            apiKey: customApiKey,
            dangerouslyAllowBrowser: true
          });

          let systemMessage = '';

          const messages = input.textMessages.filter(m => m.type !== 'system').map(m => {
            return {
              role: m.type,
              content: m.text,
            };
          })

          for (const message of input.textMessages) {
            if(message.type === 'system') {
              systemMessage = message.text + '\n';
            }
          }

          const loggedPrompt = this.pushLastPrompt({
            model: model.modelName,
            input: JSON.stringify(messages),
            timeStamp: new Date().toISOString(),
            pr: pr
          });

          try {

            const stream = await client.messages.stream({
              system: systemMessage,

              temperature: input.temperature,
              top_p: input.topP,

              max_tokens: input.maxTokens,

              messages: messages,
              model: model.modelName,
              stream: true,
            }, {
              signal: this.promptAbortController.signal,
            }).on('text', (text) => {
              pr.waitingForResponse = false;
              pr.text += text;
              pr.originalText += text;
            });

            const message = await stream.finalMessage();

            pr.text += message.text;
            pr.originalText += message.text;

            pr.waitingForResponse = false;

            resolve(pr);

            this.isPrompting = false;
          }
          catch (err) {
            pr.waitingForResponse = false;
            if(loggedPrompt) loggedPrompt.error = err;
            pr.error = err;

            reject(err);

            this.isPrompting = false;
          }
        }
        else if (promptingEngineToUse === 'client-ollama') { // JS client for ollama

          const ollama = new Ollama({ host: model.args.url })

          let loggedPrompt;

          try {

            let stream;
            let options;

            if(model.args.apiCallType === 'raw') {

              const input = applyPromptChatFormat(input.systemPrefix, input.systemSuffix, input.userPrefix, input.userSuffix, input.assistantPrefix, input.assistantSuffix, input.textMessages);

              options = {
                top_k: input.topK,
                top_p: input.topP,
                temperature: input.temperature,
                stop: model.defaultStopStrings.length > 0 ? undefined : model.defaultStopStrings,
                repeat_penalty: input.repeatPenalty,
                frequency_penalty: input.frequencyPenalty,
                presence_penalty: input.presencePenalty,
                num_ctx: model.contextSize,
                num_predict: input.maxTokens,
              }

              loggedPrompt = this.pushLastPrompt({
                model: model.modelName,
                input: input,
                timeStamp: new Date().toISOString(),
                pr: pr
              });

              stream = await ollama.generate({
                model: model.modelName,
                prompt: input,
                format: input.jsonMode === true ? "json" : undefined,
                raw: true,
                stream: true,
                options: options
              });

              for await (const chunk of stream) {
                pr.waitingForResponse = false;
                pr.text += chunk?.response ?? '';
                pr.originalText += chunk?.response ?? '';
              }

              pr.waitingForResponse = false;
            } else if (model.args.apiCallType === 'chat') {

              const messages = input.textMessages.map(m => {
                return {
                  role: m.type,
                  content: m.text,
                };
              })

              options = {
                top_k: input.topK,
                top_p: input.topP,
                temperature: input.temperature,
                num_ctx: model.contextSize,
                repeat_penalty: input.repeatPenalty,
                frequency_penalty: input.frequencyPenalty,
                presence_penalty: input.presencePenalty,
                num_predict: input.maxTokens
              }

              loggedPrompt = this.pushLastPrompt({
                model: model.modelName,
                input: JSON.stringify(messages),
                timeStamp: new Date().toISOString(),
                pr: pr
              });

              stream = await ollama.chat({
                model: model.modelName,
                messages: messages,
                stream: true,
                options: options,
                format: input.jsonMode === true ? "json" : undefined,
              });

              for await (const chunk of stream) {
                pr.waitingForResponse = false;
                pr.text += chunk?.message?.content ?? '';
                pr.originalText += chunk?.message?.content ?? '';
              }

              pr.waitingForResponse = false;
            }

            resolve(pr);

            this.isPrompting = false;
          }
          catch (err) {
            pr.waitingForResponse = false;

            if(loggedPrompt) loggedPrompt.error = err;
            pr.error = err;

            reject(err);

            this.isPrompting = false;
          }
        }
        else if(promptingEngineToUse === 'client-dall-e') {

          const promptData = applyPromptFormatPrefixSuffix(input.systemPrefix, input.systemSuffix, input.systemPrompt, input.userPrefix, input.userSuffix, input.userPrompt, input.assistantPrefix, input.assistantSuffix);

          const loggedPrompt = this.pushLastPrompt({
            model: model.modelName,
            input: JSON.stringify(promptData),
            timeStamp: new Date().toISOString(),
            pr: pr
          });

          try {
            let response;

            let request = {
              modelName: model.modelName,
              prompt: promptData,
              number: 1,
              size: '1024x1024',
              quality: 'standard',
            }

            const user = useCurrentUser();

            const idToken = await user.value.getIdToken();

            response = await generateImage(idToken, request, this.promptAbortController);

            /*response = await openai.images.generate({
              model: model.modelName,
              prompt: promptData,
              n: 1,
              size: '1024x1024',
              quality: 'standard',
            });*/

            pr.type = 'image';
            if(!pr.images) {
              pr.images = [];
            }

            pr.images.push(response[0].url);

            resolve(pr);

            pr.waitingForResponse = false;
            this.isPrompting = false;
          }
          catch (err) {
            pr.waitingForResponse = false;

            if(loggedPrompt) loggedPrompt.error = err;
            pr.error = err;
            reject(err);

            this.isPrompting = false;
          }

        }
        else if(promptingEngineToUse === 'automatic1111-sd') {

          const loggedPrompt = this.pushLastPrompt({
            model: model.modelName,
            input: JSON.stringify({prompt: input.systemPrompt + input.userPrompt}),
            timeStamp: new Date().toISOString(),
            pr: pr
          });

          //const promptData = applyPromptFormat(promptFormat, systemPrompt, userPrompt);
          const promptData = applyPromptFormatPrefixSuffix(input.systemPrefix, input.systemSuffix, input.systemPrompt, input.userPrefix, input.userSuffix, input.userPrompt, input.assistantPrefix, input.assistantSuffix);

          try {
            const result = await promptLocalAutomatic1111(model.args.url, promptData, this.promptAbortController);

            if(result) {
              pr.type = 'image';
              if(!pr.images) {
                pr.images = [];
              }
              pr.images.push(...result.images);
              resolve(pr);
            } else {
              reject(null);
            }

            pr.waitingForResponse = false;
            this.isPrompting = false;
          } catch (err) {
            pr.waitingForResponse = false;

            if(loggedPrompt) loggedPrompt.error = err;
            pr.error = err;

            reject(err);

            this.isPrompting = false;

          }
        }
      });
      return promise;
    },
    finishPromptResult(pr) {
      if(!pr) return;
      // trim start
      pr.text = pr.text.trimStart();
      pr.originalText = pr.originalText.trimStart();

      // trim end
      pr.text = pr.text.trimEnd();
      pr.originalText = pr.originalText.trimEnd();

      // replace new lines with <br>
      //pr.text = pr.text.replace(/\n/g, '<br>');
    },
    stopPrompt() {
      if(this.isPrompting) {
        this.promptAbortController.abort();
        this.isPrompting = false;
      }
    },
    pushLastPrompt(prompt) {
      if(this.lastPrompts.length > 10) {
        this.lastPrompts.shift();
      }
      this.lastPrompts.push(prompt);
      return prompt;
    },
    newPromptResultsHistory() {
      this.getTabData(this.currentTab).promptResultsHistory.push([]);
      this.getTabData(this.currentTab).promptResultsIndex = this.getTabData(this.currentTab).promptResultsHistory.length - 1;
    },
    removePromptResultsHistoryItem(index) {
      if(index === null || index < 0 || index >= this.getTabData(this.currentTab).promptResultsHistory.length) {
        return;
      }

      this.getTabData(this.currentTab).promptResultsHistory.splice(index, 1);
      this.getTabData(this.currentTab).promptResultsIndex --;
      if(this.getTabData(this.currentTab).promptResultsIndex < 0) {
        this.getTabData(this.currentTab).promptResultsIndex = 0;
      }
    },
    async runPromptResultAction(promptResult, action, parameter) {
      if(action.type === "Run Prompt") {
        const promptToExecute = this.getPromptById(action.typeParameter);

        if(promptToExecute) {
          await executePromptClick(promptToExecute, replaceParameterEditorText(promptResult.originalText ?? promptResult.text));
        } else {
          Notify.create({
            icon: 'error',
            color: 'negative',
            position: 'bottom-right',
            message: 'Prompt not found',
          });
        }

      } else if(action.type === "Add to Context") {

        const layoutStore = useLayoutStore();

        layoutStore.openPromptActionDialog(action, promptResult);
      } else if(action.type === "Reply") {

        const message = action.typeParameter;

        await replyToPrompt(promptResult, message);
      } else if(action.type === "Save to Variable") {

        const fileStore = useFileStore();
        const variable = fileStore.variables.find(v => v.title === action.typeParameter);

        if(variable) {
          variable.value = replaceParameterEditorText(promptResult.originalText ?? promptResult.text);

          Notify.create({
            message: 'Copied to ' + variable.title,
            color: 'positive',
            position: 'top-right',
            timeout: 1000,
          });
        }
      }
    },
    createPromptResult(prompt, contextTypes, parametersValue, promptArgs, silent, promptSource) {
      let pr = {
        prompt: prompt,
        promptArgs: promptArgs,
        text: '',
        originalText: '',
        meta: null,
        type: 'text',
        waitingForResponse: true,
        contextTypes,
        parametersValue,
        collapsed: false,
      };

      if(!silent) {
        if(prompt.promptType === 'selectionAnalysis' || promptSource === 'selectionAnalysis') {
          this.selectionPromptResults.push(pr);
          pr = this.selectionPromptResults[this.selectionPromptResults.length - 1];
        } else if (prompt.promptType === 'chat' && this.currentTab.tabType === 'chat') {
          let results = this.getTabData(this.currentTab).promptResultsHistory[this.getTabData(this.currentTab).promptResultsIndex];

          if(!results) {
            this.newPromptResultsHistory();

            results = this.getTabData(this.currentTab).promptResultsHistory[this.getTabData(this.currentTab).promptResultsIndex];
          }

          results.push(pr);
          pr = results[results.length - 1];

        } else {
          //const results = this.getTabData(this.currentTab).promptResultsHistory[this.getTabData(this.currentTab).promptResultsHistory.length - 1];
          let results = this.getTabData(this.currentTab).promptResultsHistory[this.getTabData(this.currentTab).promptResultsIndex];

          results.push(pr);
          pr = results[results.length - 1];
        }

        const resultGroupsCount = this.getTabData(this.currentTab).promptResultsHistory.length;
        if(resultGroupsCount > 30) {
          this.getTabData(this.currentTab).promptResultsHistory.splice(0, 1);
          this.getTabData(this.currentTab).promptResultsIndex -= 1;
        }
      }

      return pr;
    },
    removePromptResult(pr) {
      this.stopPrompt();

      const results = this.getTabData(this.currentTab).promptResultsHistory[this.getTabData(this.currentTab).promptResultsIndex];
      results.splice(results.indexOf(pr), 1);

    },
    async spellCheck(text) {
      //await spellCheckRequest(text, this.currentSpellCheckLanguage.value); // TODO set language

      //TODO cloud spell check
    },
    setCurrentTabResultsIndex(index) {
      this.getTabData(this.currentTab).promptResultsIndex = index;
    },
    newPromptResultsPage() {
      this.getTabData(this.currentTab).promptResultsIndex = this.getTabData(this.currentTab).promptResultsHistory.length;
      this.getTabData(this.currentTab).promptResultsHistory.push([]);
      this.getTabData(this.currentTab).promptResultsIndex = this.getTabData(this.currentTab).promptResultsHistory.length - 1;

      //
    },
    clearPromptHistory() {
      this.getTabData(this.currentTab).promptResultsHistory.splice(0, this.getTabData(this.currentTab).promptResultsHistory.length);
      this.getTabData(this.currentTab).promptResultsIndex = 0;
    },
    removePromptsAndResults() {
      this.prompts.splice(0, this.prompts.length);

      for (const tab of this.tabs) {
        this.getTabData(tab).promptResultsHistory = [];
      }
    },
    removePrompt(prompt) {
      const index = this.prompts.indexOf(prompt);
      this.prompts.splice(index, 1);
    },
    clonePrompt(prompt) {
      const newPrompt = JSON.parse(JSON.stringify(prompt));
      newPrompt.id = guid();
      newPrompt.title = prompt.title + ' (clone)';
      const index = this.prompts.indexOf(prompt);

      // insert new prompt at index
      this.prompts.splice(index, 0, newPrompt);
    },
    pushPromptOrder(prompt, addIndex) {
      let index = this.prompts.indexOf(prompt);
      index += addIndex;

      if(index < 0) {
        index = 0;
      }
      if(index > this.prompts.length - 1) {
        index = this.prompts.length - 1;
      }

      this.prompts.splice(index, 0, this.prompts.splice(this.prompts.indexOf(prompt), 1)[0]);
    },
    pushCategoryOrder(category, addIndex) {
      let index = this.promptCategories.indexOf(category);
      index += addIndex;

      if(index < 0) {
        index = 0;
      }
      if(index > this.promptCategories.length - 1) {
        index = this.promptCategories.length - 1;
      }

      this.promptCategories.splice(index, 0, this.promptCategories.splice(this.promptCategories.indexOf(category), 1)[0]);
    },
    updatePrompt(prompt, args) {
      if(!prompt) return;
      if(args.enabled !== undefined) {
        prompt.enabled = args.enabled;
      }
      if(args.title !== undefined) {
        prompt.title = args.title;
      }
      if(args.description !== undefined) {
        prompt.description = args.description;
      }
      if(args.guide !== undefined) {
        prompt.guide = args.guide;
      }
      if(args.color !== undefined) {
        prompt.color = args.color;
      }
      if(args.icon !== undefined) {
        prompt.icon = args.icon;
      }
      if(args.systemPrompt !== undefined) {
        prompt.systemPrompt = args.systemPrompt;
      }
      if(args.category !== undefined) {
        prompt.category = args.category;
      }
      if(args.folder !== undefined) {
        prompt.folder = args.folder;
      }
      if(args.enablePromptRuns !== undefined) {
        prompt.enablePromptRuns = args.enablePromptRuns;
        this.onEnablePromptRuns(prompt);
      }
      if(args.userPrompt !== undefined) {
        prompt.userPrompt = args.userPrompt;
      }
      if(args.userPrompt2 !== undefined) {
        prompt.userPrompt2 = args.userPrompt2;
      }
      if(args.assistantPrompt !== undefined) {
        prompt.assistantPrompt = args.assistantPrompt;
      }
      if(args.overridePromptTimes !== undefined) {
        prompt.overridePromptTimes = args.overridePromptTimes;
      }
      if(args.overrideContexts !== undefined) {
        prompt.overrideContexts = args.overrideContexts;
      }
      if(args.defaultContextTypes !== undefined) {
        prompt.defaultContextTypes = args.defaultContextTypes;
      }
      if(args.excludedContextTypes !== undefined) {
        prompt.excludedContextTypes = args.excludedContextTypes;
      }
      if(args.promptType !== undefined) {
        prompt.promptType = args.promptType;
      }
      if(args.promptStyle !== undefined) {
        prompt.promptStyle = args.promptStyle;
      }
      if(args.hasParameters !== undefined) {
        prompt.hasParameters = args.hasParameters;
      }
      if(args.overrideSystemPrompt !== undefined) {
        prompt.overrideSystemPrompt = args.overrideSystemPrompt;
      }
      if(args.overridePromptFormat !== undefined) {
        prompt.overridePromptFormat = args.overridePromptFormat;
      }
      if(args.systemPromptPrefix !== undefined) {
        prompt.systemPromptPrefix = args.systemPromptPrefix;
      }
      if(args.systemPromptSuffix !== undefined) {
        prompt.systemPromptSuffix = args.systemPromptSuffix;
      }
      if(args.userPromptPrefix !== undefined) {
        prompt.userPromptPrefix = args.userPromptPrefix;
      }
      if(args.userPromptSuffix !== undefined) {
        prompt.userPromptSuffix = args.userPromptSuffix;
      }
      if(args.assistantPromptPrefix !== undefined) {
        prompt.assistantPromptPrefix = args.assistantPromptPrefix;
      }
      if(args.assistantPromptSuffix !== undefined) {
        prompt.assistantPromptSuffix = args.assistantPromptSuffix;
      }
      if(args.hasExtendedChatMessages !== undefined) {
        prompt.hasExtendedChatMessages = args.hasExtendedChatMessages;
      }
      if(args.tabId !== undefined) {
        prompt.tabId = args.tabId.value;
      }
      if(args.modelId !== undefined) {
        if(prompt.id.startsWith(prompt.modelId)) {
          prompt.id = prompt.id.replace(prompt.modelId, args.modelId.value);
        }
        prompt.modelId = args.modelId.value;
      }
      if(args.overrideTopP !== undefined) {
        prompt.settings.overrideTopP = args.overrideTopP;
      }
      if(args.overrideTemperature !== undefined) {
        prompt.settings.overrideTemperature = args.overrideTemperature;
      }
      if(args.overrideMaxTokens !== undefined) {
        prompt.settings.overrideMaxTokens = args.overrideMaxTokens;
      }
      if(args.overridePresencePenalty !== undefined) {
        prompt.settings.overridePresencePenalty = args.overridePresencePenalty;
      }
      if(args.overrideFrequencyPenalty !== undefined) {
        prompt.settings.overrideFrequencyPenalty = args.overrideFrequencyPenalty;
      }
      if(args.temperature !== undefined) {
        prompt.settings.temperature = args.temperature;
      }
      if(args.maxTokens !== undefined) {
        prompt.settings.maxTokens = args.maxTokens;
      }
      if(args.topP !== undefined) {
        prompt.settings.topP = args.topP;
      }
      if(args.frequencyPenalty !== undefined) {
        prompt.settings.frequencyPenalty = args.frequencyPenalty;
      }
      if(args.presencePenalty !== undefined) {
        prompt.settings.presencePenalty = args.presencePenalty;
      }
      if(args.targetLanguage !== undefined) {
        prompt.targetLanguage = args.targetLanguage;
      }

      if(args.sourceLanguage !== undefined) {
        prompt.sourceLanguage = args.sourceLanguage;
      }

      this.onUpdatePrompt(prompt);
    },
    onUpdatePrompt(prompt) {

      if(prompt.userPrompt || prompt.systemPrompt) {
        this.toggleTag(prompt, 'context', prompt.userPrompt.includes('$context') || prompt.systemPrompt.includes('$context'));
      }

      if(prompt.folder) {
        if(this.promptFolders.find(f => f.label === prompt.folder) === undefined) {
          this.promptFolders.push({label: prompt.folder, color: ''});
        }
      }

      if(prompt.category) {
        if(this.promptCategories.find(f => f.label === prompt.category) === undefined) {
          this.promptCategories.push({label: prompt.category, color: ''});
        }
      }
    },
    getPromptById(id) {
      return this.prompts.find(p => p.id === id);
    },
    toggleTag(prompt, tag, add) {
      if(!prompt.info) {
        prompt.info = {};
        prompt.info.tags = [];
      }

      if(add === true && !prompt.info.tags.includes(tag)) {
        prompt.info.tags.push(tag);
      } else if(add === false && prompt.info.tags.includes(tag)) {
        prompt.info.tags.splice(prompt.info.tags.indexOf(tag), 1);
      }
    },
    updatePromptParameter(prompt, parameter, args) {
      if(!parameter) return;
      if(args.name !== undefined) {
        parameter.name = args.name;
      }
      if(args.type !== undefined) {
        parameter.type = args.type;
      }
      if(args.default !== undefined) {
        parameter.default = args.default;
      }
      if(args.hint !== undefined) {
        parameter.hint = args.hint;
      }
      if(args.prefixWith !== undefined) {
        parameter.prefixWith = args.prefixWith;
      }
      if(args.suffixWith !== undefined) {
        parameter.suffixWith = args.suffixWith;
      }
      if(args.required !== undefined) {
        parameter.required = args.required;
      }
      if(args.examples !== undefined) {
        parameter.examples = args.examples;
      }

      this.onUpdatePrompt(prompt);
    },
    addPromptAction(prompt) {
     if(!prompt) return;

      if(!prompt.actions) {
        prompt.actions = [];
      }

      prompt.actions.push({
        title: 'Action',
        type: '',
      });

      this.onUpdatePrompt(prompt);
    },
    deletePromptAction(prompt, action) {
      if(!prompt || !prompt.actions) return;
      const index = prompt.actions.indexOf(action);
      prompt.actions.splice(index, 1);

      this.onUpdatePrompt(prompt);
    },
    addPromptParameter(prompt) {
      if(!prompt) return;

      prompt.parameters.push({
        name: 'Parameter',
        type: 'Text',
        values: [],
        hint: '',
        default: '',
        required: false,
        prefixWith: '',
        suffixWith: ''
      });

      this.onUpdatePrompt(prompt);
    },
    updatePromptAction(prompt, action, args) {
      if(!action || !args) return;
      if(args.title !== undefined) {
        action.title = args.title;
      }

      if(args.type !== undefined) {
        action.type = args.type;
      }

      if(args.typeParameter !== undefined) {
        action.typeParameter = args.typeParameter;
      }

      this.onUpdatePrompt(prompt);
    },
    deletePromptParameter(prompt, parameter) {
      if(!prompt) return;
      const index = prompt.parameters.indexOf(parameter);
      prompt.parameters.splice(index, 1);

      this.onUpdatePrompt(prompt);
    },
    pushParameterOrder(prompt, parameter, addIndex) {
      let index = prompt.parameters.indexOf(parameter);
      index += addIndex;

      if(index < 0) {
        index = 0;
      }
      if(index > prompt.parameters.length - 1) {
        index = prompt.parameters.length - 1;
      }

      prompt.parameters.splice(index, 0, prompt.parameters.splice(prompt.parameters.indexOf(parameter), 1)[0]);
    },
    addPromptParameterValue(prompt, parameter) {
      if(!prompt || !parameter) return;
      parameter.values.push('');

      this.onUpdatePrompt(prompt);
    },
    deletePromptParameterValue(prompt, parameter, index) {
      if(!prompt || !parameter) return;
      parameter.values.splice(index, 1);

      this.onUpdatePrompt(prompt);
    },
    updateParameterValue(prompt, parameter, index, value) {
      if(!prompt || !parameter) return;
      parameter.values[index] = value;

      this.onUpdatePrompt(prompt);
    },
    addNewPrompt(modelId, parameters = null) {
      const lastId = this.prompts[this.prompts.length - 1].id;

      this.prompts.push(
        {
          id: modelId + '_' + guid(),
          enabled: true,
          title: parameters?.promptName ?? 'New prompt',
          description: parameters?.promptDescription ?? '',
          color: parameters?.promptColor ?? '',
          icon: parameters?.promptIcon ?? '',
          modelId: modelId,
          category: parameters?.promptCategory ?? '',
          folder: parameters?.promptFolder ?? '',
          overridePromptFormat: false,
          promptFormat: '',
          tabId: this.tabs[0].id,
          overrideSystemPrompt: (parameters?.systemPrompt != null && parameters.systemPrompt.length > 0) ?? false,
          systemPrompt: parameters?.systemPrompt ?? '',
          userPrompt: parameters?.userPrompt ?? '$selection',
          inline: true,
          promptType: parameters?.promptType ?? "inline",
          hasParameters: false,
          overridePromptTimes: "1",
          parameters: [],
          settings: {},
        }
      );

      const prompt = this.prompts[this.prompts.length - 1];
      this.onUpdatePrompt(prompt);

      return prompt;
    },
    askRemoveModel(model) {
      Dialog.create(
        {
          title: 'Confirm',
          message: 'Would you like to remove the model and all its prompts?',
          cancel: true,
          persistent: true
        }).onOk(() => {
        this.removeModel(model).then(() => {});
      }).onCancel(() => {
      }).onDismiss(() => {
        }
      )
    },
    async removeModel(model) {
      if(model && model.canBeDeleted) {

        try {
          await this.undownloadModel(model);
        } catch (e) {
          Notify.create({
            icon: 'error',
            color: 'negative',
            position: 'top',
            message: 'Could not delete the model',
            actions: [
              {
                icon: 'close', color: 'white', round: true, handler: () => { /* ... */
                }
              }
            ]
          })
        }

        this.models.splice(this.models.indexOf(model), 1);

        const promptsToRemove = this.prompts.filter(p => p.modelId === model.id);
        for(const prompt of promptsToRemove) {
          this.removePrompt(prompt);
        }
      }
    },
    updateModel(model, args) {
      if(!model) return;
      if(args.name !== undefined) {
        model.name = args.name;
      }
      if(args.description !== undefined) {
        model.description = args.description;
      }
      if(args.modelName !== undefined) {
        model.modelName = args.modelName;
      }
      if(args.modelQuants !== undefined) {
        model.modelQuants = args.modelQuants;
      }
      if(args.type !== undefined) {
        model.type = args.type;
      }
      if(args.apiKey !== undefined) {
        model.auth.apiKey = args.apiKey;
      }
      if(args.url !== undefined) {
        if(model.args === undefined) {
          model.args = {};
        }
        model.args.url = args.url;
      }
      if(args.apiCallType !== undefined) {
        if(model.args === undefined) {
          model.args = {};
        }
        model.args.apiCallType = args.apiCallType;
      }
      if(args.inferenceEngine !== undefined) {
        if(model.args === undefined) {
          model.args = {};
        }
        model.args.inferenceEngine = args.inferenceEngine;
      }
      if(args.enabled !== undefined) {
        model.enabled = args.enabled;
      }
      if(args.promptTimes !== undefined) {
        model.promptTimes = args.promptTimes;
      }
      if(args.defaultSystemPrompt !== undefined) {
        model.defaultSystemPrompt = args.defaultSystemPrompt;
      }

      if(args.defaultSystemPromptPrefix !== undefined) {
        model.defaultSystemPromptPrefix = args.defaultSystemPromptPrefix;
      }
      if(args.defaultSystemPromptSuffix !== undefined) {
        model.defaultSystemPromptSuffix = args.defaultSystemPromptSuffix;
      }
      if(args.defaultUserPromptPrefix !== undefined) {
        model.defaultUserPromptPrefix = args.defaultUserPromptPrefix;
      }
      if(args.defaultUserPromptSuffix !== undefined) {
        model.defaultUserPromptSuffix = args.defaultUserPromptSuffix;
      }
      if(args.defaultAssistantPromptPrefix !== undefined) {
        model.defaultAssistantPromptPrefix = args.defaultAssistantPromptPrefix;
      }
      if(args.defaultAssistantPromptSuffix !== undefined) {
        model.defaultAssistantPromptSuffix = args.defaultAssistantPromptSuffix;
      }

      if(args.defaultStopStrings !== undefined) {
        model.defaultStopStrings = args.defaultStopStrings;
      }
      if(args.defaultTemperature !== undefined) {
        model.defaultTemperature = args.defaultTemperature;
      }
      if(args.defaultMaxTokens !== undefined) {
        model.defaultMaxTokens = args.defaultMaxTokens;
      }
      if(args.defaultTopP !== undefined) {
        model.defaultTopP = args.defaultTopP;
      }
      if(args.defaultMinP !== undefined) {
        model.defaultMinP = args.defaultMinP;
      }
      if(args.defaultTopK !== undefined) {
        model.defaultTopK = args.defaultTopK;
      }
      if(args.defaultFrequencyPenalty !== undefined) {
        model.defaultFrequencyPenalty = args.defaultFrequencyPenalty;
      }
      if(args.defaultPresencePenalty !== undefined) {
        model.defaultPresencePenalty = args.defaultPresencePenalty;
      }
      if(args.defaultRepeatPenalty !== undefined) {
        model.defaultRepeatPenalty = args.defaultRepeatPenalty;
      }
      if(args.contextSize !== undefined) {
        model.contextSize = args.contextSize;
      }
      if(args.gpuLayers !== undefined) {
        model.gpuLayers = args.gpuLayers;
      }
    },
    pushModelOrder(model, addIndex) {
      let index = this.models.indexOf(model);
      index += addIndex;

      if(index < 0) {
        index = 0;
      }
      if(index > this.models.length - 1) {
        index = this.models.length - 1;
      }

      this.models.splice(index, 0, this.models.splice(this.models.indexOf(model), 1)[0]);
    },
    setCurrentTabId(id) {
      if(this.tabs.find(t => t.id === id) !== undefined) {
        this.currentTab = this.tabs.find(t => t.id === id);
      }
    },
    getTab(id) {
      return this.tabs.find(t => t.id === id);
    },
    getModel(id) {
      return this.models.find(m => m.id === id);
    },
    updateTokens() {
      const fileStore = useFileStore();
      const tokens = fileStore.getCurrentTextTokens();

      this.currentTokensCount = tokens?.length ?? 0;
      this.currentWordsCount = fileStore.getCurrentTextWords();
    },
    setCharsCount(count) {
      this.currentCharsCount = count;
    },
    getUserProjectSettings() {
      const aiSettings = {
        tabs: this.tabs,

        prompts: this.prompts,
        predefinedPromptInstances: this.predefinedPromptInstances,
        models: this.models,
        currentModelForChatId: this.currentModelForChatId,
        currentPromptForChatId: this.currentPromptForChatId,
        currentChatInsertUserQueries: this.currentChatInsertUserQueries,
        currentDataPath: this.currentDataPath,
        currentModelPath: this.currentModelPath,
        defaultFileTemplate: this.defaultFileTemplate,
        fileTemplates: this.fileTemplates,
        currentSpellCheckLanguage: this.currentSpellCheckLanguage,
        //analysisEnabled: this.analysisEnabled,
        selectedAnalysisPrompts: this.selectedAnalysisPrompts,
        labels: this.labels,
        statuses: this.statuses,
        contextTypes: this.contextTypes,
        promptCategories: this.promptCategories,
        promptFolders: this.promptFolders,
        savedPromptContexts: this.savedPromptContexts,
        hubPromptPacks: this.hubPromptPacks,
        modelPromptPacks: this.modelPromptPacks,
      }

      return aiSettings;
    },
    restoreDefaultSettings() {
      this.models = [];
      this.currentModelForChatId = null;
      this.currentPromptForChatId = null;
      this.currentChatInsertUserQueries = true;

      this.promptCategories = [];
      this.promptFolders = [];

      this.removePromptsAndResults();
      this.prompts = [];

      this.tabs = [
        { id: 1, title: 'Prompts', tabType: "prompts", description: 'Tab for formatting the text', color: 'primary' },
        { id: 2, title: 'Chat', tabType: "chat", description: 'Tab for chatting with AI', color: 'secondary' },
      ];

      this.currentDataPath = '';
      this.currentModelPath = '';

      this.defaultFileTemplate = createFile('Template file');

      this.fileTemplates = [];

      this.currentSpellCheckLanguage = {
        "label": "English (USA)",
          "value": "en_US"
      };

      //this.analysisEnabled = false;
      this.selectedAnalysisPrompts = [];

      this.predefinedPrompts = [
        { promptType: 'Summarize Page', promptHint: 'Can be used to quickly generate file synopsies / summaries.' },
        { promptType: 'Prompt Description Generator', promptHint: 'Can be used to generate user-friendly description of AI prompts.' },
        { promptType: 'Prompt Refiner', promptHint: 'Can be used to refine roughly written AI prompts.' },
        { promptType: 'Prompt Follow-Up Generator', promptHint: 'Used to generate suitable follow-up replies to AI. Instruct AI to return JSON array of objects of the following structure: [\n' +
            '\t{"title": "Option 1 Title", "followUp": "The instruction for the AI"}\n' +
            ']' },
        { promptType: 'Word Finder', promptHint: 'Can be used when selecting text to find similar words.' },
      ];

      this.labels = [
        { label: 'Blue', color: 'blue' },
        { label: 'Red', color: 'red' },
        { label: 'Green', color: 'green' },
        { label: 'Yellow', color: 'yellow' },
        { label: 'Orange', color: 'orange' },
        { label: 'Purple', color: 'purple' },
        { label: 'Pink', color: 'pink' },
      ];

      this.statuses = [
        { label: 'To do', color: 'grey' },
        { label: 'First Draft', color: 'blue-grey' },
        { label: 'Revised Draft', color: 'brown' },
        { label: 'Final Draft', color: 'blue' },
        { label: 'Done', color: 'green' },
      ];

      this.contextTypes = [];
      this.promptContext = [];
      this.savedPromptContexts = [];
      this.predefinedPromptInstances = [];
    },
    async applyJsonSettings(json, overwriteModels = true, overwritePrompts = true, overwriteTabs = true, overwriteExistingPrompts = false) {
      const aiSettings = parseFromJson(json);

      await this.applySettings(aiSettings, overwriteModels, overwritePrompts, overwriteTabs, overwriteExistingPrompts);
    },
    async applySettings(aiSettings, overwriteModels = true, overwritePrompts = true, overwriteTabs = true, overwriteExistingPrompts = false) {
      if(aiSettings.models) {
        if(overwriteModels) {
          this.models = [];
        }

        // insert into models if not contains by id
        for(const model of aiSettings.models) {
          if(!this.models.find(m => m.id === model.id)) {
            this.models.push(model);
          }
        }
      }

      if(aiSettings.currentModelForChatId) {
        this.currentModelForChatId = aiSettings.currentModelForChatId;
      }

      if(aiSettings.savedPromptContexts) {
        this.savedPromptContexts = [];
        for(const context of aiSettings.savedPromptContexts) {
          this.savedPromptContexts.push(context);
        }
      }

      if(aiSettings.hubPromptPacks) {
        this.hubPromptPacks = [];
        for(const pack of aiSettings.hubPromptPacks) {
          this.hubPromptPacks.push(pack);
        }
      }

      if(aiSettings.modelPromptPacks) {
        this.modelPromptPacks = [];
        for(const pack of aiSettings.modelPromptPacks) {
          this.modelPromptPacks.push(pack);
        }
      }

      if(aiSettings.currentPromptForChatId) {
        this.currentPromptForChatId = aiSettings.currentPromptForChatId;
      }

      if(aiSettings.currentChatInsertUserQueries !== undefined) {
        this.currentChatInsertUserQueries = aiSettings.currentChatInsertUserQueries;
      }

      if(aiSettings.promptCategories) {
        if(overwritePrompts) {
          this.promptCategories = [];
        }
        for(const category of aiSettings.promptCategories) {
          if(!this.promptCategories.find(c => c.label === category.label)) {
            // insert into prompt categories into index so it is sorted alphabetically

            // Insert into promptCategories in an alphabetically sorted manner
            const index = this.promptCategories.findIndex(
              (item) => item.label.toLowerCase() > category.label.toLowerCase()
            );
            if (index === -1) {
              // No item has a label greater than the new category label,
              // so just push it to the end.
              this.promptCategories.push(category);
            } else {
              // We found an item whose label is "alphabetically after"
              // the new category label, so insert it at that index.
              this.promptCategories.splice(index, 0, category);
            }
          }
        }
      }

      if(aiSettings.promptFolders) {
        if(overwritePrompts) {
          this.promptFolders = [];
        }
        for(const folder of aiSettings.promptFolders) {
          if(!this.promptFolders.find(f => f.label === folder.label)) {
            this.promptFolders.push(folder);
          }
        }
      }

      if(aiSettings.prompts) {

        if(overwritePrompts) {
          await this.removePromptsAndResults();
          this.prompts = [];
        }

        // insert into prompts if not contains by id
        for(const prompt of aiSettings.prompts) {
          let existingPrompt = this.prompts.find(p => (p.id === prompt.id && p.modelId === prompt.modelId) || (p.title === prompt.title && p.modelId === prompt.modelId) );

          if(overwriteExistingPrompts && existingPrompt) {
            this.prompts.splice(this.prompts.indexOf(existingPrompt), 1);
            existingPrompt = null;
          }

          if(!existingPrompt) {
            this.onUpdatePrompt(prompt);
            this.prompts.push(prompt);
          }
        }

        // delete prompts without models
        for (const prompt of [...this.prompts]) {
          if (this.models.find(m => m.id === prompt.modelId) === undefined ){
            this.prompts.splice(this.prompts.indexOf(prompt), 1);
          }
        }
      }

      if (aiSettings.predefinedPromptInstances) {
        if(overwritePrompts) {
          this.predefinedPromptInstances = [];
        }

        for (const predefinedPrompt of aiSettings.predefinedPromptInstances) {

          const existing = this.predefinedPromptInstances.find(p => p.promptType === predefinedPrompt.promptType && p.promptId === predefinedPrompt.promptId);
          if (!existing) {
            this.predefinedPromptInstances.push(predefinedPrompt);
          }
        }
      }

      if(aiSettings.tabs) {

        if(overwriteTabs) {
          this.tabs = [];
        }
        // insert into tabs if not contains by id
        for(const tab of aiSettings.tabs) {
          if(!this.tabs.find(t => t.id === tab.id)) {
            this.tabs.push(tab);
          }
        }
      }

      if(aiSettings.currentDataPath) {
        this.currentDataPath = aiSettings.currentDataPath;
      }

      if(aiSettings.currentModelPath) {
        this.currentModelPath = aiSettings.currentModelPath;
      }

      if(aiSettings.defaultFileTemplate) {
        this.defaultFileTemplate = aiSettings.defaultFileTemplate;
      }

      if(aiSettings.fileTemplates) {
        if(overwritePrompts) {
          this.fileTemplates = [];
        }
        for(const template of aiSettings.fileTemplates) {
          this.fileTemplates.push(template);
        }
      }

      if(aiSettings.currentSpellCheckLanguage) {
        this.currentSpellCheckLanguage = aiSettings.currentSpellCheckLanguage;
      }

      /*if(aiSettings.analysisEnabled !== undefined) {
        this.analysisEnabled = aiSettings.analysisEnabled;
      }*/

      if(aiSettings.selectedAnalysisPrompts) {
        this.selectedAnalysisPrompts = [];
        for(const prompt of aiSettings.selectedAnalysisPrompts) {
          this.onUpdatePrompt(prompt);
          this.selectedAnalysisPrompts.push(prompt);
        }
      }

      if(aiSettings.labels) {
        if(overwritePrompts) {
          this.labels = [];
        }
        for(const label of aiSettings.labels) {
          if(!this.labels.find(l => l.label === label.label)) {
            this.labels.push(label);
          }
        }
      }

      if(aiSettings.statuses) {
        if(overwritePrompts) {
          this.statuses = [];
        }
        for(const status of aiSettings.statuses) {
          if(!this.statuses.find(s => s.label === status.label)) {
            this.statuses.push(status);
          }
        }
      }

      if(aiSettings.contextTypes) {
        if(overwritePrompts) {
          this.contextTypes = [];
        }
        for(const contextType of aiSettings.contextTypes) {
          this.contextTypes.push(contextType);
        }
      }

      if(aiSettings.promptContext) {
        if(overwritePrompts) {
          this.promptContext = [];
        }
        for(const contextName of aiSettings.promptContext) {
          this.promptContext.push(contextName);
        }
      }
    },
    removePredefinedPrompts(promptType) {
      const existing = this.predefinedPromptInstances.filter(p => p.promptType === promptType);
      for (const prompt of existing) {
        this.predefinedPromptInstances.splice(this.predefinedPromptInstances.indexOf(prompt), 1);
      }
    },
    addPredefinedPrompt(promptType, promptId) {
      const category = this.predefinedPrompts.find(p => p.promptType === promptType);
      if(!category) {
        return;
      }

      const existing = this.predefinedPromptInstances.find(p => p.promptType === promptType && p.promptId === promptId);
      if (existing) {
        return;
      }

      this.predefinedPromptInstances.push({
        promptType: promptType,
        promptId: promptId,
        promptHint: category.promptHint,
      });
    },
    addContextType(label, color) {
      if(this.contextTypes.find(c => c.label === label) === undefined) {
        this.contextTypes.push({
          label: label,
          color: color,
        });
      }
    },
    async undownloadModel(model) {
      if(model.type === 'client-ollama') {

        Dialog.create(
          {
            title: 'Delete from Ollama',
            message: 'Do you want to also remove the model from Ollama to free up computer space?',
            cancel: true,
            persistent: true
          }).onOk(async () => {
          await this.removeOllamaModel(model);
        }).onCancel(() => {
        }).onDismiss(() => {
          }
        )
      } else {
        model.downloaded = false;
      }
    },
    async removeOllamaModel(model) {
      model.downloading = true;

      const response = await removeOllamaModel(model.modelName, model.args.url);

      console.log(response);

      model.downloading = false;

      if(response.status === 'success') {
        model.downloaded = false;
      }
    },
    getCategories() {
      const prompts = this.prompts.map(p => p.category).filter((v) => v !== null && v !== undefined && v !== '');
      return [...new Set(prompts)];
    },
    setFileTemplate(file, templateName) {
      if(!this.fileTemplates) {
        this.fileTemplates = [];
      }

      const template = createFile(templateName);

      template.title = templateName;
      template.content = file.content;
      template.icon = file.icon;
      template.view = file.view;
      template.settings = JSON.parse(JSON.stringify(file.settings));

      this.fileTemplates.push(template);
    },
    removeFileTemplate(file) {
      // remove by id
      this.fileTemplates = this.fileTemplates.filter(f => f.id !== file.id);
    },
    addListItem(list, label, color, done) {
      list.push({
        label: label,
        color: color,
      });

      if(done) {
        done(label);
      }
    },
    removeListItem(list, item) {
      list.splice(list.indexOf(item), 1);
    },
    moveListItemUp(list, item) {
      const index = list.indexOf(item);
      if(index > 0) {
        list.splice(index - 1, 0, list.splice(index, 1)[0]);
      }
    },
    moveListItemDown(list, item) {
      const index = list.indexOf(item);
      if(index < list.length - 1) {
        list.splice(index + 1, 0, list.splice(index, 1)[0]);
      }
    },
    hasStickyPrompts(file) {
      return file.settings?.stickyPrompts !== undefined && file.settings.stickyPrompts.length > 0;
    },
    getStickyPrompts(file) {
      if(!file.settings?.stickyPrompts) {
        return [];
      }

      const enabledPrompts = this.prompts.filter(p => p.enabled);

      return enabledPrompts.filter(p => file.settings.stickyPrompts.includes(p.id));
    },
    getTabData(tab) {
      if(!tab) {
        return null;
      }

      if(this.tabData[tab.id] === undefined) {

        this.tabData[tab.id] = {
          promptResultsHistory: [],
          promptResultsIndex: 0,
          chats: [],
        }
      }

      return this.tabData[tab.id];
    },
    getCustomAdhocPrompt(promptType, systemPrompt, userPrompt) {
      return {
        "id": "[model]_Custom",
        "enabled": true,
        "title": "Custom",
        "description": "",
        "color": "",
        "modelId": "[model]",
        "overridePromptFormat": false,
        "promptFormat": "",
        "tabId": 1,
        "overrideSystemPrompt": true,
        "systemPrompt": systemPrompt,
        "userPrompt": userPrompt,
        "inline": true,
        "promptType": promptType,
        "hasParameters": false,
        "overridePromptTimes": "1",
        "parameters": [],
        "settings": {},
        "info": {
          "tags": [ "context" ]
        },
        "category": "Text",
        "overrideContexts": true,
        "excludedContextTypes": [
        ],
        "defaultContextTypes": null
      }
    },
    getPredefinedPromptId(promptType) {
      const retValue = [];

      for(const predefinedPrompt of this.predefinedPromptInstances) {
        if(predefinedPrompt.promptType === promptType) {
          retValue.push(predefinedPrompt.promptId);
        }
      }

      return retValue;
    },
    createCategory(label, color = '') {
      if(this.promptCategories.find(f => f.label === label) === undefined) {
        this.promptCategories.push({label: label, color: ''});
      }

      return this.promptCategories.find(f => f.label === label);
    },
    createFolder(label, color = '') {
      if(this.promptFolders.find(f => f.label === label) === undefined) {
        this.promptFolders.push({label: label, color: ''});
      }

      return this.promptFolders.find(f => f.label === label);
    },
    setCurrentOverridePromptParameters(params) {
      this.currentOverridePromptParameters = params;
    },
    setCurrentOverridePromptParameter(prompt, modelId, temperature, systemPrompt, userPrompt, textMessages) {
      if(!this.currentOverridePromptParameters || this.currentOverridePromptParameters.prompt !== prompt) {
        this.currentOverridePromptParameters = {
          prompt: prompt,
        }
      }
      if(modelId !== undefined) {
        this.currentOverridePromptParameters.modelId = modelId;
      }
      if(temperature !== undefined) {
        this.currentOverridePromptParameters.temperature = temperature;
      }

      if(systemPrompt !== undefined) {
        this.currentOverridePromptParameters.systemPrompt = systemPrompt;
      }

      if(userPrompt !== undefined) {
        this.currentOverridePromptParameters.userPrompt = userPrompt;
      }

      if(textMessages !== undefined) {
        this.currentOverridePromptParameters.textMessages = textMessages;
      }
    },
    onEnablePromptRuns(prompt) {
      if(prompt.enablePromptRuns === true) {
        if(!prompt.runs || prompt.runs.length === 0) {
          prompt.runs = [{
            name: 'Run 1',
            changeModel: false,
            changeTemperature: false,
            changeModelValue: prompt.modelId,
            changeTemperatureValue: 0.8,
            changePrompts: false,
          }];
        }
      }
    },
    addPromptRun(prompt) {
      this.onEnablePromptRuns(prompt);

      prompt.runs.push({
        name: 'Run ' + (prompt.runs.length + 1),
        changeModel: false,
        changeTemperature: false,
        changeModelValue: prompt.modelId,
        changeTemperatureValue: 0.8,
        changePrompts: false,
        systemPrompt: prompt.systemPrompt,
        userPrompt: '$output.Run 1'
      })
    },
    removePromptRun(prompt, run) {
      prompt.runs.splice(prompt.runs.indexOf(run), 1);
    },
    addHubModelPack(id) {
    },
    addHubPromptPack(id) {
    },
  }
});
