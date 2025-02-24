import {url} from "boot/axios";
import {Notify} from "quasar";

export async function checkout(user, creditsVariant, subscriptionVariant, abortController) {
  try {
    const response = await fetch(url + 'Stripe/CreateCheckout', {
        method: 'POST',
        headers: {
          // get raw text
          'Accept': 'text/plain',
          'Content-Type': 'application/json',
          'Authorization': await user.value.getIdToken()
        },
        body: JSON.stringify({
          creditsVariant: creditsVariant ?? null,
          subscriptionVariant: subscriptionVariant ?? null,
        }),
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
      message: 'Checkout failed. Please try again.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function cancel(user, abortController) {
  try {
    const response = await fetch(url + 'Stripe/CancelSubscription', {
        method: 'POST',
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
    const retValue = await response.text();

    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Cancellation failed. Please try again or contact us for assistance.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}

export async function renew(user, abortController) {
  try {
    const response = await fetch(url + 'Stripe/RenewSubscription', {
        method: 'POST',
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
    const retValue = await response.text();

    return retValue;
  } catch (error) {
    Notify.create({
      message: 'Renewal failed. Please try again or contact us for assistance.',
      color: 'negative',
      position: 'top'
    });
    throw error
  }
}


