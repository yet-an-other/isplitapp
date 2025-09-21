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

    updateTimestamp = "zzzzzzz"
    
    borrowers: BorrowerInfo[] = [];

    // Number of attachments (receipt images) associated with the expense
    attachmentCount = 0;
}