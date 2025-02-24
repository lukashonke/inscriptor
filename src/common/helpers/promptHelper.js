import {convertHtmlToText, replaceParameterEditorText, trimWhitespace} from "src/common/utils/textUtils";
import {usePromptStore} from "stores/prompt-store";
import {useFileStore} from "stores/file-store";
import {allPromptContexts, currentFilePromptContext, selectedTextPromptContext} from "src/common/resources/promptContexts";
import {useLayoutStore} from "stores/layout-store";
import {getEditor, isEmptySelection} from "src/common/utils/editorUtils";

export function applyPromptFormatPrefixSuffix(systemPrefix, systemSuffix, systemMessage, userPrefix, userSuffix, userPrompt, assistantPrefix, assistantSuffix) {
  let output = '';

  output = systemPrefix + replaceParameterEditorText(systemMessage) + systemSuffix + userPrefix + replaceParameterEditorText(userPrompt) + userSuffix + assistantPrefix;

  return output;
}

export function applyPromptChatFormat(systemPrefix, systemSuffix, userPrefix, userSuffix, assistantPrefix, assistantSuffix, messages) {
  let output = '';

  for (const message of messages) {
    if(message.type === 'system') {
      output += systemPrefix + replaceParameterEditorText(message.text) + systemSuffix;
    } else if(message.type === 'user') {
      output += userPrefix + replaceParameterEditorText(message.text) + userSuffix;
    } else if(message.type === 'assistant') {
      output += assistantPrefix + replaceParameterEditorText(message.text) + assistantSuffix;
    }
  }

  const retValue = trimLineBreaks(output + assistantPrefix).trim();

  return retValue;
}

export function exportPromptToJson(prompts) {
  let retPrompts = [];
  for (const prompt of prompts) {
    const promptCopy = JSON.parse(JSON.stringify(prompt));
    promptCopy.id = '[model]_' + promptCopy.title;
    promptCopy.modelId = '[model]';
    retPrompts.push(promptCopy);
  }

  const retJson = JSON.stringify(retPrompts, null, 2);
  return retJson;
}

export function trimLineBreaks(text) {
  return text.replace(/\n{3,}/g, '\n\n');
}

export async function executePromptClick(prompt, text, clear = true, appendMessages = null, forceBypassMoreParameters = false, appendContext = null, silent = false, forceShowContextSelection = false, promptSource = null) {
  const promptStore = usePromptStore();
  const layoutStore = useLayoutStore();

  if(prompt.tabId) {
    promptStore.setCurrentTabId(prompt.tabId);
  }

  // if ctrl is holding down
  const ctrlDown = layoutStore.ctrlDown;

  promptStore.promptInput = text;

  const model = promptStore.getModel(promptStore.getCurrentPromptModelId(prompt));

  const showMoreParametersWindow = !ctrlDown && ((forceShowContextSelection === true) || (!forceBypassMoreParameters && prompt.promptType !== 'selectionAnalysis' && (prompt.promptType !== 'chat' || (model.args?.targetLanguages && !prompt.targetLanguage))));

  if(showMoreParametersWindow) {

    const fileStore = useFileStore();
    const currentFile = fileStore.selectedFile;
    let fileContext = null;
    if(currentFile) {
      const contexts = fileStore.getTemporaryFileMetaProperty(currentFile, 'context-' + prompt.id);

      if(contexts) {
        fileContext = [...contexts];
      }
    }

    if(fileContext) {
      promptStore.promptContext = [...fileContext];
    } else {
      const editor = getEditor();

      if(prompt.overrideContexts === true) {
        promptStore.promptContext = [];

        for (const contextTypeId of prompt.defaultContextTypes ?? []) {
          const foundPromptContextType = allPromptContexts.find(c => c.id === contextTypeId);

          if(foundPromptContextType) {
            promptStore.promptContext.push(foundPromptContextType);
          }
        }

      } else if(editor) {
        if(isEmptySelection()) {
          if(currentFile.content && trimWhitespace(convertHtmlToText(currentFile.content)).length > 0) {
            promptStore.promptContext = [ currentFilePromptContext ];
          } else {
            promptStore.promptContext = [];
          }
        } else {
          promptStore.promptContext = [ selectedTextPromptContext ];
        }

      } else {
        promptStore.promptContext = [];
      }
    }

    if(prompt.overrideContexts === true) {
      if(prompt.excludedContextTypes) {
        promptStore.promptContext = promptStore.promptContext.filter(c => !prompt.excludedContextTypes.includes(c.id));
      }
    }

    promptStore.promptParametersShown = true;
    promptStore.currentPromptConfirmation = prompt;
    promptStore.currentPromptConfirmationSelectedText = text;

    promptStore.previousPromptParameterValue = [...promptStore.promptParametersValue];
    promptStore.promptParametersValue = [];
    for (const param of prompt.parameters) {
      const prevPrompt = promptStore.previousPromptParameterValue.find(p => p.prompt.id === prompt.id && p.name === param.name);

      promptStore.promptParametersValue.push({
        name: param.name,
        type: param.type,
        value: prevPrompt?.value ?? param.default,
        hint: param.hint,
        required: param.required,
        prefixWith: param.prefixWith,
        suffixWith: param.suffixWith,
        examples: param.examples,
        values: [...param.values],
        prompt: prompt,
      });
    }
  } else {
    if(prompt.promptType === "general" || prompt.promptType === "insert" || prompt.promptType === "selection" || prompt.promptType === "selectionAnalysis") {
      return await executePrompt(text, prompt, clear, appendMessages, false, null, appendContext, silent, promptSource);
    }  else if (prompt.promptType === "chat") {
      return await executeChatPrompt(text, prompt, clear, appendMessages, false, null, appendContext);
    }
  }
}

export async function executeConfirmPrompt(previewOnly = false, forceInput = null, appendContext = null) {
  const promptStore = usePromptStore();

  if(prompt.tabId) {
    promptStore.setCurrentTabId(prompt.tabId);
  }

  let clear = true;

  if(forceInput && forceInput.isRegenerating) {
    clear = false;
  }

  if(promptStore.currentPromptConfirmation.promptType === "general"
    || promptStore.currentPromptConfirmation.promptType === "insert"
    || promptStore.currentPromptConfirmation.promptType === "selection"
    || promptStore.currentPromptConfirmation.promptType === "selectionAnalysis") {
    return await executePrompt(promptStore.promptInput, promptStore.currentPromptConfirmation, clear, null, previewOnly, forceInput, appendContext);
  } else if (promptStore.currentPromptConfirmation.promptType === "chat") {
    return await executeChatPrompt(promptStore.promptInput, promptStore.currentPromptConfirmation, false, null, previewOnly, forceInput, appendContext);
  }

  return null;
}

async function executePrompt(text, prompt, clear = true, appendMessages = null, previewOnly = false, forceInput = null, appendContext = null, silent = false, promptSource = null) {
  const promptStore = usePromptStore();

  const model = promptStore.getModel(promptStore.getCurrentPromptModelId(prompt));

  const promptTimes = prompt.overridePromptTimes?.length > 0 ? parseInt(prompt.overridePromptTimes) : model.promptTimes;

  if(prompt.info?.tags?.includes("context") && promptStore.promptContext) {
    const fileStore = useFileStore();

    const currentFile = fileStore.selectedFile;

    if(currentFile) {
      fileStore.setTemporaryFileMetaProperty(currentFile, 'context-' + prompt.id, promptStore.promptContext);
    }
  }

  const context = [...promptStore.promptContext];

  if(appendContext) {
    for (const appendContextElement of appendContext) {
      if(!context.find(c => c.id === appendContextElement.id)) {
        context.push(appendContextElement);
      }
    }
  }

  return await promptStore.promptMultiple(prompt, text, promptStore.promptParametersValue, context, prompt.promptType, promptTimes, clear, appendMessages, null, previewOnly, forceInput, silent, promptSource);
}

async function executeChatPrompt(text, prompt, clear = true, appendMessages = null, previewOnly = false, forceInput = null, appendContext = null) {
  const promptStore = usePromptStore();

  const model = promptStore.getModel(promptStore.getCurrentPromptModelId(prompt));

  const promptTimes = prompt.overridePromptTimes?.length > 0 ? parseInt(prompt.overridePromptTimes) : model.promptTimes;

  const context = [...promptStore.promptContext];

  if(appendContext) {
    for (const appendContextElement of appendContext) {
      if(!context.find(c => c.id === appendContextElement.id)) {
        context.push(appendContextElement);
      }
    }
  }

  return await promptStore.promptMultiple(prompt, text, promptStore.promptParametersValue, context, prompt.promptType, promptTimes, clear, appendMessages, null, previewOnly, forceInput, appendContext);
}

export async function replyToPrompt(promptResult, message) {
  if(message.trim() === '') return;

  const promptStore = usePromptStore();

  const appendMessages = [];

  if(promptResult.appendMessages) {
    appendMessages.push(...promptResult.appendMessages);
  }
  appendMessages.push({type: 'assistant', text: convertHtmlToText(replaceParameterEditorText(promptResult.originalText))});
  appendMessages.push({type: 'user', text: message});

  promptStore.setCurrentOverridePromptParameters(promptResult.promptArgs.overridePromptParameters);

  await executePromptClick(promptResult.prompt, promptResult.input, false, appendMessages, true);
}
