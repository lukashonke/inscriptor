import {Node} from '@tiptap/core';
import {mergeAttributes} from '@tiptap/vue-3';

export const CustomParagraph = Node.create({
  name: 'userMessageParagraph',

  defaultOptions: {
    HTMLAttributes: {
      class: 'user-message',
    },
  },

  group: 'block',

  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'p.user-message',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
