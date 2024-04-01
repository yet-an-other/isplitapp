export interface NotificationAction {
    action: string;
    icon?: string;
    title: string;
}


export interface NotificationOptions {
    actions?: NotificationAction[];
    badge?: string;
    body?: string;
    data?: CustomData; 
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

export class NotificationMessage {
    title = '';
    body = '';
    data = {} as CustomData;
}

export class CustomData {
    partyId = '';
}