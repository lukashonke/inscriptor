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
        <q-card v-for="(variable, index) in fileStore.variables" :key="index" >

          <q-expansion-item
              :label="isStarred(variable) ? (variable.title) : variable.title"
              :icon="isStarred(variable) ? 'mdi-star-four-points-box' : undefined"
              :caption="variable.description ?? ''"
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
    return variable.title === 'WritingStyle';
  }
</script>


<style scoped>
</style>
