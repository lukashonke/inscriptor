import { boot } from 'quasar/wrappers'
import markdownit from 'markdown-it'
import { diffStrings } from 'src/common/utils/textUtils'
import { useAiAgentStore } from 'stores/aiagent-store'
import { useEditorStore } from 'stores/editor-store'
import { usePromptStore } from 'stores/prompt-store'

// Plugin to handle page links with special page: protocol
function pageLinkPlugin(md) {
  // Store original link renderer
  const defaultLinkOpenRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  const defaultLinkCloseRender = md.renderer.rules.link_close || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  // Override link_open renderer to detect page: protocol
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex('href');

    if (hrefIndex >= 0) {
      const href = token.attrs[hrefIndex][1];

      // Check if this is a page link
      if (href.startsWith('page:')) {
        const fileId = href.substring(5); // Remove 'page:' prefix

        // Return custom button HTML with data attribute
        return `<button class="page-link-btn" data-file-id="${md.utils.escapeHtml(fileId)}" title="Click to open this page">` +
               `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="margin-right: 4px;">` +
               `<path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z" fill="currentColor"/>` +
               `</svg>`;
      }
    }

    // For regular links, use default renderer
    return defaultLinkOpenRender(tokens, idx, options, env, self);
  };

  // Override link_close renderer
  md.renderer.rules.link_close = function (tokens, idx, options, env, self) {
    // Check if previous link_open was a page link by looking back
    let isPageLink = false;
    for (let i = idx - 1; i >= 0; i--) {
      if (tokens[i].type === 'link_open') {
        const hrefIndex = tokens[i].attrIndex('href');
        if (hrefIndex >= 0 && tokens[i].attrs[hrefIndex][1].startsWith('page:')) {
          isPageLink = true;
        }
        break;
      }
    }

    if (isPageLink) {
      return '</button>';
    }

    // For regular links, use default renderer
    return defaultLinkCloseRender(tokens, idx, options, env, self);
  };
}

// Plugin to handle prose blocks with paragraph IDs and diffs
function proseBlockPlugin(md) {
  // Override fence renderer for code blocks
  const fence = md.renderer.rules.fence || function(tokens, idx, options, env, renderer) {
    return renderer.renderToken(tokens, idx, options);
  };

  md.renderer.rules.fence = function (tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    const content = token.content;

    // Check if this is a paragraph or prose codeblock
    if (info.startsWith('paragraph:') || info === 'prose') {
      const paragraphId = info.startsWith('paragraph:') ? info.substring(10) : null;

      let htmlContent = '';

      if (paragraphId) {
        // Try to get the original paragraph content for diff
        try {
          const aiAgentStore = useAiAgentStore();
          const editorStore = useEditorStore();
          const editor = editorStore.editor;

          if (editor) {
            // Find the paragraph with this ID
            let originalText = '';
            const doc = editor.state.doc;

            doc.nodesBetween(0, doc.content.size, (node, pos) => {
              if (node.type.name === 'paragraph' && node.attrs.id === paragraphId) {
                const from = pos;
                const to = pos + node.nodeSize;
                // Get text content of the paragraph
                originalText = doc.textBetween(from, to, '\n', '\n').trim();
                return false; // Stop searching
              }
            });

            if (originalText) {
              // Calculate diff
              const diff = diffStrings(originalText, content.trim());

              // Get the diffsShowRemoved setting
              const promptStore = usePromptStore();
              const showRemoved = promptStore.diffsShowRemoved;

              // Render diff
              htmlContent = '<div class="prose-diff-content">';
              for (const part of diff) {
                if (part.added) {
                  htmlContent += `<span class="diff-added">${md.utils.escapeHtml(part.value)}</span>`;
                } else if (part.removed) {
                  // Only include removed text if setting is enabled
                  if (showRemoved) {
                    htmlContent += `<span class="diff-removed">${md.utils.escapeHtml(part.value)}</span>`;
                  }
                } else {
                  htmlContent += md.utils.escapeHtml(part.value);
                }
              }
              htmlContent += '</div>';
            } else {
              // No original found, just show the new content
              htmlContent = `<div class="prose-content">${md.utils.escapeHtml(content)}</div>`;
            }
          }
        } catch (e) {
          console.error('Error calculating diff:', e);
          htmlContent = `<div class="prose-content">${md.utils.escapeHtml(content)}</div>`;
        }
      } else {
        // No paragraph ID, just show content
        htmlContent = `<div class="prose-content">${md.utils.escapeHtml(content)}</div>`;
      }

      // Create custom HTML structure
      const attrs = paragraphId
        ? ` data-paragraph-id="${md.utils.escapeHtml(paragraphId)}"`
        : '';

      // Add paste button only if we have a paragraph ID
      const pasteButton = paragraphId ? `
        <button class="prose-paste-btn" data-paragraph-id="${md.utils.escapeHtml(paragraphId)}" title="Replace paragraph with this text">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
            <path d="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0S9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z" fill="currentColor"/>
          </svg>
        </button>
      ` : '';

      return `<div class="prose-block"${attrs}>
        ${htmlContent}
        <button class="blockquote-copy-btn" title="Copy to clipboard" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('.prose-content, .prose-diff-content').innerText)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" fill="currentColor"/>
          </svg>
        </button>
        ${pasteButton}
      </div>\n`;
    }

    // For regular code blocks, use the default renderer
    return fence(tokens, idx, options, env, renderer);
  };
}

let mdRenderer;
export default boot(({ app }) => {
  mdRenderer = markdownit({

  });

  // Use the page link plugin
  mdRenderer.use(pageLinkPlugin);

  // Use the prose block plugin
  mdRenderer.use(proseBlockPlugin);
})

export { mdRenderer }
