/**
 * Variable Helper
 * Utilities for resolving variable references in text
 */

/**
 * Resolves variable references one level deep in text
 * Replaces $VariableName with corresponding variable values
 *
 * @param {string} text - Text containing variable references (e.g., "$WritingStyle")
 * @param {Array} variables - Array of variable objects with title and value properties
 * @returns {string} Text with variables resolved
 *
 * @example
 * const text = "Style: $WritingStyle";
 * const variables = [{ title: "WritingStyle", value: "Formal" }];
 * resolveVariablesOneLevel(text, variables); // "Style: Formal"
 */
export function resolveVariablesOneLevel(text, variables) {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/\$([A-Za-z][A-Za-z0-9_]*)/g, (match, variableName) => {
    const foundVariable = variables.find(v => v.title === variableName);
    if (!foundVariable) return match;

    // If variable has null, undefined, or empty value, replace with empty string
    if (foundVariable.value === null || foundVariable.value === undefined || foundVariable.value === '') {
      return '';
    }

    return foundVariable.value;
  });
}

/**
 * Gets a specific variable value from variables array and resolves any nested variables
 *
 * @param {string} variableName - Name of the variable to retrieve (without $ prefix)
 * @param {Array} variables - Array of variable objects with title and value properties
 * @returns {string|null} Resolved variable value or null if not found
 *
 * @example
 * const variables = [
 *   { title: "Style", value: "Formal" },
 *   { title: "WritingStyle", value: "Use $Style tone" }
 * ];
 * getResolvedVariable("WritingStyle", variables); // "Use Formal tone"
 */
export function getResolvedVariable(variableName, variables) {
  const variable = variables.find(v => v.title === variableName);
  if (!variable) return null;

  // If variable has no value, return empty string
  if (variable.value === null || variable.value === undefined || variable.value === '') {
    return '';
  }

  // Resolve any nested variable references (one level deep)
  return resolveVariablesOneLevel(variable.value, variables);
}
