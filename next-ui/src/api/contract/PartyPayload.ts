import { ParticipantPayload, ParticipantPayloadSchema } from "./ParticipantPayload";
import { z } from "zod";

export class PartyPayload {

    name = "";

    description: string | null = "";

    currency = "";

    participants: ParticipantPayload[] = [];
}

export const PartyPayloadSchema = z.object({
    name: z.string().min(1, { message: "Must be not empty" }),
    description: z.string().max(500, { message: "Must be 500 characters or less" }).optional(),
    currency: z.string().min(1, { message: "Must be not empty" }),
    participants: z.array(ParticipantPayloadSchema).nonempty({ message: "Must have at least one participant" }),
});
