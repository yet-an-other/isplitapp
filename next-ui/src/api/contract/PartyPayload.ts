import { ParticipantPayload, ParticipantPayloadSchema } from "./ParticipantPayload";
import { z } from "zod";

export class PartyPayload {

    name = "";

    currency = "";

    participants: ParticipantPayload[] = [];
}

export const PartyPayloadSchema = z.object({
    name: z.string().min(1, { message: "Must be not empty" }),
    currency: z.string().min(1, { message: "Must be not empty" }),
    participants: z.array(ParticipantPayloadSchema).nonempty({ message: "Must have at least one participant" }),
});
