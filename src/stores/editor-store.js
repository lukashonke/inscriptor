import { defineStore } from 'pinia';
import {getEditorSelection} from 'src/common/utils/editorUtils';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    editor: null,
    titleRef: null,

    autoCompleteText: null,
  }),
  getters: {
    getEditor: (state) => state.editor,
  },
  actions: {
    setEditor(editor) {
      this.editor = editor;
    },
    confirmAutocompleteText() {
      if(!this.autoCompleteText || !this.editor) return;

      const { from, to, empty } = getEditorSelection();

      this.editor
        .chain()
        //.focus()
        .insertContentAt(from, this.autoCompleteText,
          {
            updateSelection: false,
            parseOptions: {
              preserveWhitespace: true,
            }
          })
        .run();

      this.autoCompleteText = null;
    }
  }
});
