/**
 * Activity data in response from the backend API
 */
export interface ActivityInfo {
    /** Unique activity id */
    id: string;
    
    /** Type of activity (e.g., "ExpenseAdded", "GroupUpdated", "ParticipantAdded") */
    activityType: string;
    
    /** Human-readable description of what happened */
    description: string;
    
    /** When the activity occurred */
    created: Date;
    
    /** AUID timestamp for ordering and synchronization */
    timestamp: string;
    
    /** Optional ID of the entity affected by this activity (expense, participant, etc.) */
    entityId?: string;
    
    /** ID of the device that performed this activity */
    deviceId: string;
}