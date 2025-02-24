import {trimLineBreaks} from "src/common/helpers/promptHelper";
import {useEditorStore} from "stores/editor-store";
import { DOMSerializer } from 'prosemirror-model'
import {htmlToMarkdown} from "src/common/utils/textUtils";

export function getAllText() {
  const editor = getEditor();
  const text = editorTextBetween(editor.state.doc, { from: 0, to: editor.state.doc.content.size }, '\n', '\n');

  return text;
}

export function getAllHtml() {
  const editor = getEditor();
  const text = editorHtmlBetween(editor.state, { from: 0, to: editor.state.doc.content.size });

  return text;
}

export function getAllMarkdown() {
  const html = getAllHtml();
  return htmlToMarkdown(html);
}

export function getSelectedText() {
  const editorStore = useEditorStore();

  const { from, to, empty } = getEditor().state.selection;

  if (empty) {
    return null;
  }

  const text = editorTextBetween(editorStore.getEditor.state.doc, { from, to }, '\n', '\n');

  return text;
}

export function getSelectedTextExpanded(addLeft, addRight, surroundWith) {
  const editorStore = useEditorStore();

  const { from, to, empty } = getEditor().state.selection;

  if (empty) {
    return null;
  }

  let left = from - addLeft;
  let right = to + addRight;

  if(left < 0) {
    left = 0;
  }

  if(right > editorStore.getEditor.state.doc.content.size) {
    right = editorStore.getEditor.state.doc.content.size;
  }

  const text = editorTextBetween(editorStore.getEditor.state.doc, { from: left, to: right }, '\n', '\n');

  if(surroundWith) {
    return surroundWith + text + surroundWith;
  }

  return text;
}

export function getSelectedHtml() {
  const editorStore = useEditorStore();

  const { from, to, empty } = getEditor().state.selection;

  if (empty) {
    return null;
  }

  const html = editorHtmlBetween(editorStore.getEditor.state, { from, to });

  return html;
}

export function getSelectedMarkdown() {
  const html = getSelectedHtml();
  return htmlToMarkdown(html);
}

export function editorHtmlBetween(state, range) {
  const { from, to } = range;

  // Create a DOM serializer
  const serializer = DOMSerializer.fromSchema(state.schema);

  // Get fragment of content between from and to
  const fragment = state.doc.slice(from, to).content;

  // Serialize the fragment to HTML
  const domFragment = serializer.serializeFragment(fragment);

  // Convert to HTML string
  const temp = document.createElement('div');
  temp.appendChild(domFragment);
  return temp.innerHTML;
}

export function editorMarkdownBetween(state, range) {
  const html = editorHtmlBetween(state, range);

  return htmlToMarkdown(html);
}

export function editorTextBetween(
  startNode,
  range,
  blockSeparator,
  newLineSeparator
) {
  const { from, to } = range
  let text = ''
  let separated = true

  startNode.nodesBetween(from, to, (node, pos, parent, index) => {
    if (node.isText) {
      if(parent?.type.name === 'heading') {
        if(parent.attrs.level === 1) {
          text += '### ';
        } else if(parent.attrs.level === 2) {
          text += '## ';
        } else if(parent.attrs.level === 3) {
          text += '# ';
        }
      }

      if(node.marks.length > 0) {
        for (const mark of node.marks) {
          if (mark.type.name === 'bold') {
            text += '**';
          }
        }
      }

      text += node?.text?.slice(Math.max(from, pos) - pos, to - pos) // eslint-disable-line

      if(node.marks.length > 0) {
        for (const mark of node.marks) {
          if (mark.type.name === 'bold') {
            text += '**';
          }
        }
      }

      separated = false
    } else if (node.type.name === 'listItem') {
      text += newLineSeparator + '- '
      separated = true;
    }
    else if (node.isBlock && !separated) {
      text += blockSeparator
      separated = true
    }
  })

  console.log(text);

  return text
}

export function convertTextsToChat(texts) {
  let chatMessages = [];

  for (const text of texts) {
    if(text.rootNodeType === 'paragraph') {
      chatMessages.push({type: 'assistant', text: text.text});
    } else if(text.rootNodeType === 'blockquote') {
      chatMessages.push({type: 'user', text: text.text});
    }
  }

  return chatMessages;
}

export function editorTextsBetween(
  startNode,
  range,
  blockSeparator,
  newLineSeparator
) {
  const { from, to } = range
  let nodes = [];
  let rootNodes = [];

  let separated = true


  startNode.nodesBetween(from, to, (node, pos, parent, index) => {
    let text = '';

    if (node.isText) {
      text += node?.text?.slice(Math.max(from, pos) - pos, to - pos) // eslint-disable-line
      text += newLineSeparator;
      separated = false
    } else if (node.isBlock && !separated) {
      text += blockSeparator
      separated = true
    }

    nodes.push({node: node, parent: parent, text: text});

    if(parent?.type?.name === null || parent.type.name === 'doc') {
      rootNodes.push({node: node, parent: parent, text: text});
    }
  });

  let currentText = null;

  let texts = [];

  for (const rootNode of rootNodes) {
    processNode(rootNode.node, null, rootNode.node.type?.name ?? 'Unknown', rootNode.text ?? '');
  }

  function processNode(node, parent, rootNodeType, text) {
    //const nodeType = node.type.name; // possible values: paragraph, blockquote, text
    const nodeChildren = node.content?.content ?? null; // could be null

    if(currentText === null || rootNodeType !== currentText.rootNodeType) {
      if(currentText !== null && currentText.text.trim().length > 0) {
        texts.push(currentText);
      }

      currentText = {rootNodeType: rootNodeType, text: ''};
    }

    if(text.length > 0)
    currentText.text += text;

    if(nodeChildren) {
      for (const childNode of nodeChildren) {
        processNode(childNode, node, rootNodeType, nodes.find(n => n.node === childNode)?.text ?? '');
      }
    }
  }


  if(currentText && currentText.text.trim().length > 0) {
    texts.push(currentText);
  }

  for (const text of texts) {
    text.text = trimLineBreaks(text.text).trim();
  }

  console.log(texts);

  return texts;
}

export function isEmptySelection() {
  const editorStore = useEditorStore();

  const editor = editorStore.getEditor;

  if(!editor) {
    return true;
  }

  const { empty } = editorStore.getEditor.state.selection;

  return empty;
}

export function getEditor() {
  const editorStore = useEditorStore();

  return editorStore.getEditor;
}

export function getEditorSelection() {
  return getEditor()?.state.selection;
}
