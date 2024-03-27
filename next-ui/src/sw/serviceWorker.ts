/// <reference lib="webworker" />
// export default null;
//declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { Message } from './Message';


precacheAndRoute((self as unknown as ServiceWorkerGlobalScope).__WB_MANIFEST || []);

(function (self: ServiceWorkerGlobalScope) {

    // Register precache routes (static cache)
    // precacheAndRoute(self.__WB_MANIFEST || []);

    // Clean up old cache
    cleanupOutdatedCaches();

    // Receive push notifications
    self.addEventListener('push', function (e) {
        if (!Notification.permission || Notification.permission !== 'granted') {
            return;
        }

        if (e.data) {
            const message = e.data.json() as Message;
            e.waitUntil(this.registration.showNotification(
                message.title, {
                    body: message.body,
                    icon: message.icon,
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
            this.clients.openWindow(event.action)
                .catch(e => console.error(e)); // Open link from action
        }, 
        false
    );

}).call(self as unknown as ServiceWorkerGlobalScope, self as unknown as ServiceWorkerGlobalScope);