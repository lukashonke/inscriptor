import ollamaTemplate from 'assets/models/local/ollama_template.json'
import lmstudioTemplate from 'assets/models/local/lmstudio_template.json'
import openrouterTemplate from 'assets/models/local/openrouter_template.json'

import blank from 'assets/projectTemplates/blank.json'
import story from 'assets/projectTemplates/story.json'
import nonfiction from 'assets/projectTemplates/nonfiction.json'


export function createOllamaModel(modelName, ollamaModelName) {
  let modelJson = JSON.stringify(ollamaTemplate)

  modelJson = modelJson.replaceAll('[model]', modelName);
  const modelCopy = JSON.parse(modelJson);

  const model = modelCopy.models[0];

  //model.id = model.id;
  model.modelName = ollamaModelName;
  model.name = modelName;

  return modelCopy;
}

export function createOpenRouterModel(data) {
  let modelJson = JSON.stringify(openrouterTemplate)

  modelJson = modelJson.replaceAll('[model]', data.id);

  const modelCopy = JSON.parse(modelJson);

  const model = modelCopy.models[0];

  model.modelName = data.id;
  model.name = data.name;
  model.contextSize = data.context_length;
  model.description = data.description;

  return modelCopy;
}

export function createLmStudioModel(modelName, lmstudioModelName) {
  let modelJson = JSON.stringify(lmstudioTemplate)

  modelJson = modelJson.replaceAll('[model]', modelName);
  const modelCopy = JSON.parse(modelJson);

  const model = modelCopy.models[0];

  //model.id = model.id;
  model.modelName = lmstudioModelName;
  model.name = modelName;

  return modelCopy;
}

export function getProjectTemplate(id) {
    if(id === 'blank') {
      return JSON.parse(JSON.stringify(blank));
    }

    if(id === 'story') {
      return JSON.parse(JSON.stringify(story));
    }

  if(id === 'nonfiction') {
    return JSON.parse(JSON.stringify(nonfiction));
  }

    return null;
}
