/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ParticipantInfo } from "./ParticipantInfo";

/**
 *  Full information about the party
 */
export class PartyInfo {
    id: string = "";
    
    name: string = "";

    currency: string = "";
    
    created: Date = new Date();

    updated: Date = new Date();
    
    totalExpenses: number = 0;

    totalTransactions: number = 0;

    outstandingBalance: number = 0;

    totalParticipants: number = 0;
    
    participants: ParticipantInfo[] = [];

    isArchived: boolean = false;

    updateTimestamp = "zzzzzzzzz";
}

