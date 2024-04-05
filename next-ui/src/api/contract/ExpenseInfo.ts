import { BorrowerInfo } from "./BorrowerInfo"
import { SplitMode } from "./SplitMode"

export class ExpenseInfo {

    id = ""
    
    title = "" 
    
    amount = 0

    date: Date = new Date()

    lenderId = ""
    
    lenderName = ""
    
    isReimbursement = false

    splitMode: SplitMode = "Evenly"

    updateTimestamp = "zzzzzzzzz"
    
    borrowers: BorrowerInfo[] = [];
}