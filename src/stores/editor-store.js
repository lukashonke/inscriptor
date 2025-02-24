import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    editor: null,
    titleRef: null,
  }),
  getters: {
    getEditor: (state) => state.editor,
  },
  actions: {
    setEditor(editor) {
      this.editor = editor;
      console.log(this.editor);
    }
  }
});
