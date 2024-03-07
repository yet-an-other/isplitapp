import { z } from "zod";

export class ParticipantPayload {

    id = "";

    name = "";

    canDelete = false;
}

export const ParticipantPayloadSchema = z.object({
    name: z.string().min(1, { message: "Must be not empty" }),
});