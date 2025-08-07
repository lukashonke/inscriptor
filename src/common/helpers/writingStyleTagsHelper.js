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
    // Group 1 - Scope
    'Universal': '🌍',
    'Cross Genre': '🔀',
    'Genre Defining': '🎭',

    // Group 2 - Primary Focus
    'Character-Driven': '👥',
    'Plot-Driven': '⚡',
    'Atmosphere-Driven': '🌙',
    'Dialogue-Driven': '💬',

    // Group 3 - Target Use
    'Creative Writing': '✍️',
    'Business and Projects': '💼',
    'Digital Web Content': '📱',

    // Group 4 - Tone/Style
    'Witty': '😄',
    'Serious': '🎯',
    'Playful': '🎈',
    'Dramatic': '🎬',
    'Casual': '😊'
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
    // Group 1 - Scope (blue tones)
    'Universal': 'blue',
    'Cross Genre': 'teal',
    'Genre Defining': 'blue-grey',

    // Group 2 - Primary Focus (purple/red tones)
    'Character-Driven': 'teal',
    'Plot-Driven': 'red',
    'Atmosphere-Driven': 'deep-purple',
    'Dialogue-Driven': 'purple',

    // Group 3 - Target Use (green/grey tones)
    'Creative Writing': 'green',
    'Business and Projects': 'grey',
    'Digital Web Content': 'cyan',

    // Group 4 - Tone/Style (warm tones)
    'Witty': 'orange',
    'Serious': 'brown',
    'Playful': 'pink',
    'Dramatic': 'deep-orange',
    'Casual': 'light-green'
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
 * Get all unique tags from a collection of writing styles, ordered by group priority
 * @param {Array} writingStyles - Array of writing style objects
 * @returns {Array} - Ordered array of unique tags
 */
export function getAvailableTags(writingStyles) {
  // Define the tag order by groups
  const tagOrder = [
    // Group 1 - Scope (required - choose one)
    'Universal',
    'Cross Genre',
    'Genre Defining',

    // Group 2 - Primary Focus
    'Character-Driven',
    'Plot-Driven',
    'Atmosphere-Driven',
    'Dialogue-Driven',

    // Group 3 - Target Use
    'Creative Writing',
    'Business and Projects',
    'Digital Web Content',

    // Group 4 - Tone/Style
    'Witty',
    'Serious',
    'Playful',
    'Dramatic',
    'Casual'
  ];

  const tagSet = new Set();
  writingStyles.forEach(style => {
    if (style.tags) {
      style.tags.forEach(tag => tagSet.add(tag));
    }
  });

  // Return tags in the defined order, only including those that exist
  return tagOrder.filter(tag => tagSet.has(tag));
}
