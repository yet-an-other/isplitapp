import { BorrowerPayload } from "./BorrowerPayload"
import { SplitMode } from "./SplitMode"

export class ExpensePayload {
    
    title: string = "" 
    
    amount: number = 0

    date: Date = new Date()

    lenderId: string = ""
    
    isReimbursement: boolean = false

    splitMode: SplitMode = "Evenly"
    
    borrowers: BorrowerPayload[] = [];

}