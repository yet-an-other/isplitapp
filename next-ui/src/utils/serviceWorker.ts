export type {};
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
//import { NotificationAction, NotificationOptions } from './swTypes';


// Register precache routes (static cache)
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old cache
cleanupOutdatedCaches();

// Receive push notifications
self.addEventListener('push', function (e) {
    console.log('Got event', e);
    if (!Notification.permission || Notification.permission !== 'granted') {
        return;
    }

    if (e.data) {
        const message = e.data.json() as Message;
        console.log('Got message', message);


        e.waitUntil(
            navigator.serviceWorker.ready
            .then(reg => reg.showNotification(message.title, {
                body: message.body,
                //icon: message.icon,
                //actions: message.actions
            }))
        );

        e.waitUntil(self.registration.showNotification(
            message.title, 
            {
                body: message.body,
                //icon: message.icon,
                //actions: message.actions
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
   // actions: NotificationAction[] = [];
}