import { Button, Divider, Link } from "@nextui-org/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import useSWR from "swr";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { EditIcon, PlusIcon, ReimbursementIcon, SpendIcon } from "../icons";
import { useState } from "react";


const lastViewedName = (group: PartyInfo) => `lv::${group.id}`;

export function ExpenseList() {

    const timestampMax = "zzzzzzzzz";
    const navigate = useNavigate();
    const group = useOutletContext<PartyInfo>();
    const  [lastViewed, setLastViewed] = useState(timestampMax);    
    const { data: expenses, error, isLoading } = useSWR<ExpenseInfo[], ProblemError>(
        `/parties/${group.id}/expenses`, 
        fetcher, 
        {
            onSuccess: (data) => {
                if (data && data.length > 0) {
                    if (lastViewed === timestampMax)
                        setLastViewed(localStorage.getItem(lastViewedName(group)) ?? timestampMax);
                    const lastExpense = data.reduce((acc, cur) => acc.updateTimestamp > cur.updateTimestamp ? acc : cur).updateTimestamp;
                    localStorage.setItem(lastViewedName(group), lastExpense)
                }
            }
        }
    );

  return (
    <div className="w-full">
        <div className="flex w-full">
            <Button 
                isIconOnly
                size="lg" 
                variant="shadow"
                color="primary" 
                className="ml-auto mr-auto my-2 rounded-full" 
                onPress={() => navigate(`/${group.id}/expenses/create`)} 
            >
                <PlusIcon className="h-7 w-7 stroke-[3px]" />
            </Button>
        </div>
        { error && <ErrorCard error={error}/>}
        { isLoading && <CardSkeleton/> }
        { !error && !isLoading && (!expenses || expenses.length === 0) && <EmptyList groupId={group.id}/> }
        { !error && !isLoading && !!expenses && expenses.length > 0 && <FullList group={group} expenses={expenses} lastViewed={lastViewed} /> }
    </div>
  );
}

/**
 * To display the empty list message
 */
const EmptyList = ({groupId} : {groupId: string}) => {
    return (
        <div className="mt-16 text-dimmed bg-primary-50 p-2 rounded-lg">
            It seems you have not added any expense yet...  <br/>
            Start with <Link href={`/${groupId}/expenses/create`} >add</Link> the first expense. 
        </div>
    )
}

const FullList = ({group, expenses, lastViewed }: {group: PartyInfo, expenses: ExpenseInfo[], lastViewed: string}) => {

    return (
        <div className="border-1 rounded-lg p-2">
            {expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense, i) => 
                <div 
                    key={expense.id} 
                    className="my-1"
                >
                   {i > 0 && <Divider className="my-1 mb-2"/>}
                    <div className="flex flex-row items-center">
                        <div className="min-w-7 ">
                            {expense.isReimbursement 
                                ? <ReimbursementIcon className="h-5 w-5 stroke-[1px] text-success mr-2" /> 
                                : <SpendIcon className="h-5 w-5 stroke-[1px] text-dimmed mr-2" />
                            }
                        </div>
                        <div className="text-md font-semibold">{expense.title}</div>
                        <Button 
                            isIconOnly
                            variant="flat"
                            size="sm"
                            radius="sm"
                            color="primary"
                            className="float-right ml-auto bg-primary-50"
                            as="a" 
                            href={`/${group.id}/expenses/${expense.id}/edit`}
                        >
                            <EditIcon className="w-5 h-5 stroke-2"/>
                        </Button>
                    </div>

                    <div className="flex flex-row mt-4">
                        <div className="flex flex-col w-full ml-7">
                            <div>
                                <span className="text-sm">Paid by </span>
                                <span className="text-xs text-dimmed">{expense.lenderName}</span>
                            </div>
                            <div>
                                <span className="text-sm">{expense.isReimbursement ? "to ": "for "}</span>
                                <span className="text-xs text-dimmed whitespace-normal">{expense.borrowers.map(b => b.participantName).join(", ")}</span>
                            </div>
                        </div>
                        <div className="flex flex-row">
                            <div className="text-md font-bold font-mono">{expense.amount.toFixed(2)}</div>
                            &nbsp;
                            <div className="text-md text-dimmed">{group.currency}</div>
                        </div>
                    </div>
                    <div className="flex flex-row justify-end items-center">
                        <div className={`h-2 w-2 mr-1 rounded-full ${expense.updateTimestamp > lastViewed ? 'bg-primary' : 'bg-transparent'}`}  />
                        <div className="flex text-xs text-dimmed ">{new Date(expense.date).toDateString()}</div>
                    </div>
                </div>
            )}
        </div>
    )
}