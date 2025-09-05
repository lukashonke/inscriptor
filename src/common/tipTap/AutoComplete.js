import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import {Extension, isNodeEmpty } from '@tiptap/vue-3';
import { Node as ProsemirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const AutoCompletePlugin = Extension.create({
  name: 'autocomplete',

  addOptions() {
    return {
      autocompleteClass: 'is-autocomplete-widget',
      autocompleteValue: 'Write something …',
      showOnlyWhenEditable: true,
      showOnlyCurrent: true,
      includeChildren: false,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autocomplete'),
        props: {
          decorations: ({ doc, selection }) => {
            const active = this.editor.isEditable || !this.options.showOnlyWhenEditable
            const { $cursor } = selection
            const decorations = []

            if (!active || !$cursor) {
              return null
            }

            // Get the autocomplete text
            let autocompleteText = ''
            if (typeof this.options.autocompleteValue === 'function') {
              autocompleteText = this.options.autocompleteValue({
                editor: this.editor,
                node: $cursor.parent,
                pos: $cursor.pos,
                hasAnchor: true,
              })
            } else {
              autocompleteText = this.options.autocompleteValue
            }

            // Only create decoration if there's autocomplete text
            if (autocompleteText && autocompleteText.trim().length > 0) {
              // Create a widget decoration at the cursor position
              const widget = document.createElement('span')
              widget.className = this.options.autocompleteClass
              widget.textContent = autocompleteText
              widget.style.color = '#adb5bd'
              widget.style.pointerEvents = 'none'
              widget.style.userSelect = 'none'
              
              const decoration = Decoration.widget($cursor.pos, widget, {
                side: 1, // Place widget after cursor position
                marks: []
              })

              decorations.push(decoration)
            }

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
