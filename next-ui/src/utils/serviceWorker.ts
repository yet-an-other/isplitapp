/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
export type {};
declare const self: ServiceWorkerGlobalScope;


import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';




// Register precache routes (static cache)
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old cache
cleanupOutdatedCaches();



// Receive push notifications
self.addEventListener('push', function (e) {
    if (e.data) {
        const message = e.data.json() as Message;
        e.waitUntil(self.registration.showNotification(
            message.title, {
                body: message.body,
                icon: message.icon,
                actions: message.actions
            }
        ));
    }
});

// Click and open notification
self.addEventListener(
    'notificationclick', 
    function(event) {
        event.notification.close();
        self.clients.openWindow(event.action)
            .catch(e => console.error(e)); // Open link from action
    }, 
    false
);

class Message {
    title = '';
    body = '';
    icon = '';
    actions: NotificationAction[] = [];
}