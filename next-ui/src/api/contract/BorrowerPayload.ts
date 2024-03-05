import { z } from "zod";

export class BorrowerPayload {
    participantId = ""

    amount = 0;

    share = 0;

    percent = 0;
}

export const BorrowerPayloadSchema = z.object({
    participantId: z.string().min(1, { message: "Must be not empty" }),
    amount: z.number(),
    share: z.number().int(),
    percent: z.number().int()
})