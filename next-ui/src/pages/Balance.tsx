import { useOutletContext } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import useSWR from "swr";
import { fetcher } from "../api/expenseApi";
import { BalanceEntry } from "../api/contract/BalanceEntry";
import { ProblemError } from "../api/contract/ProblemError";
import { BalanceInfo } from "../api/contract/BalanceInfo";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { ReimburseEntry } from "../api/contract/ReimburseEntry";

export function Balance(){

    const group = useOutletContext<PartyInfo>();

    const {data: balanceInfo, error, isLoading } = useSWR<BalanceInfo, ProblemError>(`/parties/${group.id}/balance`, fetcher);
        
    if (error)
        return <ErrorCard error={error} />;

    if (isLoading)
        return <CardSkeleton />;

    if (balanceInfo) {
        return (
            <>
                <div className="mt-6">
                    <BalanceChart balances={balanceInfo.balances} party={group}/>
                </div>
                <div>
                    <div className="mt-6 text-xl">Suggested Reimbursements</div>
                    <div className="text-sm text-dimmed">Here are some tips to make sure everyone gets their fair share back</div>
                    <ReimbursementList reimbursements={balanceInfo.reimbursements} party={group}/>
                </div>
            </>
        )
    }

    return null;
}

function BalanceChart(props: {balances: BalanceEntry[], party: PartyInfo}) {

    const maxBalance = Math.max(...Object.values(props.balances).map(b=>Math.abs(b.amount)));

    return(
        <div className="w-full flex flex-col">
            {props.balances.map( balance => {
                const isPositive = balance.amount > 0;
                return(
                    <div 
                        key={balance.participantId}
                        className={`w-full h-18 flex bg-transparent items-center justify-center ${isPositive ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                        <div className={`w-1/2 px-1 my-1 flex ${isPositive ? 'justify-end' : 'justify-start'}`}>
                            <div className="text-sm font-bold ">
                                {balance.participantName}
                            </div>
                        </div>
                        <div className={`w-1/2 px-1 my-1 flex ${isPositive ? 'justify-start' : 'justify-end'}`}>
                            <div 
                                className={`h-7 ${isPositive ? 'bg-green-100' : 'bg-red-100'} ${isPositive ? 'rounded-r-md' : 'rounded-l-md'}`} 
                                style={{width: `${(Math.abs(balance.amount) / maxBalance) * 100}%`}}
                            />
                            <div className="absolute text-sm self-center px-1">
                                <span className={`font-mono font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{balance.amount.toFixed(2)} </span>
                                <span className="text-dimmed">{props.party.currency}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}


function ReimbursementList(props: {reimbursements: ReimburseEntry[], party: PartyInfo}) {
    return (
        <div></div>
    )
}