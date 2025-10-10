import {diffWordsWithSpace} from "diff";
import llamaTokenizer from 'llama-tokenizer-js'
import {useFileStore} from "stores/file-store";
import {mdRenderer} from "boot/showdown";
import {htmlToMdRenderer} from "boot/turndown";

export function convertToParagraphs(text) {
  // replace \n with <br>
  text = text.replace(/\n/g, '<br>');

  // Split the text into blocks using the <br><br> as a separator
  const blocks = text.split(/<br>\s*<br>/);

  // Trim each block and wrap it in <p> tags
  const wrappedBlocks = blocks.map(block => `<p>${block.trim()}</p>`);

  // Join the blocks back into a single string
  return wrappedBlocks.join('');
}

export function trimInputWithAi(text) {
  // if surrounded by quotes, trim them
  if (text.trim().startsWith('"') && text.trim().endsWith('"')) {
    text = text.trim().slice(1, -1);
  }
  if (text.trim().startsWith('&quot;') && text.trim().endsWith('&quot;')) {
    text = text.trim().slice(6, -6);
  }

  return text.trim();
}

export function hasFlag(value, flag) {
  return (Number(value) & flag) === flag;
}

export function hasAnyHtml(text) {
  return /<[^>]*>/.test(text);
}

export function convertHtmlToText(text, trim = false) {
  if(text === null || text === undefined) {
    return null;
  }

  if(!hasAnyHtml(text)) {
    return text;
  }

  text = htmlToMarkdown(text);

  text = text.replace(/<p>/g, '\n ');
  text = text.replace(/<br>/g, '\n');
  text = text.replace(/<li>/g, '\n');
  text = text.replace(/<br\/>/g, '\n');
  text = text.replace(/<[^>]*>/g, '');

  if(trim === true) {
    text = text.trim();
  }

  return removeHtmlTags(text);
}

export function reduceLineBreaks(input) {
  // Replace occurrences of 3 or more consecutive \n with exactly two \n
  //return input.replace(/\n{3,}/g, '\n\n');
  return input.replace(/(\s*\n){3,}/g, '\n\n');
}

export function removeHtmlTags(text) {
  return text.replace(/<p>/g, ' ').replace(/<\/p>/g, ' ').replace(/<[^>]*>/g, '');
}

export function hasMultiBreaks(text) {
  return text.split(/<br>\s*<br>/).length > 1;
}


export function tokenise(text) {
  return llamaTokenizer.encode(text);
}

export function diffStrings(oldString, newString) {
  return diffWordsWithSpace(oldString, newString);

  //return diff(oldString, newString);
}

const fileMentionRegex = /<span class="mention" data-type="file" data-id="(.+)">.*<\/span>/g;

export function replaceMentionEditorText(text, useRawHtml = false) {
  const fileStore = useFileStore();

  // If useRawHtml is false, strip HTML tags
  if (!useRawHtml) {
    // replace <p> and </p> with empty space
    text = text.replace(/<p>/g, '');
    text = text.replace(/<p class=\".*?\">/g, '');
    text = text.replace(/<\/p>/g, '\n');

    // replace <br> and <br/> with empty space
    text = text.replace(/<br>/g, '');
    text = text.replace(/<br\/>/g, '');
  }

  // extract files using regex
  const fileMentions = [...text.matchAll(fileMentionRegex)];
  for (const fileMention of fileMentions) {
    const fileId = fileMention[1];
    const file = fileStore.getFile(fileId);

    let fileContent = file?.content ?? '';

    // If useRawHtml is false, strip HTML tags from file content
    if (!useRawHtml) {
      // replace <p> and </p> with empty space
      fileContent = fileContent.replace(/<p>/g, '');
      fileContent = fileContent.replace(/<p class=\".*?\">/g, '');
      fileContent = fileContent.replace(/<\/p>/g, '\n');

      // replace <br> and <br/> with empty space
      fileContent = fileContent.replace(/<br>/g, '');
      fileContent = fileContent.replace(/<br\/>/g, '\n');
    }

    text = text.replace(fileMention[0], fileContent);
  }

  return text;
}

export function replaceParameterEditorText(text, useRawHtml = false) {
  // If useRawHtml is true, return text as-is without stripping HTML
  if (useRawHtml) {
    return text;
  }

  // replace <p> and </p> with empty space - text is inline
  text = text.replace(/<p>/g, '');
  text = text.replace(/<p class=\".*?\">/g, '');
  text = text.replace(/<\/p>/g, '');

  // replace <span> and </span> with empty space
  text = text.replace(/<span>/g, '');
  text = text.replace(/<span class=\".*?\">/g, '');
  text = text.replace(/<\/span>/g, '');

  // replace <br> and <br/> with empty space
  text = text.replace(/<br>/g, '\n');
  text = text.replace(/<br\/>/g, '\n');

  return text;
}

export function newLineToBr(text) {
  return text.replace(/\n/g, '<br>');
}

export function formatNumber (num, digits = 2) {
  return parseFloat(num).toFixed(digits)
}

export function markdownToHtml(md) {
  let html = mdRenderer.render(md);

  return html;
}

export function htmlToMarkdown(html) {
  return htmlToMdRenderer.turndown(html);
}

export function truncate(text, length) {
  if(!text) return null;
  return text.length > length ? text.substring(0, length) + '...' : text;
}

export function trimWhitespace(text) {
  return text.trim();
}

export function getTextBeforeKeepingWordsIntact(text, length) {
  if (!text) {
    return '';
  }
  let initialStartIndex = Math.max(0, text.length - length);

  if (initialStartIndex === 0) {
    return text;
  }

  let adjustedStartIndex = initialStartIndex;

  // Move the start index forward to the next word boundary
  while (
    adjustedStartIndex < text.length &&
    !/\s/.test(text.charAt(adjustedStartIndex - 1))
    ) {
    adjustedStartIndex += 1;
  }

  let result = text.substring(adjustedStartIndex);

  // If we had to skip the first word, prepend "..."
  if (adjustedStartIndex > initialStartIndex) {
    result = '... ' + result;
  }

  return result;
}

export function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}
