<template>
  <q-list dense class="">
    <q-item v-for="(listItem, index) in list" :key="index">
      <q-item-section no-wrap avatar>
        <div class="row">
          <div class="col-auto">
            <ColorPicker v-model="listItem.color" />
          </div>
          <div class="col-auto flex items-center bordered q-ml-xs">
            <IconPicker v-model="listItem.icon" :color="listItem.color" default-icon="mdi-circle-outline"/>
          </div>
        </div>


      </q-item-section>
      <q-item-section>
        <div class="row">
          <div class="col">
            <q-input v-model="listItem.label" label="name" filled dense/>
          </div>
          <div class="col q-ml-sm" v-if="includeDescription">
            <q-input v-model="listItem.description" label="description" filled dense/>
          </div>
          <div class="col-auto">
            <q-btn icon="mdi-delete-outline" flat color="red" @click="promptStore.removeListItem(list, listItem)" />
          </div>
          <div class="col-auto">
            <q-btn icon="mdi-arrow-up-thin" dense flat color="primary" @click="promptStore.moveListItemUp(list, listItem)" />
          </div>
          <div class="col-auto">
            <q-btn icon="mdi-arrow-down-thin" dense flat color="primary" @click="promptStore.moveListItemDown(list, listItem)" />
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
  <q-btn color="primary" icon="mdi-plus" label="Add" @click="promptStore.addListItem(list, newItemName, 'blue')" class="q-mx-md q-mt-md q-mb-md"/>
</template>

<script setup>
import ColorPicker from "components/Common/ColorPicker.vue";
import {usePromptStore} from "stores/prompt-store";
import IconPicker from "components/Common/IconPicker.vue";

const promptStore = usePromptStore();

const props = defineProps({
  list: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    required: false,
  },
  newItemName: {
    type: String,
    default: 'Context',
  },
  shade: {
    type: String,
    default: '3',
  },
  includeDescription: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>

</style>
