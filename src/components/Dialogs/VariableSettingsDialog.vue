<template>
  <q-dialog v-model="variableSettingsOpened" full-height>
    <q-card style="max-width: 90vw; width: 1600px">
      <q-card-section class="row">
        <span class="text-h6">Project Variables</span>
        <HelpIcon tooltip="You can reference parameters anywhere by writing their name, prefixed with $. Eg: $ParameterName." />
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section class="q-gutter-y-sm">
        <q-card v-for="(variable, index) in fileStore.variables" :key="index" bordered flat>

          <q-expansion-item
              :label="isStarred(variable) ? (variable.title) : variable.title"
              :icon="isStarred(variable) ? 'mdi-star-four-points-box' : undefined"
              :caption="variable.description ?? ''"
              flat
              switch-toggle-side
          >
            <q-card-section>
              <div  v-if="variable.title === 'WritingStyle'" class="q-pt-sm">
                <WritingStyleSelector
                  :initial-value="variable.value"
                  :title="null"
                  use-ai-input
                  :cols="4"
                  :sub-title="null"
                  @writing-style-changed="(styleData) => variable.value = styleData.value"
                />
              </div>
              <div v-else-if="variable.title === 'NarrativePOV'" class="q-pt-sm">
                <q-input
                  filled
                  dense
                  v-model="variable.value"
                  label="Narrative Point of View"
                  type="textarea"
                  placeholder="Write in 1st person perspective. | Write in 3rd person limited perspective. | Write in 2nd person perspective addressing the reader directly."
                  hint="Write the complete instruction sentence. Examples: 'Write in 1st person perspective.' or 'Write in 3rd person limited from Sarah's viewpoint.'"
                />
              </div>
              <div v-else-if="variable.title === 'NarrativeTense'" class="q-pt-sm">
                <q-input
                  filled
                  dense
                  v-model="variable.value"
                  label="Narrative Tense"
                  type="textarea"
                  placeholder="Use past tense consistently throughout. | Use present tense consistently throughout. | Alternate between past and present tense as needed."
                  hint="Write the complete instruction sentence. Examples: 'Use past tense consistently throughout.' or 'Use present tense for action scenes, past tense for reflection.'"
                />
              </div>
              <template v-else>
                <div class="row q-gutter-x-sm">
                  <div class="col-auto" v-if="!variable.undeletable">
                    <q-input filled dense v-model="variable.title" :readonly="(variable.undeletable === true)" label="Name" />
                  </div>
                  <div class="col">
                    <q-input filled dense v-model="variable.value" label="Value" type="textarea"/>
                  </div>
                  <div class="col-auto" v-if="!(variable.undeletable === true)">
                    <q-btn flat label="" color="red" icon="mdi-delete-outline" @click="fileStore.removeVariable(index)" />
                  </div>
                </div>
              </template>

            </q-card-section>
          </q-expansion-item>
        </q-card>

        <q-btn color="primary" label="Add variable" @click="fileStore.addVariable" icon="mdi-plus" class="q-mt-md" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {computed} from "vue";
  import {useFileStore} from "stores/file-store";
  import HelpIcon from "components/Common/HelpIcon.vue";
  import WritingStyleSelector from 'components/Common/WritingStyleSelector.vue';

  const layoutStore = useLayoutStore();
  const fileStore = useFileStore();

  const variableSettingsOpened = computed({
    get() {
      return layoutStore.variableSettingsOpen;
    },
    set(newValue) {
      layoutStore.setVariableSettingsOpen(newValue);
    }
  });

  function isStarred(variable) {
    return variable.title === 'WritingStyle' || variable.title === 'NarrativePOV' || variable.title === 'NarrativeTense';
  }
</script>


<style scoped>
</style>
