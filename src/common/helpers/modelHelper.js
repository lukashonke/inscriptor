export function isImageGenerationModel(model) {
  return model?.type === 'client-dall-e' ?? false;
}

export function hasTemperature(model) {
  if(!model) return false;

  if (["o1", "o3", "o3-mini", "o4-mini", "gpt-5", "gpt-5-mini", "gpt-5-nano" ].includes(model.modelName)) {
    return false;
  }

  return true;
}

export function hasTopP(model) {
  if(!model) return false;

  if (["o1", "o3", "o3-mini", "o4-mini", "gpt-5", "gpt-5-mini", "gpt-5-nano" ].includes(model.modelName)) {
    return false;
  }

  return true;
}

export function supportsReasoning(model) {
  if(!model) return false;

  if (["o1", "o3", "o3-mini", "o4-mini", "gpt-5", "gpt-5-mini", "gpt-5-nano" ].includes(model.modelName)) {
    return true;
  }

  return false;
}

export const reasoningEffortValues = [ "minimal", "low", "medium", "high" ];

export const reasoningEffortValuesLabeled = [
  {
    label: "Minimal",
    value: "minimal"
  },
  {
    label: "Low",
    value: "low"
  },
  {
    label: "Medium",
    value: "medium"
  } ,
  {
    label: "High",
    value: "high"
  }
  ];
