import { Button, Link, Listbox, ListboxItem } from "@nextui-org/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import useSWR from "swr";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { PlusIcon, ReimbursementIcon, SpendIcon } from "../icons";

export function ExpenseList() {
  
    const group = useOutletContext<PartyInfo>();
    const { data: expenses, error, isLoading } = useSWR<ExpenseInfo[], ProblemError>(`/parties/${group.id}/expenses`, fetcher);
    const navigate = useNavigate();

  return (
    <div className="mt-4 w-full">

        <div className="flex w-full">
            <Button 
                isIconOnly
                size="sm" 
                variant="solid"
                color="primary" 
                className="ml-auto my-2" 
                onPress={() => navigate(`/groups/${group.id}/expenses/create`)} 
            >
                <PlusIcon className="h-7 w-7 stroke-[3px]" />
            </Button>
        </div>
        { error && <ErrorCard error={error}/>}
        { isLoading && <CardSkeleton/> }
        { !error && !isLoading && (!expenses || expenses.length === 0) && <EmptyList groupId={group.id}/> }
        { !error && !isLoading && !!expenses && expenses.length > 0 && <FullList group={group} expenses={expenses}/> }
    </div>
  );
}

/**
 * EmptyList component is used to display the empty list message
 */
const EmptyList = ({groupId} : {groupId: string}) => {
    return (
        <div className="absolute text-dimmed top-[60%]">
            It seems you have not added any expense yet... 
            Start with <Link href={`/groups/${groupId}/expenses/create`} >add</Link> the first expense. 
        </div>
    )
}

const FullList = ({group, expenses} : {group: PartyInfo, expenses: ExpenseInfo[]}) => {
    return (
        <Listbox label="expenses" className="p-0">
            {expenses.map(expense => 
                <ListboxItem 
                    key={expense.id} 
                    className="border-1 my-1"
                    textValue={expense.title}
                    href={`/groups/${group.id}/expenses/${expense.id}/edit`}
                >
                    <div className="flex flex-row items-center">
                        {expense.isReimbursement 
                            ? <ReimbursementIcon className="h-5 w-5 stroke-[1px] text-success mr-2" /> 
                            : <SpendIcon className="h-5 w-5 stroke-[1px] text-dimmed mr-2" />
                        }
                        <div className="text-md font-semibold">{expense.title}</div>
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
                    <div className="flex text-xs text-dimmed justify-end">{new Date(expense.date).toDateString()}</div>
                </ListboxItem>
            )}
        </Listbox>
    )
}