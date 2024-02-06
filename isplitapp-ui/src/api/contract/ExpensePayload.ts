import { BorrowerPayload } from "./BorrowerPayload"

export class ExpensePayload {
    
    title: string = "" 
    
    amount: number = 0

    date: Date = new Date()

    lenderId: string = ""
    
    isReimbursement: boolean = false
    
    borrowers: BorrowerPayload[] = [];

}