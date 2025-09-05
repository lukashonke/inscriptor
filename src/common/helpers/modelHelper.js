export function isImageGenerationModel(model) {
  return model?.type === 'client-dall-e' ?? false;
}

export function hasTemperature(model) {
  if(!model) return false;

  if (model.modelName.includes('gpt-5')) {
    return false;
  }

  if (["o1", "o3", "o3-mini", "o4-mini", ].includes(model.modelName)) {
    return false;
  }

  return true;
}

export function hasTopP(model) {
  if(!model) return false;

  if (model.modelName.includes('gpt-5')) {
    return false;
  }

  if (["o1", "o3", "o3-mini", "o4-mini", ].includes(model.modelName)) {
    return false;
  }

  return true;
}
