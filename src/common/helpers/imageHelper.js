export function getImageThumbmailUrl(file) {
  if(!file || !file.imageUrl)
    return null;
  return file.imageUrl.replace(".png", "-thumbnail.png");
}
