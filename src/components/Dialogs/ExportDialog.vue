<template>
  <q-dialog v-model="layoutStore.exportDialogOpen" >
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ layoutStore.exportDialogFile?.title }} Export</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-gutter-y-sm">
        <q-select :options="exportFormats" v-model="selectedFormat" label="Format" dense outlined emit-value/>
        <q-chip icon="info">Other formats and customization options will be added soon.</q-chip>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn icon="las la-download" label="Export" color="primary" @click="download" :loading="downloading"/>
      </q-card-actions>
    </q-card>

  </q-dialog>
</template>

<script setup>
  import {useLayoutStore} from "stores/layout-store";
  import {ref} from "vue";
  import {useCurrentUser} from "vuefire";
  import {useFileStore} from "stores/file-store";
  import {htmlTemplate} from "assets/exportTemplates/htmlTemplate";
  import {save} from "@tauri-apps/plugin-dialog";
  import {downloadFile} from "src/common/utils/browserUtils";
  import {writeTextFile} from "@tauri-apps/plugin-fs";

  const user = useCurrentUser();

  const layoutStore = useLayoutStore();
  const fileStore = useFileStore();

  const downloading = ref(false);

  const exportFormats = [
    {label: 'HTML', value: 'html'},
  ];

  const selectedFormat = ref('html');

  async function download() {
    const file = fileStore.selectedFile;
    if(!file) {
      return;
    }

    downloading.value = true;

    if(selectedFormat.value === 'html') {
      const html = await getHtml(file, htmlTemplate);

      if(layoutStore.runsInDesktopApp()) {
        const path = await save({
          filters: [{
            name: 'HTML',
            extensions: ['html']
          }],
        });

        await writeTextFile(path, html);
      } else {
        downloadFile(html, 'Inscriptor_Export.html', 'text/html');
      }
    }

    downloading.value = false;
  }

  async function getHtml(file, template) {
    let contentBuilder = '';

    function buildContent(file, level = 1) {
      contentBuilder += '<div class="container page mb-6">';

      contentBuilder += `<div><span class="title is-size-${level}">${file.title}</span></div>`;
      contentBuilder += `<div>${file.content}</div>`;

      contentBuilder += '</div>';

      for (const child of file.children) {
        buildContent(child, Math.min(level + 1, 5));
      }

      contentBuilder += '<div class="container mb-6"></div>';
    }

    buildContent(file);

    const html = template.replace('{{content}}', contentBuilder);

    return html;
  }

</script>

<style scoped>

</style>
