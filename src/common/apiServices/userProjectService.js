import {url} from "boot/axios";
import {Notify} from "quasar";
import {saveToJson} from "src/common/utils/fileUtils";

export async function getProjects(user, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects', {
        method: 'GET',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        signal: abortController?.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // return response as string
    const retValue = JSON.parse(await response.text());

    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Project list failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function getCloudProjectFile(user, projectId, fileId, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId + '/Files/' + fileId, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': await user.value.getIdToken()
      },
      signal: abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // return response as string
    const retValue = JSON.parse(await response.text());

    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Project file download failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}

export async function pingProject(user, projectId, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId + '/Ping', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json',
        'Authorization': await user.value.getIdToken()
      },
      signal: abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  } catch (error) {
    Notify.create({
      message: 'Project ping failed.',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}

export async function uploadProject(user, projectData, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        body: saveToJson(projectData),
        signal: abortController?.signal
      }
    );

    // throw error if response is not ok
    if(!response.ok) {
      throw new Error('Upload failed');
    }
  } catch (error) {
    Notify.create({
      message: 'Project upload failed. It will be retried. If the issue persist, please refresh the window.',
      color: 'negative',
      position: 'top',
    });
    throw error
  }
}

export async function uploadProjectUserProjectSettings(user, projectId, data, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId + '/UserProjectSettings', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        body: JSON.stringify(data),
        signal: abortController?.signal
      }
    );

    // throw error if response is not ok
    if(!response.ok) {
      if(response.status === 412) {
        Notify.create({
          message: 'Save failed due to a conflict. Please reload the browser.',
          caption: 'Have you opened the project in another tab or device?',
          color: 'negative',
          position: 'top'
        });
      }

      throw new Error('Upload failed');
    }

    return JSON.parse(await response.text());
  } catch (error) {
    Notify.create({
      message: 'Project upload failed. It will be retried. If the issue persist, please refresh the window.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function uploadProjectData(user, projectId, data, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId + '/ProjectData', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        body: JSON.stringify(data),
        signal: abortController?.signal
      }
    );

    // throw error if response is not ok
    if(!response.ok) {
      if(response.status === 412) {
        Notify.create({
          message: 'Save failed due to a conflict. Please reload the browser.',
          caption: 'Have you opened the project in another tab or device?',
          color: 'negative',
          position: 'top'
        });
      }

      throw new Error('Upload failed');
    }

    return JSON.parse(await response.text());
  } catch (error) {
    Notify.create({
      message: 'Project upload failed. It will be retried. If the issue persist, please refresh the window.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function uploadProjectFiles(user, projectId, files, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId + '/Files', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        body: saveToJson(files),
        signal: abortController?.signal
      }
    );

    // throw error if response is not ok
    if(!response.ok) {
      if(response.status === 412) {
        Notify.create({
          message: 'Save failed due to a conflict. Please reload the browser.',
          caption: 'Have you opened the project in another tab or device?',
          color: 'negative',
          position: 'top'
        });
      }

      throw new Error('Upload failed');
    }

    return JSON.parse(await response.text());
  } catch (error) {
    Notify.create({
      message: 'Project upload failed. It will be retried. If the issue persist, please refresh the window.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function downloadProject(user, projectId, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId, {
        method: 'GET',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        signal: abortController?.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // return response as string
    const retValue = JSON.parse(await response.text());

    return retValue;
  }
  catch (error) {
    Notify.create({
      message: 'Project download failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}

export async function deleteProject(user, projectId, abortController) {
  try {
    const response = await fetch(url + 'Project/Projects/' + projectId, {
        method: 'DELETE',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        signal: abortController?.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  } catch (error) {
    Notify.create({
      message: 'Project delete failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error;
  }
}

export async function onUserLogin(idToken, abortController) {
  try {
    const response = await fetch(url + 'User/OnLogin', {
        method: 'POST',
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

    // wait for response
    await response;
  } catch (error) {
    Notify.create({
      message: 'Login verification failed.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function setUserState(idToken, state, abortController) {
  try {
    const response = await fetch(url + 'User/State', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
        body: JSON.stringify(state),
        signal: abortController?.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    // wait for response
    await response;
  } catch (error) {
    Notify.create({
      message: 'Login verification failed.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function getUserData(idToken, abortController) {
  try {
    const response = await fetch(url + 'User/UserInfo', {
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
      message: 'User info load failed.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function deleteCurrentUser(idToken, abortController) {
  try {
    const response = await fetch(url + 'User/DeleteCurrentUser', {
        method: 'DELETE',
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
  } catch (error) {
    Notify.create({
      message: 'User delete failed.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function applyCoupon(user, couponId, abortController) {
  try {
    const response = await fetch(url + 'User/ApplyCoupon?couponId=' + couponId, {
        method: 'GET',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        signal: abortController?.signal
      }
    );

    // throw error if response is not ok
    if(!response.ok) {
      throw new Error('Coupon cannot be applied.');
    }
  } catch (error) {
    Notify.create({
      message: 'Coupon cannot be applied.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}
