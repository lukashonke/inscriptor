import {url} from "boot/axios";

export function promptStream(idToken, request, wordCallback, finishCallback, errorCallback, abortController, controller, action) {
  fetch(url + '' + controller + '/' + action, {
    headers: {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
      'Authorization': idToken
    },
    method: 'POST',
    body: JSON.stringify(request),
    signal: abortController.signal,
  })
    .then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            if(finishCallback) {
              finishCallback();
            }
            return;
          }
          // Decode the stream chunk to a string and log it
          const text = decoder.decode(value, { stream: true });
          //console.log(text);

          if(wordCallback) {
            wordCallback(text);
          }
          // Read the next chunk
          read();
        }).catch(err => {
          if(errorCallback) {
            errorCallback(err);
          }
        });
      }

      read();
    })
    .catch(err => {
      if(errorCallback) {
        errorCallback(err);
      }
    });
}
