export const variables = [
  {label: '$input', apply: 'context', type: "variable", info: 'The main input data for the AI to work with, usually selected text or the current file.', icon: null, detail: ''},
  {label: '$context', apply: 'context', type: "variable", info: 'Prompts user for additional context to provide to AI.', icon: null, detail: ''},

  {label: '$textOrSelection', apply: 'textOrSelection', type: "variable", info: 'Selected text (if any text is selected) or the whole file.', icon: null, detail: ''},
  {label: '$selection', apply: 'selection', type: "variable", info: 'Currently selected text.', icon: null, detail: ''},
  {label: '$text', apply: 'text', type: "variable", info: 'All text in the current opened file.', icon: null, detail: ''},

  {label: '$textBefore', apply: 'textBefore', type: "variable", info: 'All text before the selected text..', icon: null, detail: ''},
  {label: '$text2000Before', apply: 'textBefore', type: "variable", info: '2000 characters before the selected text.', icon: null, detail: ''},
  {label: '$text1000Before', apply: 'textBefore', type: "variable", info: '1000 characters before the selected text.', icon: null, detail: ''},
  {label: '$text500Before', apply: 'textBefore', type: "variable", info: '500 characters before the selected text.', icon: null, detail: ''},

  {label: '$textAfter', apply: 'textAfter', type: "variable", info: 'All text after the selected text.', icon: null, detail: ''},
  {label: '$chat', apply: 'chat', type: "variable", info: 'User chat message.', icon: null, detail: ''},
];
