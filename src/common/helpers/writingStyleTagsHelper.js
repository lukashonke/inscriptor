/**
 * Helper functions for writing style tag management and display
 */

/**
 * Get emoji icon for a specific tag
 * @param {string} tag - The tag name
 * @returns {string} - The emoji icon for the tag
 */
export function getTagIcon(tag) {
  const tagIcons = {
    'universal': '🌍',
    'cross-genre': '🔀',
    'commercial': '💼',
    'literary': '📚',
    'character-focused': '👥',
    'plot-focused': '⚡',
    'atmosphere-focused': '🌙',
    'genre-defining': '🎭',
    'casual': '😊',
    'formal': '🎩',
    'business': '💼',
    'promotional': '📢',
    'educational': '🎓',
    'storytelling': '📖'
  };

  return tagIcons[tag] || '🏷️';
}

/**
 * Format tag name from kebab-case to Title Case
 * @param {string} tag - The tag in kebab-case format
 * @param {boolean} includeIcon - Whether to include emoji icon
 * @returns {string} - The formatted tag name in Title Case
 */
export function formatTagName(tag, includeIcon = false) {
  const formattedName = tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (includeIcon) {
    const icon = getTagIcon(tag);
    return `${icon} ${formattedName}`;
  }

  return formattedName;
}

/**
 * Get color for a specific tag based on its category
 * @param {string} tag - The tag name
 * @returns {string} - The Quasar color name for the tag
 */
export function getTagColor(tag) {
  const tagColors = {
    'universal': 'blue',
    'cross-genre': 'blue-grey',
    'commercial': 'green',
    'literary': 'purple',
    'character-focused': 'deep-purple',
    'plot-focused': 'red',
    'atmosphere-focused': 'teal',
    'genre-defining': 'indigo',
    'casual': 'light-green',
    'formal': 'brown',
    'business': 'grey',
    'promotional': 'orange',
    'educational': 'cyan',
    'storytelling': 'pink'
  };

  return tagColors[tag] || 'blue-grey';
}

/**
 * Count how many writing styles have a specific tag
 * @param {string} tag - The tag to count
 * @param {Array} writingStyles - Array of writing style objects
 * @returns {number} - Number of styles with this tag
 */
export function getTagCount(tag, writingStyles) {
  return writingStyles.filter(style =>
    style.tags && style.tags.includes(tag)
  ).length;
}

/**
 * Get all unique tags from a collection of writing styles
 * @param {Array} writingStyles - Array of writing style objects
 * @returns {Array} - Sorted array of unique tags
 */
export function getAvailableTags(writingStyles) {
  const tagSet = new Set();
  writingStyles.forEach(style => {
    if (style.tags) {
      style.tags.forEach(tag => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
}
