<template>

  <div class="row q-gutter-x-md q-mt-md">
    <div class="col flex justify-end">
      <div class="row">
        <div class="col-auto" v-for="variable in uiData?.variables ?? []" :key="variable.title">
          <q-input dense filled square  v-model="variable.value" :label="variable.title" :placeholder="variable.defaultValue" />
        </div>
      </div>
    </div>
    <div class="col q-gutter-x-sm flex justify-center">
      <q-btn @click="generate(false)" icon="mdi-creation-outline" color="accent" label="Generate more" :loading="isGenerating"  >
        <template v-slot:loading>
          <q-spinner-dots />
        </template>
      </q-btn>
    </div>
    <div class="col flex justify-start">
      <q-btn @click="expandLikedIdeas()" icon="mdi-creation-outline" color="primary" label="Expand Liked" :disable="isGenerating" v-if="uiData?.likedIdeas.length > 0" />
      <q-btn @click="removeDislikedIdeas()" color="negative" flat  icon="mdi-delete" label="Remove Disliked" :disable="isGenerating" class="q-ml-xl" no-caps v-if="uiData?.dislikedIdeas.length > 0" />
    </div>
  </div>

  <div class="q-pa-md">
    <div class="row">
      <div v-for="(idea, i) in uiData?.ideas ?? []" :key="i" class="col-auto q-ma-sm" tabindex="0" style="max-width: 450px;">
        <transition appear enter-active-class="animated bounceInUp slower" leave-active-class="animated fadeOut">
          <q-card bordered flat class="q-ma-xs hoverable-card no-p-margin idea-card" :class="getCardClass(idea)">
            <q-card-section class="q-px-md q-py-sm justify-end flex">
              <q-btn icon="mdi-pin-outline" :color="idea.pinned ? 'accent' : 'grey-6'" size="10px" @click="pinIdea(idea)" flat dense class="hoverable-btn"/>
              <q-btn icon="mdi-thumb-up-outline" :color="idea.liked ? 'accent' : 'grey-6'" size="10px" @click="setIdeaLiked(idea, !idea.liked)" flat dense class="hoverable-btn"/>
              <q-btn icon="mdi-thumb-down-outline" :color="idea.disliked ? 'red' : 'grey-6'" size="10px" @click="setIdeaDisliked(idea, !idea.disliked)" flat dense class="hoverable-btn"/>
            </q-card-section>

            <q-card-section class="q-px-md q-py-none">
              <div v-html="markdownToHtml(idea.text ?? '')" class="text-subtitle2" />
            </q-card-section>

            <q-card-section v-if="idea.description" class="q-px-md q-py-none">
              <div class="q-mt-sm">
                <div class="text-subtitle2 text-grey-7">
                  Details:
                  <q-btn @click="idea.description = ''" icon="mdi-delete-outline" size="10px" color="grey-7" flat dense no-caps class="float-right hoverable-btn"/>
                </div>
                <div v-html="markdownToHtml(idea.description ?? '')" />
                <div v-html="markdownToHtml(idea.descriptionAppend ?? '')" />
              </div>
            </q-card-section>

            <q-card-section v-if="idea.children?.length > 0" class="q-px-md q-py-none" >
              <div class="q-mt-sm">
                <div class="q-mt-sm text-subtitle2 text-grey-7">
                  Related ideas:
                </div>
                <div v-for="(subIdea, i) in idea.children" :key="i" class="row">
                  <div class="col">
                    <div v-html="markdownToHtml(subIdea.text ?? '')" />
                  </div>
                  <div class="col-auto flex items-center">
                    <q-btn @click="separateSubIdea(subIdea, idea)" icon="mdi-open-in-new" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn"/>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-section class="q-px-md q-py-none" v-if="idea.reply?.length > 0" >
              <div class="q-mt-sm">
                <div class="bordered bg-yellow-1 q-pa-sm q-my-sm">
                  <div class="text-subtitle2 text-grey-7">
                    AI Reply:
                    <q-btn @click="idea.reply = ''" icon="mdi-delete-outline" size="10px" color="grey-7" flat dense no-caps class="float-right hoverable-btn"/>
                  </div>
                  <div v-html="markdownToHtml('\'' + (idea.reply ?? '') + '\'')" class="text-italic" />
                </div>
              </div>
            </q-card-section>

            <q-card-actions class="justify-between q-px-md q-pt-sm q-pb-sm">
              <q-btn @click="idea.replyEnabled = !idea.replyEnabled" icon="las la-reply" label="Reply" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn"/>

              <q-btn-dropdown split @click="expandIdea(idea)" icon="mdi-creation-outline" label="Expand" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn">
                <q-list>
                  <q-item clickable dense v-close-popup @click="generateSubIdeas(idea)" :disable="idea.generating">
                    <q-item-section side>
                      <q-icon name="mdi-creation-outline" />
                    </q-item-section>
                    <q-item-section>
                      Generate related ideas
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>

              <q-btn @click="generateSimilarIdeas(idea)" icon="mdi-creation-outline" label="Similar ideas" size="12px" :disable="idea.generating" color="grey-7" flat dense no-caps class="hoverable-btn"/>
            </q-card-actions>

            <q-card-actions v-if="idea.replyEnabled">
              <div class="row full-width">
                <div class="col flex items-center">
                  <q-input v-model="idea.replyMessage" label="Ask about this idea..." dense filled square class="full-width" autofocus/>
                </div>
                <div class="col-auto flex items-center q-ml-sm">
                  <q-btn @click="replyToIdea(idea, idea.replyMessage)" icon="mdi-send-outline" size="12px" :loading="idea.generating" color="grey-7" flat dense no-caps/>
                </div>
              </div>
            </q-card-actions>

            <q-inner-loading :showing="idea.generating">
              <q-spinner size="50px" color="primary" />
            </q-inner-loading>
          </q-card>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, defineExpose, computed} from 'vue';
import {cloneRequest, executePromptClick2} from 'src/common/helpers/promptHelper';
import {convertHtmlToText, markdownToHtml} from 'src/common/utils/textUtils';

const props = defineProps({
  promptResult: {
    type: Object,
    required: true,
  }
});

const isGenerating = ref(false);

const request = computed(() => props.promptResult.request);
const prompt = computed(() => props.promptResult.prompt);
const uiData = computed({
  get: () => props.promptResult.uiData,
  // eslint-disable-next-line vue/no-mutating-props
  set: (value) => props.promptResult.uiData = value
});

async function generate(replace = true) {
  initialiseUiData();

  try {
    isGenerating.value = true;

    const newRequest = cloneRequest(request.value);

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, uiData.value.ideas);

    const onOutput = (fullText, newText, isFinished, isError) => {
      processOutput(fullText, uiData.value.pendingNewIdeas);
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (replace) {
      uiData.value.ideas = [];
    }

    for (const idea of uiData.value.pendingNewIdeas) {
      if (!uiData.value.ideas.some(existing => existing.text === idea.text)) {
        uiData.value.ideas.push(idea);
      }
    }
  } finally {
    isGenerating.value = false;
  }
}

async function expandLikedIdeas() {
  initialiseUiData();

  // Get all liked ideas
  const likedIdeas = uiData.value.ideas.filter(idea => idea.liked);

  // Generate sub-ideas for each liked idea
  for (const idea of likedIdeas) {
    // EXPAND
    await expandIdea(idea);

    // GENERATE SUB-IDEAS
    await generateSubIdeas(idea, true);
  }
}

async function removeDislikedIdeas() {
  initialiseUiData();

  // Add a visual fade-out effect before removal
  const animateRemoval = () => {
    // Find all disliked ideas
    const dislikedIdeas = uiData.value.ideas.filter(idea => idea.disliked);

    // Add a temporary class for animation
    for (const idea of dislikedIdeas) {
      idea.removing = true;
    }

    // After animation completes, remove the ideas
    setTimeout(() => {
      uiData.value.ideas = uiData.value.ideas.filter(idea => !idea.disliked);
    }, 500); // 500ms animation duration
  };

  // Execute the animated removal
  animateRemoval();
}

async function generateSubIdeas(idea, replace = false) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;

    const newRequest = cloneRequest(request.value);

    const ideasString = generateExistingIdeasString(uiData.value.ideas);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideasString)});
    let expandMessage = prompt.value.settings.brainstorm_subIdeasMessage ?? 'Generate sub-ideas similar: $Idea';
    expandMessage = expandMessage.replaceAll('$Idea', idea.text);

    appendMessages.push({type: 'user', text: expandMessage});

    newRequest.appendMessages = appendMessages;

    if(idea.children === undefined) {
      idea.children = [];
    }

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, idea.children);

    idea.tempChildren = [];

    const onOutput = (fullText, newText, isFinished, isError) => {
      processOutput(fullText, idea.tempChildren);
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (replace) {
      idea.children = [];
    }

    for (const child of idea.tempChildren) {
      if (!idea.children.some(existing => existing.text === child.text)) {
        idea.children.push(child);
      }
    }
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

async function expandIdea(idea) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;

    const newRequest = cloneRequest(request.value);

    const ideasString = generateExistingIdeasString(uiData.value.ideas);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideasString)});

    let expandMessage = prompt.value.settings.brainstorm_expandPromptMessage ?? 'Expand this idea: $Idea';
    expandMessage = expandMessage.replaceAll('$Idea', idea.text + (idea.description ? '\n' + idea.description : ''));

    appendMessages.push({type: 'user', text: expandMessage});

    newRequest.appendMessages = appendMessages;

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, []);

    idea.descriptionAppend = '';

    const onOutput = (fullText, newText, isFinished, isError) => {
      idea.descriptionAppend = fullText;
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (idea.description) {
      idea.description = idea.description + "\n\n" + idea.descriptionAppend;
    } else {
      idea.description = idea.descriptionAppend;
    }

    idea.descriptionAppend = '';
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

async function replyToIdea(idea, message) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;
    idea.replyMessage = '';
    idea.replyEnabled = false;

    const newRequest = cloneRequest(request.value);

    const ideaString = idea.text + '\n\n' + (idea.description || '') + '\n\n' + (idea.reply || '');

    let replyMessage = prompt.value.settings.brainstorm_replyMessage ?? '$Message';
    replyMessage = replyMessage.replaceAll('$Message', message);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideaString)});
    appendMessages.push({type: 'user', text: replyMessage});

    newRequest.appendMessages = appendMessages;

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, []);

    const onOutput = (fullText, newText, isFinished, isError) => {
      idea.reply = fullText;
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

async function generateSimilarIdeas(idea, replace = false) {
  initialiseUiData();

  try {
    isGenerating.value = true;
    idea.generating = true;

    const newRequest = cloneRequest(request.value);

    const ideasString = generateExistingIdeasString(uiData.value.ideas, true);

    const appendMessages = [];
    appendMessages.push({type: 'assistant', text: convertHtmlToText(ideasString)});

    let expandMessage = prompt.value.settings.brainstorm_similarIdeasMessage ?? 'Create ideas similar to this idea:\n$Idea';
    expandMessage = expandMessage.replaceAll('$Idea', idea.text);

    appendMessages.push({type: 'user', text: expandMessage});

    newRequest.appendMessages = appendMessages;

    if(idea.children === undefined) {
      idea.children = [];
    }

    prepareRequest(newRequest);
    if(!uiData.value.variables) {
      initialiseVariables(newRequest);
    }
    replaceVariables(newRequest, idea.children);

    idea.tempChildren = [];

    const onOutput = (fullText, newText, isFinished, isError) => {
      processOutput(fullText, uiData.value.pendingNewIdeas);
    };

    newRequest.onOutput = onOutput;

    await executePromptClick2(newRequest);

    if (replace) {
      uiData.value.ideas = [];
    }

    for (const idea of uiData.value.pendingNewIdeas) {
      if (!uiData.value.ideas.some(existing => existing.text === idea.text)) {
        uiData.value.ideas.push(idea);
      }
    }
  } finally {
    isGenerating.value = false;
    idea.generating = false;
  }
}

function separateSubIdea(subIdea, parentIdea) {
  initialiseUiData();

  const newIdea = {
    text: subIdea.text,
    liked: false,
    disliked: false,
    children: []
  };

  uiData.value.ideas.push(newIdea);

  // If this is a sub-idea, remove it from the parent's children array
  if (parentIdea && parentIdea.children) {
    const index = parentIdea.children.findIndex(idea => idea.text === subIdea.text);
    if (index !== -1) {
      parentIdea.children.splice(index, 1);
    }
  }
}

function processOutput(text, outputCollection) {
  let items = text.split(request.value.prompt.resultsSeparator ?? '<split/>').map(item => ({ text: item })).filter(item => item.text.trim() !== '');

  items = items.map(item => {
    return item;
  });

  outputCollection.splice(0, outputCollection.length);

  for (const item of items) {
    if (!outputCollection.some(existing => existing.text === item.text)) {
      outputCollection.push(item);
    }
  }

  return outputCollection;
}

async function onShow(payload) {
  if(!uiData.value) {
    initialiseUiData();

    await generate();
  }
}

function initialiseUiData() {
  if(!uiData.value) {
    uiData.value = {
      ideas: [],
      pendingNewIdeas: [],

      dislikedIdeas: [],
      likedIdeas: [],
    };
  }
}

function prepareRequest(request) {
  request.silent = true;
  request.forceBypassMoreParameters = true;
  request.previewOnly = false;
  request.clear = false;
  request.executeCustomPromptUi = true;

  request.systemPrompt = request.prompt.systemPrompt;
  request.userPrompt = request.prompt.userPrompt;
}

function replaceVariables(request, existingIdeas) {
  const existingIdeasString = generateExistingIdeasString(existingIdeas);

  request.systemPrompt = request.systemPrompt.replaceAll('$ExistingIdeas', existingIdeasString)
  request.userPrompt = request.userPrompt.replaceAll('$ExistingIdeas', existingIdeasString)

  for (const variable of uiData.value.variables) {
    if(variable.isFromPromptParameter) {
      const parameterValue = request.parametersValue.find(p => p.name === variable.title);
      if(parameterValue) {
        parameterValue.value = variable.value;
      }
    } else {
      request.systemPrompt = request.systemPrompt.replaceAll(variable.fullName, variable.value);
      request.userPrompt = request.userPrompt.replaceAll(variable.fullName, variable.value);
    }
  }
}

function initialiseVariables(request) {
  const vars = [];

  const systemPromptVars = extractUIVariables(request.systemPrompt);
  const userPromptVars = extractUIVariables(request.userPrompt);

  const allVars = [...systemPromptVars];
  for (const userVar of userPromptVars) {
    if (!allVars.some(v => v.title === userVar.title)) {
      allVars.push(userVar);
    }
  }

  // Add all found variables to the vars array
  vars.push(...allVars);

  // Helper function to extract UI variables from text
  function extractUIVariables(text) {
    if (!text) return [];

    const regex = /\$UI_([a-zA-Z0-9_]+)(?:\(([^)]*)\))?/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        title: match[1],
        defaultValue: match[2] || '',
        value: match[2] || '',
        fullName: match[0]
      });
    }

    return matches;
  }

  for (const promptParameter of request.parametersValue) {
    vars.push({
      title: promptParameter.name,
      defaultValue: promptParameter.value,
      value: promptParameter.value,
      fullName: promptParameter.name,
      isFromPromptParameter: true,
      hint: promptParameter.hint
    });
  }

  uiData.value.variables = vars;
}

function generateExistingIdeasString(collection, includeDetails = false) {
  // Split ideas into three categories
  const likedIdeas = collection.filter(idea => idea.liked);
  const dislikedIdeas = collection.filter(idea => idea.disliked);
  const neutralIdeas = collection.filter(idea => !idea.liked && !idea.disliked);

  // Build the string with sections
  let ideasString = '';

  if (likedIdeas.length > 0) {
    ideasString += "IDEAS SPECIFICALLY LIKED BY USER:\n" + likedIdeas.map(idea => {
      let text = idea.text;
      if (includeDetails && idea.description) {
        text += "\nDetails: " + idea.description;
      }
      return text;
    }).join('\n') + '\n\n';
  }

  if (dislikedIdeas.length > 0) {
    ideasString += "IDEAS SPECIFICALLY DISLIKED BY USER:\n" + dislikedIdeas.map(idea => {
      let text = idea.text;
      if (includeDetails && idea.description) {
        text += "\nDetails: " + idea.description;
      }
      return text;
    }).join('\n') + '\n\n';
  }

  if (neutralIdeas.length > 0) {
    ideasString += "IDEAS:\n" + neutralIdeas.map(idea => {
      let text = idea.text;
      if (includeDetails && idea.description) {
        text += "\nDetails: " + idea.description;
      }
      return text;
    }).join('\n') + '\n\n';
  }

  return ideasString.trim();
}

function setIdeaLiked(idea, likedState) {
  if(idea.disliked) {
    setIdeaDisliked(idea, false);
  }

  if(!likedState) {
    const index = uiData.value.likedIdeas.findIndex(i => i === idea);
    if (index !== -1) {
      uiData.value.likedIdeas.splice(index, 1);
    }
  } else {
    if (!uiData.value.likedIdeas.includes(idea)) {
      uiData.value.likedIdeas.push(idea);
    }
  }
  idea.liked = likedState;

  updatePromptResultText();
}
function updatePromptResultText() {
  const likedIdeas = uiData.value.ideas.filter(idea => idea.liked);
  // eslint-disable-next-line vue/no-mutating-props
  props.promptResult.originalText = likedIdeas.map(idea => {
    let text = idea.text;
    if (idea.description) {
      text += '\n\nDetails: ' + idea.description;
    }
    return text;
  }).join('\n\n\n');
  // eslint-disable-next-line vue/no-mutating-props
  props.promptResult.text = props.promptResult.originalText;
}

function setIdeaDisliked(idea, dislikedState) {
  if(idea.liked) {
    setIdeaLiked(idea, false);
  }

  if(!dislikedState) {
    const index = uiData.value.dislikedIdeas.findIndex(i => i === idea);
    if (index !== -1) {
      uiData.value.dislikedIdeas.splice(index, 1);
    }
  } else {
    if (!uiData.value.dislikedIdeas.includes(idea)) {
      uiData.value.dislikedIdeas.push(idea);
    }
  }
  idea.disliked = dislikedState;

  updatePromptResultText();
}

function pinIdea(idea) {
  idea.pinned = !idea.pinned;

  updatePromptResultText();
}

function removeIdea(collection, idea) {
  const index = collection.findIndex(i => i === idea);
  if (index !== -1) {
    collection.splice(index, 1);
  }
}

function getCardClass(idea) {
  return {
    'liked-card': idea.liked,
    'disliked-card': idea.disliked,
    'card': true,
    'removing-card': idea.removing
  };
}

function trimLines(text) {
  return text.split('\n').map(line => line.trim()).join('\n');
}

defineExpose({
  onShow
});
</script>

<style scoped>

  .card {
    transition: transform 0.5s ease;
  }

  .liked-card {
    transform: scale(1.01);
    background-color: #f3f4ff;
  }

  .disliked-card {
    transform: scale(0.95);
    opacity: 0.5;
  }

  .removing-card {
    opacity: 0;
    transform: scale(0.55);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  /* Hide hoverable buttons by default */
  .hoverable-btn {
    opacity: 0;
    transition: all 0.3s ease;
  }

  /* Show hoverable buttons on hover */
  .hoverable-card:hover .hoverable-btn {
    opacity: 1;
  }

</style>
