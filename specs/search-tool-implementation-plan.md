# Search Tool Implementation Plan

## Status: In Progress
- [x] Install Fuse.js dependency (version 7.1.0 added to package.json)
- [ ] Add search tool definition to getChatAgentTools()
- [ ] Implement executeSearchTool() method
- [ ] Add search case to executeChatAgentTool() switch
- [ ] Update documentation

## Remaining Implementation Steps

### 2. Add Search Tool Definition to getChatAgentTools()
**Location:** `src/stores/aiagent-store.js`

Add this tool definition to the array in `getChatAgentTools()`:

```javascript
{
  type: "function",
  function: {
    name: "search",
    description: "Search through all project files using exact or fuzzy matching",
    parameters: {
      type: "object",
      properties: {
        searchQuery: {
          type: "string",
          description: "The text to search for"
        },
        searchType: {
          type: "string",
          description: "Type of content to search in",
          enum: ["title", "content", "synopsis", "all"],
          default: "all"
        },
        fuzzySearch: {
          type: "boolean",
          description: "Enable fuzzy search for typo tolerance and approximate matching",
          default: false
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return",
          default: 20
        },
        threshold: {
          type: "number",
          description: "Fuzzy search sensitivity (0.0 = exact match, 1.0 = match anything)",
          default: 0.3
        }
      },
      required: ["searchQuery"]
    }
  }
}
```

### 3. Implement executeSearchTool() Method
**Location:** `src/stores/aiagent-store.js`

Add this method after `executeSetFileSummaryTool()`:

```javascript
executeSearchTool(args) {
  const { 
    searchQuery, 
    searchType = 'all', 
    fuzzySearch = false, 
    maxResults = 20, 
    threshold = 0.3 
  } = args;
  
  if (!searchQuery || searchQuery.trim() === '') {
    return { error: "searchQuery parameter is required and cannot be empty" };
  }

  const fileStore = useFileStore();
  const { flattenFiles } = require("src/common/utils/fileUtils");
  
  // Get all files (flattened to include nested files)
  const allFiles = flattenFiles(fileStore.files);
  
  if (allFiles.length === 0) {
    return {
      success: true,
      content: "No files found in the project.",
      totalResults: 0
    };
  }

  let results = [];
  
  if (fuzzySearch) {
    // Import Fuse.js for fuzzy search
    const Fuse = require('fuse.js');
    
    // Configure search fields based on searchType
    const searchFields = this.getSearchFields(searchType);
    
    const fuseOptions = {
      keys: searchFields,
      threshold: threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2
    };
    
    const fuse = new Fuse(allFiles, fuseOptions);
    const fuseResults = fuse.search(searchQuery);
    
    results = fuseResults
      .slice(0, maxResults)
      .map(result => this.formatFuzzySearchResult(result, fileStore));
      
  } else {
    // Exact search using queryFiles pattern
    const searchQueryLower = searchQuery.toLowerCase();
    
    results = allFiles
      .filter(file => this.matchesExactSearch(file, searchQueryLower, searchType))
      .slice(0, maxResults)
      .map(file => this.formatExactSearchResult(file, searchQuery, searchType, fileStore));
  }
  
  // Format output
  const output = this.formatSearchOutput(searchQuery, searchType, fuzzySearch, results);
  
  return {
    success: true,
    content: output,
    totalResults: results.length
  };
}

// Helper methods to add:

getSearchFields(searchType) {
  switch (searchType) {
    case 'title': return ['title'];
    case 'content': return ['content'];
    case 'synopsis': return ['synopsis'];
    case 'all': 
    default: 
      return ['title', 'content', 'synopsis'];
  }
}

matchesExactSearch(file, searchQueryLower, searchType) {
  switch (searchType) {
    case 'title':
      return file.title && file.title.toLowerCase().includes(searchQueryLower);
    case 'content':
      return file.content && file.content.toLowerCase().includes(searchQueryLower);
    case 'synopsis':
      return file.synopsis && file.synopsis.toLowerCase().includes(searchQueryLower);
    case 'all':
    default:
      return (file.title && file.title.toLowerCase().includes(searchQueryLower)) ||
             (file.content && file.content.toLowerCase().includes(searchQueryLower)) ||
             (file.synopsis && file.synopsis.toLowerCase().includes(searchQueryLower));
  }
}

formatFuzzySearchResult(fuseResult, fileStore) {
  const file = fuseResult.item;
  const matches = fuseResult.matches || [];
  const score = fuseResult.score;
  
  return {
    fileId: file.id,
    title: file.title,
    path: fileStore.getFileNameWithPath(file),
    matchType: matches.length > 0 ? matches[0].key : 'unknown',
    score: Math.round((1 - score) * 100), // Convert to percentage
    snippet: this.generateSnippet(file, matches, 100)
  };
}

formatExactSearchResult(file, searchQuery, searchType, fileStore) {
  const matchType = this.getMatchType(file, searchQuery.toLowerCase(), searchType);
  
  return {
    fileId: file.id,
    title: file.title,
    path: fileStore.getFileNameWithPath(file),
    matchType: matchType,
    snippet: this.generateExactSnippet(file, searchQuery, matchType, 100)
  };
}

getMatchType(file, searchQueryLower, searchType) {
  if (searchType !== 'all') return searchType;
  
  if (file.title && file.title.toLowerCase().includes(searchQueryLower)) return 'title';
  if (file.content && file.content.toLowerCase().includes(searchQueryLower)) return 'content';
  if (file.synopsis && file.synopsis.toLowerCase().includes(searchQueryLower)) return 'synopsis';
  return 'unknown';
}

generateSnippet(file, matches, maxLength) {
  if (matches.length > 0) {
    const match = matches[0];
    const text = file[match.key] || '';
    const indices = match.indices[0];
    
    if (indices) {
      const start = Math.max(0, indices[0] - 30);
      const end = Math.min(text.length, indices[1] + 30);
      let snippet = text.substring(start, end);
      
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';
      
      return snippet.length > maxLength ? snippet.substring(0, maxLength) + '...' : snippet;
    }
  }
  
  // Fallback snippet
  const content = file.content || file.synopsis || file.title || '';
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
}

generateExactSnippet(file, searchQuery, matchType, maxLength) {
  const text = file[matchType] || '';
  const queryLower = searchQuery.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);
  
  if (index !== -1) {
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + searchQuery.length + 30);
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet.length > maxLength ? snippet.substring(0, maxLength) + '...' : snippet;
  }
  
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

formatSearchOutput(searchQuery, searchType, fuzzySearch, results) {
  let output = `SEARCH RESULTS\n`;
  output += `Query: "${searchQuery}"\n`;
  output += `Search Type: ${searchType}\n`;
  output += `Mode: ${fuzzySearch ? 'Fuzzy' : 'Exact'} search\n`;
  output += `Results: ${results.length}\n\n`;
  
  if (results.length === 0) {
    output += `No files found matching "${searchQuery}".\n\n`;
    output += `Try:\n`;
    output += `- Different search terms\n`;
    output += `- Fuzzy search for typo tolerance\n`;
    output += `- Broader search type (e.g., "all" instead of "title")\n`;
    return output;
  }
  
  results.forEach((result, index) => {
    output += `${index + 1}. ${result.title}\n`;
    output += `   ID: ${result.fileId}\n`;
    output += `   Path: ${result.path}\n`;
    output += `   Match: ${result.matchType}`;
    if (result.score !== undefined) {
      output += ` (${result.score}% relevance)`;
    }
    output += `\n`;
    if (result.snippet) {
      output += `   Preview: ${result.snippet}\n`;
    }
    output += `\n`;
  });
  
  return output;
}
```

### 4. Add Search Case to executeChatAgentTool()
**Location:** `src/stores/aiagent-store.js`

Add this case to the switch statement in `executeChatAgentTool()`:

```javascript
case 'search':
  return this.executeSearchTool(args);
```

### 5. Update Documentation
**Location:** `specs/ai-agent-tools-implementation.md`

Add to Project Tools section:
```markdown
4. **search** - Search through all project files with exact or fuzzy matching
   - Parameters: `searchQuery`, `searchType` (title/content/synopsis/all), `fuzzySearch` (boolean), `maxResults`, `threshold`
```

Add to Tool Execution section:
```markdown
- `executeSearchTool()` - Implements both exact and fuzzy search using Fuse.js library
```

Mark TODO as completed:
```markdown
- [x] search tool (be inspired in file-store queryFiles - but feel free to create your own implementation suitable for tool calling)
```

## Implementation Notes

### Key Features
- **Dual Mode**: Supports both exact and fuzzy search
- **Flexible Search Types**: Can search in titles, content, synopsis, or all
- **Configurable**: Adjustable result limits and fuzzy search sensitivity
- **Rich Results**: Includes file metadata, match context, and relevance scores
- **Performance**: Uses existing `flattenFiles()` for comprehensive file access

### Integration Points
- Uses `fileStore.getFileNameWithPath()` for full file paths
- Leverages existing `flattenFiles()` utility for file traversal
- Follows existing tool patterns for error handling and result formatting
- Compatible with existing AI agent tool architecture

### Error Handling
- Validates required searchQuery parameter
- Handles empty search results gracefully
- Provides helpful suggestions when no results found
- Graceful fallbacks for missing file properties