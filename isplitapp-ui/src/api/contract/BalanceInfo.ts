import { BalanceEntry } from "./BalanceEntry";
import { ReimburseEntry } from "./ReimburseEntry";

export class BalanceInfo {
    balances: BalanceEntry[] = []
    reimbursements: ReimburseEntry[] = []
}