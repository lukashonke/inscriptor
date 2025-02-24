<template>
  <div style="height: 40px; width: 20px;" :class="'bg-' + modelValue + '-' + shade" class="cursor-pointer rounded-borders bordered">
    <q-menu>
      <div class="row">
        <div class="col">
          <q-list style="min-width: 100px" dense>
            <q-item v-for="(color, index) in colors.slice(0, itemsPerColumn)" :key="index" :class="'bg-' + color + '-' + shade" clickable @click="choose(color)">
            </q-item>
          </q-list>
        </div>
        <div class="col">
          <q-list style="min-width: 100px" dense>
            <q-item v-for="(color, index) in colors.slice(itemsPerColumn, itemsPerColumn * 2)" :key="index" :class="'bg-' + color + '-' + shade" clickable @click="choose(color)">
            </q-item>
          </q-list>
        </div>
        <div class="col">
          <q-list style="min-width: 100px" dense>
            <q-item v-for="(color, index) in colors.slice(itemsPerColumn * 2, itemsPerColumn * 3)" :key="index" :class="'bg-' + color + '-' + shade" clickable @click="choose(color)">
            </q-item>
          </q-list>
        </div>
      </div>

    </q-menu>
    <q-tooltip>
      Choose color
    </q-tooltip>
  </div>
</template>

<script setup>
  const props = defineProps({
    modelValue: {
      type: String,
      required: true,
    },
    shade: {
      type: String,
      default: '3',
    },
  });

  //const colors = [ 'red-' + shade, 'pink-' + shade, 'purple-' + shade, 'deep-purple-' + shade, 'indigo-' + shade, 'blue-' + shade, 'light-blue-' + shade, 'cyan-' + shade, 'teal-' + shade, 'green-' + shade, 'light-green-' + shade, 'lime-' + shade, 'yellow-' + shade, 'amber-' + shade, 'orange-' + shade, 'deep-orange-' + shade, 'brown-' + shade, 'grey-' + shade, 'blue-grey-' + shade];
  const colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown', 'blue-grey'];
  const itemsPerColumn = Math.ceil(colors.length / 3);

  const emits = defineEmits(['update:modelValue']);

  function choose(color) {
    emits('update:modelValue', color);
  }

</script>

<style scoped>

</style>
