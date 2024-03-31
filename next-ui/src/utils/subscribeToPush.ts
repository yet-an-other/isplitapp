import { IosSubscriptionPayload } from "../api/contract/IosSubscriptionPayload";
import { deleteSubscription, registerSubscription } from "../api/expenseApi";
const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;


// eslint-disable-next-line @typescript-eslint/require-await
export async function subscribeIos(fcmToken: string) {
    try {
        await registerSubscription({ isIos: true, deviceFcmToken: fcmToken } as IosSubscriptionPayload);
        return true;
    }
    catch (err) {
        console.error("Error", err);
        return false;
    }
}

export async function subscribeToPush() {
    try {
        if (!publicKey) 
            throw new Error("VAPID public key is missing");

        const serviceWorkerRegistration = await navigator.serviceWorker.ready;

        // Check if the user has an existing subscription
        //
        let pushSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
        if (!pushSubscription) {
            pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
        }
        await registerSubscription(pushSubscription);
        
    } catch (err) {

        // The subscription wasn't successful.
        //
        console.error("Error", err);
        return false;
    }

    return true;
  }

  export async function getSubscription() {
    try {
        const serviceWorkerRegistration = await navigator.serviceWorker.ready;
        return await serviceWorkerRegistration.pushManager.getSubscription();
    } catch (err) {
        console.error("Error", err);
        return null;
    }
  }

  export async function unregisterSubscription() {
    try {
        const subscription = await getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            await deleteSubscription();
        }
    } catch (err) {
        console.error("Error", err);
    }
  }
  
  // Utility function for browser interoperability
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }