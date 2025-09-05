import Fuse from 'fuse.js';
import { useFileStore } from 'stores/file-store';

export function useFileSearch() {
  const fileStore = useFileStore();

  function performUnifiedSearch(searchQuery, searchType = 'all', fuzzySearch = false, maxResults = 20, threshold = 0.3, contextType = null) {
    if (!searchQuery || !searchQuery.trim()) {
      return [];
    }

    // Filter files by context type if specified
    let sourceFiles = fileStore.files;
    if (contextType && contextType !== 'all') {
      sourceFiles = fileStore.getContextFiles(contextType);
    }

    const allFiles = flattenFilesForSearch(sourceFiles);

    if (allFiles.length === 0) {
      return [];
    }

    // Use threshold 0.0 for exact search, specified threshold for fuzzy search
    const searchThreshold = fuzzySearch ? threshold : 0.0;

    return performSearch(allFiles, searchQuery, searchType, searchThreshold, maxResults);
  }

  function searchFiles(searchQuery, searchType = 'all', fuzzySearch = false, maxResults = 20, threshold = 0.3, returnRaw = false, contextType = null) {
    if (!searchQuery || !searchQuery.trim()) {
      if (returnRaw) return [];
      return { error: "searchQuery parameter is required and cannot be empty" };
    }

    const results = performUnifiedSearch(searchQuery, searchType, fuzzySearch, maxResults, threshold, contextType);
    if (returnRaw) {
      return results;
    }

    if (results.length === 0) {
      return {
        success: true,
        content: "No results found."
      };
    }

    return formatSearchResults(results, searchQuery, searchType, fuzzySearch);
  }

  function flattenFilesForSearch(files, parentPath = '') {
    const flattened = [];

    for (const file of files) {
      const fullPath = parentPath ? `${parentPath} / ${file.title}` : file.title;

      flattened.push({
        id: file.id,
        title: file.title,
        content: file.content || '',
        synopsis: file.synopsis || '',
        fullPath: fullPath,
        originalFile: file
      });

      if (file.children && file.children.length > 0) {
        flattened.push(...flattenFilesForSearch(file.children, fullPath));
      }
    }

    return flattened;
  }

  function performSearch(files, query, searchType, threshold, maxResults) {
    const searchFields = getSearchFields(searchType);

    const fuse = new Fuse(files, {
      keys: searchFields,
      threshold: threshold, // 0.0 for exact search, 0.3+ for fuzzy search
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true // Search entire text, not just the first 60 characters
    });

    const fuseResults = fuse.search(query);
    return fuseResults.slice(0, maxResults).map(result => ({
      file: result.item,
      score: result.score,
      matches: result.matches,
      matchType: determineMatchType(result.matches)
    }));
  }

  function getSearchFields(searchType) {
    switch (searchType) {
      case 'title': return ['title'];
      case 'content': return ['content'];
      case 'synopsis': return ['synopsis'];
      case 'all':
      default: return ['title', 'content', 'synopsis'];
    }
  }

  function determineMatchType(matches) {
    if (!matches || matches.length === 0) return 'unknown';

    // Priority: title > synopsis > content
    if (matches.some(m => m.key === 'title')) return 'title';
    if (matches.some(m => m.key === 'synopsis')) return 'synopsis';
    if (matches.some(m => m.key === 'content')) return 'content';

    return matches[0].key;
  }

  function formatSearchResults(results, query, searchType, fuzzySearch) {
    if (results.length === 0) {
      return {
        success: true,
        content: `No results found for "${query}" in ${searchType === 'all' ? 'any field' : searchType}.`
      };
    }

    let output = `SEARCH RESULTS for "${query}":\n`;
    output += `Search type: ${searchType}, Fuzzy: ${fuzzySearch ? 'enabled' : 'disabled'}\n`;
    output += `Found ${results.length} result(s)\n\n`;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const file = result.file;

      output += `${i + 1}. ${file.title}\n`;
      output += `   ID: ${file.id}\n`;
      output += `   Path: ${file.fullPath}\n`;
      output += `   Match type: ${result.matchType}\n`;

      if (fuzzySearch && result.score !== undefined) {
        output += `   Relevance: ${(1 - result.score).toFixed(2)}\n`;
      }

      // Add context snippet
      const snippet = createSearchSnippet(result, query);
      if (snippet) {
        output += `   Context: "${snippet}"\n`;
      }

      output += '\n';
    }

    return {
      success: true,
      content: output
    };
  }

  function createSearchSnippet(result, query, maxLength = 300) {
    const file = result.file;
    const queryLower = query.toLowerCase();

    // Try to find the best snippet from matches
    if (result.matches && result.matches.length > 0) {
      for (const match of result.matches) {
        const text = file[match.key] || '';
        const index = text.toLowerCase().indexOf(queryLower);

        if (index !== -1) {
          const start = Math.max(0, index - 100);
          const end = Math.min(text.length, index + query.length + 100);
          let snippet = text.substring(start, end);

          if (start > 0) snippet = '...' + snippet;
          if (end < text.length) snippet = snippet + '...';

          if (snippet.length > maxLength) {
            snippet = snippet.substring(0, maxLength - 3) + '...';
          }

          return snippet;
        }
      }
    }

    // Fallback: try to find query in any field
    for (const field of ['title', 'synopsis', 'content']) {
      const text = file[field] || '';
      const index = text.toLowerCase().indexOf(queryLower);

      if (index !== -1) {
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + query.length + 100);
        let snippet = text.substring(start, end);

        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        return snippet.length > maxLength ? snippet.substring(0, maxLength - 3) + '...' : snippet;
      }
    }

    return null;
  }

  return {
    searchFiles
  };
}
