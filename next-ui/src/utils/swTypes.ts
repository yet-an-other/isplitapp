export interface NotificationAction {
    action: string;
    icon?: string;
    title: string;
}


export interface NotificationOptions {
    actions?: NotificationAction[];
    badge?: string;
    body?: string;
    data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    dir?: NotificationDirection;
    icon?: string;
    image?: string;
    lang?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    silent?: boolean | null;
    tag?: string;
    timestamp?: EpochTimeStamp;
    vibrate?: VibratePattern;
}