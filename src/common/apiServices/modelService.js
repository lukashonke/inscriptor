import {url} from "boot/axios";
import {Notify} from "quasar";

export async function getModelData(idToken, abortController) {
  try {
    const response = await fetch(url + 'Model/ModelData', {
        method: 'GET',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
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
      message: 'Could not fetch model data from cloud.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function getOpenRouterModels(name, take = 10, abortController) {
  try {
    const queryParams = new URLSearchParams({
      name: name || '',
      take: take.toString()
    });

    const response = await fetch(`${url}Model/OpenRouterModels?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json',
      },
      signal: abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const retValue = JSON.parse(await response.text());
    return retValue;

  } catch (error) {
    Notify.create({
      message: 'Could not fetch openrouter models from cloud.',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}
