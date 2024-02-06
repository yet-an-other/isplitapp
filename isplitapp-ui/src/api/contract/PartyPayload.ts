import { ParticipantPayload } from "./ParticipantPayload";

export class PartyPayload {

    name: string = "";

    currency: string = "";

    participants: ParticipantPayload[] = [];
}