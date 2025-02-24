<template>
  <router-view />
</template>

<script setup>

import {onMounted} from "vue";
import {useFileStore} from "stores/file-store";

const fileStore = useFileStore();

onMounted(async () => {
});
</script>
