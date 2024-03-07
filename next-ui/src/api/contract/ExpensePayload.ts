import { z } from "zod"
import { BorrowerPayload, BorrowerPayloadSchema } from "./BorrowerPayload"
import { SplitMode } from "./SplitMode"

export class ExpensePayload {
    
    title = "" 
    
    amount = 0

    date: Date = new Date()

    lenderId = ""
    
    isReimbursement = false

    splitMode: SplitMode = "Evenly"
    
    borrowers: BorrowerPayload[] = [];
}

export const ExpensePayloadSchema = z.object({
    title: z.string().min(1, { message: "Must be not empty" }),
    amount: z.number().min(0.01, { message: "Must be greater than 0" }),
    date: z.date(),
    lenderId: z.string().min(1, { message: "Must be not empty" }),
    isReimbursement: z.boolean(),
    splitMode: z.union([z.literal("Evenly"), z.literal("ByShare"), z.literal("ByPercentage"), z.literal("ByAmount")]),
    borrowers: z.array(BorrowerPayloadSchema)
        .nonempty({ message: "Must have at least one borrower" })
}).superRefine((data, ctx) => {
    if (data.splitMode === "ByPercentage" &&
        data.borrowers.reduce((acc, borrower) => acc + borrower.percent, 0) !== 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["borrowers"],
                message: "Total percent should be equal to 100",
              });
    }
    if (data.splitMode === "ByAmount" &&
        data.borrowers.reduce((acc, borrower) => acc + borrower.amount, 0) !== data.amount) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["borrowers"],
                message: "Total amount should be equal to the sum of all borrower amounts",
            });
    }
})