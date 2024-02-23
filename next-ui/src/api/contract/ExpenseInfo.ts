import { BorrowerInfo } from "./BorrowerInfo"
import { SplitMode } from "./SplitMode"

export class ExpenseInfo {

    id: string = ""
    
    title: string = "" 
    
    amount: number = 0

    date: Date = new Date()

    lenderId: string = ""
    
    lenderName: string = ""
    
    isReimbursement: boolean = false

    splitMode: SplitMode = "Evenly"
    
    borrowers: BorrowerInfo[] = [];
}