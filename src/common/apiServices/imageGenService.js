import {url} from "boot/axios";
import {Notify} from "quasar";

export async function promptLocalAutomatic1111(apiUrl, requestData, abortController) {
  try {
    const response = await fetch(url + '/Image/GenerateImage', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': null // TODO
        },
        body: JSON.stringify({
          apiUrl: apiUrl,
          requestData: requestData
        }),
        signal: abortController.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    Notify.create({
      message: 'Generation failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function generateImage(idToken, args, abortController) {
  try {
    const response = await fetch(url + 'Image/GenerateImage', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
        body: JSON.stringify(args),
        signal: abortController?.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // return response as string
    const retValue = await response.json();

    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Generation failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function uploadImage(idToken, imageUrl, user, abortController) {
  try {
    const response = await fetch(url + 'Image/UploadImage', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
        body: JSON.stringify({
          url: imageUrl,
          user: user,
        }),
        signal: abortController?.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // return response as string
    const retValue = await response.text();

    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Image upload failed.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function uploadImageRaw(idToken, base64ImageData, user, abortController) {
  try {
    const response = await fetch(url + 'Image/UploadImageRaw', {
      method: 'POST',
      headers: {
        // Accept text/plain to read the response as a string
        'Accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': idToken
      },
      body: JSON.stringify({
        base64ImageData: base64ImageData,
        user: user,
      }),
      signal: abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // Return the blob URL as text
    const retValue = await response.text();
    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Image upload failed.',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}
