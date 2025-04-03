import {Dialog, Notify} from "quasar";
import {downloadOllamaModel} from "src/common/apiServices/ollamaApiService";
import {usePromptStore} from "stores/prompt-store";
import {useLocalDataStore} from "stores/localdata-store";

export function isTextLlm(modelType) {
  return modelType === "cloud" || modelType === "client-ollama" || modelType === "lmstudio";
}

export function getCloudModelApiKey(modelId, inferenceEngine) {
  const localDataStore = useLocalDataStore();

  if(!modelId || modelId.length === 0 || !inferenceEngine || inferenceEngine.length === 0) {
    return null;
  }

  if(inferenceEngine === 'openai') {
    const apiKey = localDataStore.getApiKey("OpenAI API Key");
    if(apiKey && apiKey.key && apiKey.key.length > 0) {
      return apiKey;
    }
  } else if(inferenceEngine === 'openRouter') {
    const apiKey = localDataStore.getApiKey("OpenRouter API Key");
    if(apiKey && apiKey.key && apiKey.key.length > 0) {
      return apiKey;
    }
  } else if(inferenceEngine === 'groq') {
    const apiKey = localDataStore.getApiKey("Groq API Key");
    if(apiKey && apiKey.key && apiKey.key.length > 0) {
      return apiKey;
    }
  } else if(inferenceEngine === 'anthropic') {
    const apiKey = localDataStore.getApiKey("Anthropic API Key");
    if(apiKey && apiKey.key && apiKey.key.length > 0) {
      return apiKey;
    }
  }

  return null;
}

export async function importModel(model, callback, skipDialog = false, forceModel = null, skipNotification = false) {

  const promptStore = usePromptStore();

  if(model.meta.metaType === 'prompts') {

    const availableModels = promptStore.models.map(m => {

      let label = m.name;

      if(model.meta.recommendedModels.includes(m.id)) {
        label += ' (recommended)';
      }

      return {
        label: label,
        value: m.id,
      }
    });

    const importAction = async (selectedModelId) => {
      let modelJson = JSON.stringify(model);

      modelJson = modelJson.replaceAll('[model]', selectedModelId);
      const modelCopy = JSON.parse(modelJson);

      promptStore.addHubPromptPack(model.id);

      await promptStore.applyJsonSettings(JSON.stringify(modelCopy), false, false, false, true);

      if(!skipNotification) {
        Notify.create({
          message: 'Imported ' + model.meta.name,
          group: 'import-model',
          icon: 'las la-check',
          color: 'positive',
          width: 300,
          position: 'top',
          timeout: 4000,
        });
      }

      callback(true);
    };

    if(skipDialog === true && forceModel) {
      await importAction(forceModel);
    } else {
      Dialog.create(
        {
          title: 'Import prompts',
          message: 'Select default AI model for these prompts',
          options: {
            type: 'radio',
            model: '',
            // inline: true
            items: availableModels
          },
          cancel: true,
          persistent: true
        }).onOk(async(selectedModelId) => {
          if(selectedModelId) {
            await importAction(selectedModelId);
          } else {
            Notify.create({
              message: 'No model selected',
              icon: 'las la-exclamation-triangle',
              color: 'negative',
              position: 'top',
              timeout: 4000,
            });
          }
      }).onCancel(() => {
        callback(false);
      }).onDismiss(() => {
        callback(false);
        }
      );
    }
  } else if(model.meta.metaType === 'model') {

    const importAction = async () => {
      for (const llmModel of model.models) {
        if(llmModel.type === 'client-ollama') {

          model.downloading = true;

          let response, ollama;

          try {
            [response, ollama] = await downloadOllamaModel(llmModel.modelName, llmModel.args.url, true);
          } catch(e) {

            Notify.create({
              message: 'Could not import model ' + llmModel.modelName,
              caption: 'Check if the model exists and is available to you',
              icon: 'las la-microchip',
              color: 'negative',
              position: 'top',
              timeout: 3000,
            });
            model.downloading = false;
            return;
          }

          const notif = Notify.create({
            message: 'Downloading model ' + llmModel.name,
            icon: 'las la-microchip',
            group: false,
            spinner: true,
            color: 'positive',
            position: 'top',
            caption: '0%',
            timeout: 0,
            actions: [
              { label: 'Cancel', color: 'white', handler: () => { ollama?.abort() } }
            ]
          });

          let imported = false;

          for await (const part of response) {

            let text = part.status;

            if(part.total && part.completed) {
              text = '' + Math.round(part.completed / part.total * 100) + '%  (' + text + ')';
            }

            notif({
              caption: text
            });

            if(part.status === 'success') {
              imported = true;
              break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            console.log(JSON.stringify(part));
          }

          model.downloading = false;

          //TODO get name from the model name
          //TODO replace notification

          if(!imported) {

            notif({
              icon: 'done',
              spinner: false,
              color: 'negative',
              message: 'Model download failed',
              timeout: 5000,
              actions: []
            });
            return;
          }

          notif({
            icon: 'done',
            spinner: false,
            message: 'Model downloaded',
            color: 'positive',
            timeout: 5000,
            actions: []
          });
        }
      }

      promptStore.addHubModelPack(model.id);

      await promptStore.applyJsonSettings(JSON.stringify(model), false, false, false, true);

      if(!skipNotification) {
        Notify.create({
          icon: 'las la-check',
          spinner: false,
          color: 'positive',
          message: 'Imported ' + model.meta.name,
          group: 'import-model',
          position: 'top',
          timeout: 5000
        });
      }

      callback(true);
    }

    if(skipDialog === true) {
      await importAction();
    } else {
      Dialog.create(
        {
          title: 'Confirm',
          message: 'Do you want to import ' + model.meta.name + '?',
          cancel: true,
          persistent: true
        }).onOk(async() => {
        await importAction();
      }).onCancel(() => {
        callback(false);
      }).onDismiss(() => {
        callback(false);
        }
      );
    }
  } else if(model.meta.metaType === 'pack') {

    if(skipDialog === true) {
      callback(true);
    } else {
      Dialog.create(
        {
          title: 'Confirm',
          message: 'Do you want to import ' + model.meta.name + '?',
          cancel: true,
          persistent: true
        }).onOk(async() => {
        callback(true);
      }).onCancel(() => {
        callback(false);
      }).onDismiss(() => {
          callback(false);
        }
      );
    }
  }
}
