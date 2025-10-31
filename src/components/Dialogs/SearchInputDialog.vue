<template>
  <q-dialog v-model="layoutStore.searchOpen" position="top" @keydown="handleKeyDown">
    <q-card style="width: 800px; max-width: 70vw;">
      <q-input v-model="searchQuery" label="Search..." filled style="min-width: 300px;" dense ref="searchRef" autofocus :debounce="500" clearable hint="Use arrow keys to navigate, Enter to open (Ctrl+K to toggle)">
        <template v-slot:prepend>
          <q-icon name="mdi-magnify" size="xs" />
        </template>
      </q-input>

      <q-card-section v-if="noResults">
        <span class="text-caption">No results found</span>
      </q-card-section>

      <q-card-section v-if="queryResults && queryResults.length > 0">
        <q-list dense>
          <q-item v-for="(result, index) in queryResults" :key="result.id" clickable dense @click="openFile(result, false)" :class="{ 'bg-primary text-white': selectedIndex === index }" :ref="el => setItemRef(el, index)">
            <q-item-section side>
              <q-icon :name="result.file.originalFile.icon ?? 'mdi-file-document-outline'" :color="result.file.originalFile.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label><div v-html="result.file.originalFile.title" /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section v-if="fileNameResults.length > 0 || fileSynopsisResults.length > 0 || fileNoteResults.length > 0 || fileContentResults.length > 0" ref="resultsContainer">
        <q-list dense>
          <q-item v-for="(result, index) in fileNameResults" :key="result.file.id" clickable dense @click="openFile(result.file, false)" :class="{ 'bg-primary text-white': selectedIndex === index }" :ref="el => setItemRef(el, index)">
            <q-item-section side>
              <q-icon :name="result.file.icon ?? 'mdi-file-document-outline'" :color="result.file.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label><div v-html="result.annotation" /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-list dense>
          <q-item v-for="(result, index) in fileContentResults" :key="result.file.id" clickable dense @click="openFile(result.file, false)" :class="{ 'bg-primary text-white': selectedIndex === fileNameResults.length + index }" :ref="el => setItemRef(el, fileNameResults.length + index)">
            <q-item-section side>
              <q-icon :name="result.file.icon ?? 'mdi-file-document-outline'" :color="result.file.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ result.file.title }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label><div v-html="result.annotation" /></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-list dense>
          <q-item v-for="(result, index) in fileSynopsisResults" :key="result.file.id" clickable dense @click="openFile(result.file, false)" :class="{ 'bg-primary text-white': selectedIndex === fileNameResults.length + fileContentResults.length + index }" :ref="el => setItemRef(el, fileNameResults.length + fileContentResults.length + index)">
            <q-item-section side>
              <q-icon :name="result.file.icon ?? 'mdi-file-document-outline'" :color="result.file.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ result.file.title }}</q-item-label>
            </q-item-section>
            <q-item-section class="bg-grey-2">
              <q-item-label ><div v-html="result.annotation"  /></q-item-label>
            </q-item-section>
            <q-item-section side class="text-caption">
              Syn.
              <q-tooltip :delay="500">
                Contained in the synopsis of the file.
              </q-tooltip>
            </q-item-section>
          </q-item>
        </q-list>
        <q-list dense>
          <q-item v-for="(result, index) in fileNoteResults" :key="result.file.id" clickable dense @click="openFile(result.file, false)" :class="{ 'bg-primary text-white': selectedIndex === fileNameResults.length + fileContentResults.length + fileSynopsisResults.length + index }" :ref="el => setItemRef(el, fileNameResults.length + fileContentResults.length + fileSynopsisResults.length + index)">
            <q-item-section side>
              <q-icon :name="result.file.icon ?? 'mdi-file-document-outline'" :color="result.file.state?.color" class="no-padding no-margin" size="17px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ result.file.title }}</q-item-label>
            </q-item-section>
            <q-item-section class="bg-yellow-2">
              <q-item-label class=""><div v-html="result.annotation"  /></q-item-label>
            </q-item-section>
            <q-item-section side class="text-caption">
              Note
              <q-tooltip :delay="500">
                Contained in the note of the file.
              </q-tooltip>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>
<script setup>
import {ref, watch, computed, nextTick} from "vue";
import {useLayoutStore} from "stores/layout-store";
import {useFileStore} from "stores/file-store";
import {removeHtmlTags} from "src/common/utils/textUtils";

const layoutStore = useLayoutStore();
const fileStore = useFileStore();

const searchQuery = ref('');

const fileNameResults = ref([]);
const fileSynopsisResults = ref([]);
const fileNoteResults = ref([]);
const fileContentResults = ref([]);

const noResults = ref(false);

const queryResults = ref(null);

// Keyboard navigation
const selectedIndex = ref(-1);
const itemRefs = ref([]);

// Get total count of results
const totalResults = computed(() => {
  return fileNameResults.value.length +
         fileContentResults.value.length +
         fileSynopsisResults.value.length +
         fileNoteResults.value.length;
});

// Get all results as a flat array for navigation
const allResults = computed(() => {
  return [
    ...fileNameResults.value.map(r => r.file),
    ...fileContentResults.value.map(r => r.file),
    ...fileSynopsisResults.value.map(r => r.file),
    ...fileNoteResults.value.map(r => r.file)
  ];
});

// Set item refs for scrolling
function setItemRef(el, index) {
  if (el) {
    itemRefs.value[index] = el;
  }
}

// Handle keyboard navigation
function handleKeyDown(event) {
  if (totalResults.value === 0) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % totalResults.value;
    scrollToSelected();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectedIndex.value = selectedIndex.value <= 0
      ? totalResults.value - 1
      : selectedIndex.value - 1;
    scrollToSelected();
  } else if (event.key === 'Enter' && selectedIndex.value >= 0) {
    event.preventDefault();
    const selectedFile = allResults.value[selectedIndex.value];
    if (selectedFile) {
      openFile(selectedFile);
    }
  }
}

// Scroll selected item into view
function scrollToSelected() {
  nextTick(() => {
    const selectedEl = itemRefs.value[selectedIndex.value];
    if (selectedEl?.$el) {
      selectedEl.$el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

watch(searchQuery, (v) => {
  doSearch();
})

// Reset selection when results change
watch([fileNameResults, fileContentResults, fileSynopsisResults, fileNoteResults], () => {
  selectedIndex.value = totalResults.value > 0 ? 0 : -1;
  itemRefs.value = [];
})

// Reset selection when dialog opens
watch(() => layoutStore.searchOpen, (isOpen) => {
  if (isOpen) {
    selectedIndex.value = totalResults.value > 0 ? 0 : -1;
    itemRefs.value = [];
  }
})

function doSearch() {
  if(!searchQuery.value || searchQuery.value.length < 1) {
    fileNameResults.value = [];
    fileSynopsisResults.value = [];
    fileNoteResults.value = [];
    fileContentResults.value = [];
    noResults.value = false;
    return;
  }

  //TODO replace the methods below with this search
  //queryResults.value = fileStore.queryFiles(searchQuery.value, fileStore.files, true, true, { threshold: 0 });

  function filterFilesByTitles(file, results) {
    const queryLower = searchQuery.value.toLowerCase();
    const titleLower = file.title.toLowerCase();
    const index = titleLower.indexOf(queryLower);

    if (index !== -1) {
      const highlightedTitle = file.title.replace(new RegExp(queryLower, 'gi'), (match) => `<span class="highlight">${match}</span>`);
      results.push({
        file: file,
        annotation: highlightedTitle
      });
    }

    for (const child of file.children ?? []) {
      filterFilesByTitles(child, results);
    }
  }

  function filterFilesBySynopsis(file, results) {
    const synopsis = file.synopsis || '';
    const synopsisLower = synopsis.toLowerCase();
    const queryLower = searchQuery.value.toLowerCase();
    const index = synopsisLower.indexOf(queryLower);

    if (index !== -1) {
      const start = Math.max(0, index - 20);
      const end = Math.min(synopsisLower.length, index + queryLower.length + 20);
      const snippet = '...' + synopsis.substring(start, end) + '...';
      const highlightedSnippet = snippet.replace(new RegExp(queryLower, 'gi'), (match) => `<span class="highlight">${match}</span>`);

      results.push({
        file: file,
        annotation: highlightedSnippet
      });
    }

    for (const child of file.children ?? []) {
      filterFilesBySynopsis(child, results);
    }
  }

  function filterFilesByNote(file, results) {
    const note = file.note || '';
    const noteLower = note.toLowerCase();
    const queryLower = searchQuery.value.toLowerCase();
    const index = noteLower.indexOf(queryLower);

    if (index !== -1) {
      const start = Math.max(0, index - 20);
      const end = Math.min(noteLower.length, index + queryLower.length + 20);
      const snippet = '...' + note.substring(start, end) + '...';
      const highlightedSnippet = snippet.replace(new RegExp(queryLower, 'gi'), (match) => `<span class="highlight">${match}</span>`);

      results.push({
        file: file,
        annotation: highlightedSnippet
      });
    }

    for (const child of file.children ?? []) {
      filterFilesByNote(child, results);
    }
  }

  function filterFilesByContent(file, results) {
    const content = removeHtmlTags(file.content);
    const contentLower = removeHtmlTags(file.content.toLowerCase());
    const queryLower = searchQuery.value.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index !== -1) {
      const start = Math.max(0, index - 20);
      const end = Math.min(contentLower.length, index + queryLower.length + 20);
      const snippet = '...' + content.substring(start, end) + '...';
      const highlightedSnippet = snippet.replace(new RegExp(queryLower, 'gi'), (match) => `<span class="highlight">${match}</span>`);

      results.push({
        file: file,
        annotation: highlightedSnippet
      });
    }

    for (const child of file.children ?? []) {
      filterFilesByContent(child, results);
    }
  }

  const resultsTitle = [];
  const resultsSynopsis = [];
  const resultsNote = [];
  const resultsContent = [];

  for(const file of fileStore.files) {
    filterFilesByTitles(file, resultsTitle);
    filterFilesBySynopsis(file, resultsSynopsis);
    filterFilesByNote(file, resultsNote);
    filterFilesByContent(file, resultsContent);
  }

  fileNameResults.value = [...resultsTitle]
  fileSynopsisResults.value = [...resultsSynopsis]
  fileNoteResults.value = [...resultsNote]
  fileContentResults.value = [...resultsContent]

  // limit 10 results
  fileNameResults.value = fileNameResults.value.slice(0, 10);
  fileSynopsisResults.value = fileSynopsisResults.value.slice(0, 10);
  fileNoteResults.value = fileNoteResults.value.slice(0, 10);
  fileContentResults.value = fileContentResults.value.slice(0, 10);

  if(fileNameResults.value.length === 0 && fileSynopsisResults.value.length === 0 && fileNoteResults.value.length === 0 && fileContentResults.value.length === 0) {
    noResults.value = true;
  } else {
    noResults.value = false;
  }
}

function openFile(file) {
  fileStore.selectFile(file, false);
  layoutStore.searchOpen = false;
}

const input = ref('');
</script>

<style>
</style>
