import {url} from "boot/axios";
import {Notify} from "quasar";

export async function sendFeedbackMessage(user, title, message, abortController) {
  try {
    const response = await fetch(url + 'Feedback/Feedback', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        body: JSON.stringify({
          title: title,
          message: message
        }),
        signal: abortController?.signal
      }
    );

    // throw error if response is not ok
    if(!response.ok) {
      throw new Error('Feedback sending failed');
    }
  } catch (error) {
    Notify.create({
      message: 'Sending feedback failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

