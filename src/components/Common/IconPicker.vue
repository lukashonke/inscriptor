<template>
  <q-icon :name="modelValue?.length > 0 ? modelValue : defaultIcon" :size="size" :color="color" class="cursor-pointer">
    <q-menu style="height: 300px">
      <div class="row">
        <div class="col">
          <q-input filled dense :model-value="modelValue" @update:model-value="choose" clearable />
        </div>
      </div>
      <div class="row">
        <div class="col" v-for="colIndex in cols" :key="colIndex">
          <q-list style="min-width: 25px" dense>
            <q-item
              v-for="(icon, index) in allIcons.slice(itemsPerColumn * (colIndex - 1), itemsPerColumn * colIndex)"
              :key="index"
              :class="'bg-' + icon + '-' + shade"
              clickable
              @click="choose(icon)"
              class="items-center"
            >
              <q-icon :name="icon" size="22px"/>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-menu>
    <q-tooltip>
      Choose icon
    </q-tooltip>
  </q-icon>
</template>

<script setup>
  import {allIcons} from "assets/icons";

  const props = defineProps({
    modelValue: {
      type: String,
      required: false,
    },
    defaultIcon: {
      type: String,
      default: 'mdi-circle-outline',
    },
    size: {
      type: String,
      default: 'md',
    },
    color: {
      type: String,
      default: 'grey',
    },
    shade: {
      type: String,
      default: '3',
    },
  });


  const cols = 7;

  const icons = allIcons;


  const itemsPerColumn = Math.ceil(icons.length / cols);

  const emits = defineEmits(['update:modelValue']);

  function choose(icon) {
    emits('update:modelValue', icon);
  }

</script>

<style scoped>

</style>
