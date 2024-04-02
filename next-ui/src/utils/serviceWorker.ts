export type {};
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core'
import { NotificationMessage, CustomData } from './swTypes';


// Register precache routes (static cache)
//
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old cache
//
cleanupOutdatedCaches();

// Receive push notifications
//
self.addEventListener('push', function (e) {
    if (!Notification.permission || Notification.permission !== 'granted') {
        return;
    }

    if (e.data) {
        const message = e.data.json() as NotificationMessage;

        e.waitUntil(self.registration.showNotification(
            message.title, 
            {
                body: message.body,
                data: message.data,
            } 
        ));
    }
});

// Click and open notification
//
self.addEventListener(
    'notificationclick', 
    function(event) {
        event.notification.close();
        const customData = event.notification.data as CustomData;
        const url = (customData?.partyId)
            ? `/${customData.partyId}/expenses`
            : '/';
        self.clients.openWindow(url)
            .catch(e => console.error(e)); // Open link from action
    }, 
    false
);

self.skipWaiting().catch(e => console.error(e));
clientsClaim()
