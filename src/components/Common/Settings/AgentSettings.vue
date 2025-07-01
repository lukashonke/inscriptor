<template>
  <q-card flat>
    <q-card-section class="q-gutter-y-sm">
      <div class="bordered">
        <q-expansion-item label="Prompt Agents" caption="Define agents to iteratively improve the output of prompts.">
          <div class="q-pa-sm">
            <q-card flat>
              <q-card-section class="q-pb-none">
                <div class="text-body2 text-primary q-mb-sm">📝 How Prompt Agents Work</div>
                <div class="text-caption text-grey q-mb-xs">Prompt agents may execute after your main prompt to refine and improve its output automatically. You need to assign them to the prompts.</div>
                <div class="text-caption text-grey q-mb-xs"><strong>Example:</strong> Main prompt generates a paragraph of text → Refiner agent polishes the writing style → Critic agent checks for plot consistency</div>
                <div class="text-caption text-grey">Agents are executed sequentially from first to last in the order you define them.</div>
                <q-card flat class="q-mt-md bg-yellow-1">
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-primary"><strong>💡 Quick Reference</strong></div>
                    <div class="text-caption text-grey-8">
                      <div><strong>Refiner:</strong> "Polish this text to match my writing style"</div>
                      <div><strong>Critic:</strong> "Review this story and suggest improvements. Then, take this suggestion and actually improve the text"</div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-card-section>
              <q-card-section class="q-gutter-y-md" v-if="agents?.length > 0">
                <q-card v-for="(agent, index) in agents" :key="index">
                  <q-card-section>
                    <div class="row q-col-gutter-sm">
                      <div class="col flex items-center">
                        <q-input dense filled label="Agent Name" :model-value="agent.title" v-on:update:model-value="updatePromptAgent(agent, {title: $event})" class="full-width"/>
                      </div>
                      <div class="col">
                        <q-select dense filled label="Type" :model-value="agent.type" v-on:update:model-value="updatePromptAgent(agent, {type: $event})" :options="agentTypes" emit-value>
                          <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps" class="">
                              <q-item-section>
                                <q-item-label>{{ scope.opt.label }}</q-item-label>
                                <q-item-label caption v-if="scope.opt.description?.length > 0 ?? false">{{ scope.opt.description }}</q-item-label>
                              </q-item-section>
                            </q-item>
                          </template>
                        </q-select>
                      </div>
                      <div class="col-auto flex items-center">
                        <q-btn icon="mdi-arrow-up" flat dense @click="movePromptAgentUp(agent)" class="q-mr-xs" :disable="index === 0"/>
                        <q-btn icon="mdi-arrow-down" flat dense @click="movePromptAgentDown(agent)" class="q-mr-xs" :disable="index === agents.length - 1"/>
                        <q-btn icon="mdi-delete-outline q-ml-sm q-mr-sm" color="red" flat dense @click="deletePromptAgent(agent)" label="" class=""/>
                      </div>
                    </div>

                  </q-card-section>

                  <q-card-section v-if="agent.type === 'Refiner'" >

                    <div class="row">
                      <div class="col">
                        <CodeEditor :model-value="agent.prompt" v-on:update:model-value="updatePromptAgent(agent, {prompt: $event})" :parameters="[]" label="Prompt" />
                      </div>
                    </div>

                    <div class="row q-mt-sm q-col-gutter-x-lg">
                      <div class="col-auto flex items-center">
                        <q-input dense filled label="Stop & Ignore text" :model-value="agent.ignoreResultText ?? 'OK'" v-on:update:model-value="updatePromptAgent(agent, {ignoreResultText: $event})" />
                        <HelpIcon :tooltip="$t('tooltips.parameters.ignoreResultText')"></HelpIcon>
                      </div>
                      <div class="col" />
                      <div class="col-auto flex items-center">
                        <q-checkbox dense label="Allow multiple runs" :model-value="agent.allowMultipleRuns ?? false" v-on:update:model-value="updatePromptAgent(agent, {allowMultipleRuns: $event})" />
                        <q-input v-if="agent.allowMultipleRuns" dense filled label="Max runs" type="number" :model-value="agent.maxRuns ?? 1" v-on:update:model-value="updatePromptAgent(agent, {maxRuns: $event})" class="q-ml-sm" />
                        <HelpIcon :tooltip="$t('tooltips.parameters.agentMaxRuns')"></HelpIcon>
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-section v-if="agent.type === 'Critic'" >
                    <div class="row">
                      <div class="col">
                        <CodeEditor :model-value="agent.prompt" v-on:update:model-value="updatePromptAgent(agent, {prompt: $event})" :parameters="[]" label="Prompt" />
                      </div>
                    </div>

                    <div class="row q-mt-sm q-col-gutter-x-lg">
                      <div class="col-auto flex items-center">
                        <q-input dense filled label="Stop text" :model-value="agent.ignoreResultText ?? 'OK'" v-on:update:model-value="updatePromptAgent(agent, {ignoreResultText: $event})" />
                        <HelpIcon :tooltip="$t('tooltips.parameters.ignoreResultText')"></HelpIcon>
                      </div>
                      <div class="col" />
                      <div class="col-auto flex items-center">
                        <q-input dense filled label="Max iterations" type="number" :model-value="agent.maxRuns ?? 5" v-on:update:model-value="updatePromptAgent(agent, {maxRuns: $event})" class="q-ml-sm" />
                      </div>
                    </div>
                  </q-card-section>

                </q-card>
              </q-card-section>
              <q-card-actions class="q-mt-md">
                <q-btn label="Prompt Agent" outline icon="mdi-plus" flat dense @click="addPromptAgent()"/>
              </q-card-actions>
            </q-card>
          </div>
        </q-expansion-item>

        <q-expansion-item label="Project Agents" caption="Define agents that process paragraphs in your document to make improvements.">
          <div class="q-pa-md">
            <q-card flat>
              <q-card-section class="q-pb-none">
                <div class="text-body2 text-primary q-mb-sm">🤖 How Project Agents Work</div>
                <div class="text-caption text-grey q-mb-xs">Project agents work directly on your page content, processing individual paragraphs to make improvements. They ask for your permission before making changes.</div>
                <div class="text-caption text-grey q-mb-xs"><strong>Independent agents:</strong> Analyze the entire opened page and intelligently choose which paragraphs need improvement.</div>
                <div class="text-caption text-grey q-mb-sm"><strong>Non-independent agents:</strong> Process paragraphs marked with a search prefix (like "//TODO" or "//improve") or all paragraphs if no prefix is specified.</div>

                <q-card flat class="q-mt-md bg-yellow-1">
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-primary"><strong>🔄 Workflow Examples</strong></div>
                    <div class="text-caption text-grey-8">
                      <div class="q-mb-xs"><strong>Independent:</strong> Agent scans document → "I think paragraph 3 needs better flow" → asks permission → you approve/reject</div>
                      <div><strong>With prefix "//fix":</strong> Agent finds "//fix grammar here" → processes that paragraph → asks permission</div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-card-section>

              <q-card-section>
                <div v-for="agent in promptStore.projectAgents" :key="agent.id" class="q-mb-md">
                  <q-card>
                    <q-card-section>
                      <div class="row items-center q-gutter-x-sm">
                        <div class="col">
                          <q-input dense filled label="Agent Name" :model-value="agent.title" v-on:update:model-value="updateProjectAgent(agent, {title: $event})" />
                        </div>
                        <div class="col">
                          <q-select
                            dense
                            filled
                            label="Prompt"
                            :model-value="availablePrompts.find(p => p.value === agent.promptId)?.label ?? 'Unknown Prompt'"
                            v-on:update:model-value="updateProjectAgent(agent, {promptId: $event})"
                            :options="availablePrompts"
                            emit-value
                            options-dense
                            map-options
                          />
                        </div>
                        <div class="col-auto q-ml-sm">
                          <q-btn-group flat>
                            <q-btn flat dense icon="mdi-arrow-up" @click="moveProjectAgentUp(agent)" />
                            <q-btn flat dense icon="mdi-arrow-down" @click="moveProjectAgentDown(agent)" />
                            <q-btn flat dense icon="mdi-delete-outline" @click="deleteProjectAgent(agent)" color="red"/>
                          </q-btn-group>
                        </div>
                      </div>

                      <div class="row q-mt-sm q-col-gutter-x-lg">
                        <div class="col-auto flex items-center q-gutter-x-sm">
                          <div class="col-auto flex items-center">
                            <q-checkbox dense filled label="Independent Mode (AI chooses paragraphs)" :model-value="agent.isIndependent ?? false" v-on:update:model-value="updateProjectAgent(agent, {isIndependent: $event})" />
                            <HelpIcon :tooltip="$t('tooltips.parameters.isIndependent')"></HelpIcon>
                          </div>
                          <div class="col-auto flex items-center" v-if="!agent.isIndependent">
                            <q-input dense filled label="Search prefix (e.g. '//', 'TODO:')" :model-value="agent.searchPrefix ?? '//'" v-on:update:model-value="updateProjectAgent(agent, {searchPrefix: $event})" />
                            <HelpIcon :tooltip="$t('tooltips.parameters.searchPrefix')"></HelpIcon>
                          </div>
                          <div class="col-auto flex items-center" v-if="!agent.isIndependent">
                            <q-input dense filled label="Ignore Reply text" :model-value="agent.ignoreResultText ?? 'OK'" v-on:update:model-value="updateProjectAgent(agent, {ignoreResultText: $event})" />
                            <HelpIcon :tooltip="$t('tooltips.parameters.ignoreResultText')"></HelpIcon>
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </q-card-section>
              <q-card-actions class="q-mt-md">
                <q-btn label="Project Agent" outline icon="mdi-plus" flat dense @click="addProjectAgent()"/>
              </q-card-actions>
            </q-card>
          </div>
        </q-expansion-item>
      </div>
    </q-card-section>
  </q-card>

</template>

<script setup>

import {usePromptStore} from "stores/prompt-store";
import HelpIcon from 'components/Common/HelpIcon.vue';
import CodeEditor from 'components/Common/Editors/CodeEditor.vue';
import {computed} from 'vue';

const promptStore = usePromptStore();

const agents = computed(() => promptStore.promptAgents);

const agentTypes = [
  { label: "Refiner", value: "Refiner", description: "Continuously improves the prompt output by applying your instructions multiple times until satisfied. Perfect for polishing writing style, grammar, or content quality. Can run up to the max runs limit you set." },
  { label: "Critic", value: "Critic", description: "Acts as a critical reviewer that evaluates the output and provides specific feedback for improvements. Creates a conversation loop: evaluates → suggests changes → applies changes → evaluates again. Great for complex refinements." },
];

const availablePrompts = computed(() => {
  return promptStore.prompts.map(p => ({label: p.title + ' (' + p.modelId + ')', value: p.id}));
});

function addPromptAgent() {
  promptStore.addPromptAgent();
}

function deletePromptAgent(agent) {
  promptStore.deletePromptAgent(agent);
}

function movePromptAgentUp(agent) {
  promptStore.movePromptAgentUp(agent);
}

function movePromptAgentDown(agent) {
  promptStore.movePromptAgentDown(agent);
}

function updatePromptAgent(agent, args) {
  promptStore.updatePromptAgent(agent, args);
}

function addProjectAgent() {
  promptStore.addProjectAgent();
}

function deleteProjectAgent(agent) {
  promptStore.deleteProjectAgent(agent);
}

function moveProjectAgentUp(agent) {
  promptStore.moveProjectAgentUp(agent);
}

function moveProjectAgentDown(agent) {
  promptStore.moveProjectAgentDown(agent);
}

function updateProjectAgent(agent, args) {
  promptStore.updateProjectAgent(agent, args);
}


</script>

<style scoped>

</style>


