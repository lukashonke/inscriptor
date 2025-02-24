export function downloadFile(data, fileName, extension) {
  // Create a blob with the JSON data
  const blob = new Blob([data], { type: extension });

  // Create a link element
  const link = document.createElement('a');

  // Set the download attribute with a filename
  link.download = fileName;

  // Create an object URL for the blob
  link.href = URL.createObjectURL(blob);

  // Programmatically click the link to trigger the download
  link.click();

  // Clean up by revoking the object URL after the download
  URL.revokeObjectURL(link.href);
}

export function convertToFilesystemSafeName(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
