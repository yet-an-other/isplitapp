import { BorrowerInfo } from "./BorrowerInfo"

export class ExpenseInfo {

    id: string = ""
    
    title: string = "" 
    
    amount: number = 0

    date: Date = new Date()

    lenderId: string = ""
    
    lenderName: string = ""
    
    isReimbursement: boolean = false
    
    borrowers: BorrowerInfo[] = [];
}