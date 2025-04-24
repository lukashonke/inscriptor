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
      autocompleteClass: 'is-autocomplete',
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
            const { anchor } = selection
            const decorations = []

            if (!active) {
              return null
            }

            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize
              const isShown = !node.isLeaf && !isNodeEmpty(node)

              if ((hasAnchor || !this.options.showOnlyCurrent) && isShown) {
                const classes = [this.options.autocompleteClass]

                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  class: classes.join(' '),
                  'data-placeholder':
                    typeof this.options.autocompleteValue === 'function'
                      ? this.options.autocompleteValue({
                        editor: this.editor,
                        node,
                        pos,
                        hasAnchor,
                      })
                      : this.options.autocompleteValue,
                })

                decorations.push(decoration)
              }

              return this.options.includeChildren
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
