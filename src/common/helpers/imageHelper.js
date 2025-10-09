import { uploadImageRaw, uploadImage } from 'src/common/apiServices/imageGenService';
import { uint8ArrayToBase64 } from 'src/common/utils/textUtils';
import { Notify } from 'quasar';

export function getImageThumbmailUrl(file) {
  if(!file || !file.imageUrl)
    return null;
  return file.imageUrl.replace(".png", "-thumbnail.png");
}

/**
 * Upload an image from a local file (handles both desktop and web)
 * @param {Object} user - Firebase user object with getIdToken() and uid
 * @returns {Promise<string>} URL of the uploaded image
 */
export async function uploadImageFromFile(user) {
  const idToken = await user.getIdToken();

  // Check if running in desktop app (Tauri)
  if (window.__TAURI__) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readFile } = await import('@tauri-apps/plugin-fs');

    const filePath = await open({
      multiple: false,
      directory: false,
      filters: [{
        name: 'Image',
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
      }]
    });

    if (!filePath) {
      return null; // User cancelled
    }

    try {
      const binaryData = await readFile(filePath);
      const base64 = uint8ArrayToBase64(binaryData);
      const imageUrl = await uploadImageRaw(idToken, base64, user.uid);

      return imageUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      Notify.create({
        message: 'Failed to upload image from file',
        color: 'negative',
        position: 'top'
      });
      throw error;
    }
  } else {
    // Web mode - use file input
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null); // User cancelled
          return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const dataUrl = ev.target.result;
            const base64 = dataUrl.split(',')[1];
            const imageUrl = await uploadImageRaw(idToken, base64, user.uid);

            resolve(imageUrl);
          } catch (error) {
            console.error('Failed to upload image:', error);
            Notify.create({
              message: 'Failed to upload image from file',
              color: 'negative',
              position: 'top'
            });
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }
}

/**
 * Upload an image from a URL
 * @param {Object} user - Firebase user object with getIdToken() and uid
 * @param {string} imageUrl - URL of the image to upload
 * @returns {Promise<string>} URL of the uploaded image
 */
export async function uploadImageFromUrl(user, imageUrl) {
  if (!imageUrl || !imageUrl.trim()) {
    Notify.create({
      message: 'Please enter a valid image URL',
      color: 'warning',
      position: 'top'
    });
    return null;
  }

  try {
    const idToken = await user.getIdToken();
    const uploadedUrl = await uploadImage(idToken, imageUrl, user.uid);

    return uploadedUrl;
  } catch (error) {
    console.error('Failed to upload image from URL:', error);
    Notify.create({
      message: 'Failed to upload image from URL',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}
