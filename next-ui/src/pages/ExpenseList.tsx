import { Button, Chip, Divider, Link, Switch } from "@heroui/react";
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
import { usePartySetting } from "../utils/partySetting";
import { intlFormatDistance, format } from "date-fns";


export function ExpenseList() {

    const navigate = useNavigate();
    const group = useOutletContext<PartyInfo>();
    const { isShowRefund, setIsShowRefund } = usePartySetting(group.id);
    const { lastViewed, setLastViewed } = usePartySetting(group.id);
    const [ lastViewedTmp ] = useState(lastViewed);

    const { data: expenses, error, isLoading } = useSWR<ExpenseInfo[], ProblemError>(
        `/parties/${group.id}/expenses`, 
        fetcher, 
        {
            onSuccess: (data) => {
                if (data && data.length > 0) {
                    const lastExpense = data.reduce((acc, cur) => acc.updateTimestamp > cur.updateTimestamp ? acc : cur).updateTimestamp;
                    setLastViewed(lastExpense);
                }
            }
        }
    );

  return (
    <div className="w-full">
        <div className="flex w-full my-2 relative justify-center">
            <Button 
                isIconOnly
                size="lg" 
                variant="shadow"
                color="primary" 
                className="self-center rounded-full" 
                onPress={() => navigate(`/${group.id}/expenses/create`)} 
            >
                <PlusIcon className="h-7 w-7 stroke-[3px]" />
            </Button>
            <div className="flex flex-col self-end absolute right-0">
                <div className="flex justify-end">
                    <Switch
                        isSelected={isShowRefund}
                        onValueChange={setIsShowRefund}
                        size="md"
                        color="primary"
                        className="-mr-1"
                    />
                </div>
                <div className="text-xs text-dimmed mr-1">{ isShowRefund ? "Hide" : "Show" } Refunds</div>
            </div>
        </div>
        { error && <ErrorCard error={error}/>}
        { isLoading && <CardSkeleton/> }
        { !error && !isLoading && (!expenses || expenses.length === 0) && <EmptyList groupId={group.id}/> }
        { !error && !isLoading && !!expenses && expenses.length > 0 && 
            <FullList group={group} expenses={expenses} lastViewed={lastViewedTmp} isShowReimbursement={isShowRefund} /> 
        }
    </div>
  );
}

/**
 * Display the empty list message
 */
const EmptyList = ({groupId} : {groupId: string}) => {
    return (
        <div className="mt-16 text-dimmed bg-primary-50 p-2 rounded-lg">
            It seems you have not added any expense yet...  <br/>
            Start with <Link href={`/${groupId}/expenses/create`} >add</Link> the first expense. 
        </div>
    )
}



/**
 * Display the expense list
 */
const FullList = ({ group, expenses, lastViewed, isShowReimbursement }: 
    { group: PartyInfo, expenses: ExpenseInfo[], lastViewed: string, isShowReimbursement: boolean }) => {

    let lastBorder = "";
    const borderIds: string[] = [];
    expenses
        .filter(expense => !expense.isReimbursement || isShowReimbursement)
        .forEach(
            expense => {
                const borderValue = intlFormatDistance(expense.date, Date.now());
                if (borderValue !== lastBorder) {
                    borderIds.push(expense.id);
                    lastBorder = borderValue;
                }
            }
        );

    return (
        <div className="border-1 rounded-lg p-2 mt-10">
            {expenses
                .filter(expense => !expense.isReimbursement || isShowReimbursement)
                .map((expense, i) => 
                <div 
                    key={expense.id} 
                    className="my-1 flex flex-col"
                >
                   {i > 0 && <Divider className="my-1 mb-2" />}
                   {
                        borderIds.includes(expense.id) && 
                        <Chip
                            variant="bordered"
                            size="sm" 
                            className={`ml-auto mr-auto ${i > 0 ? '-mt-[20px]' : '-mt-[24px]'} bg-white dark:bg-black text-dimmed`}>
                            {intlFormatDistance(expense.date, Date.now())}
                        </Chip>
                    }

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

                    <div className="flex flex-row mt-1">
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
                        <div className="flex text-xs text-dimmed ">{format(expense.date, "eee dd LLL yyyy")}</div>
                    </div>
                </div>
            )}
        </div>
    )
}