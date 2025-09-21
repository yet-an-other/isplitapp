import { Button, Chip, Divider, Link, Switch, Badge } from "@heroui/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { EditIcon, PlusIcon, ReimbursementIcon, SpendIcon, PaperclipIcon } from "../icons";
import ImageModal from "../controls/ImageModal";
import useSWR from "swr";
import { listExpenseAttachments } from "../api/expenseApi";
import { useState } from "react";
import { usePartySetting } from "../utils/partySetting";
import { intlFormatDistance, format } from "date-fns";
import { useTranslation } from "react-i18next";


export function ExpenseList() {

    const navigate = useNavigate();
    const { party: group } = useOutletContext<{ party: PartyInfo, primaryParticipantId: string | null }>();
    const { t } = useTranslation();
    const { isShowRefund, setIsShowRefund } = usePartySetting(group.id);
    const { lastViewed, setLastViewed } = usePartySetting(group.id);
    const [ lastViewedTmp ] = useState(lastViewed);

    const { data: expenses, error, isLoading } = useSWR<ExpenseInfo[], ProblemError>(
        `/parties/${group.id}/expenses`,
        fetcher,
        {
            onSuccess: (data: ExpenseInfo[]) => {
                if (data && data.length > 0) {
                    const lastExpense = data
                        .reduce((acc: ExpenseInfo, cur: ExpenseInfo) => acc.updateTimestamp > cur.updateTimestamp ? acc : cur)
                        .updateTimestamp;
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
                    />
                </div>
                <div className="text-xs text-dimmed mr-1 pt-1">{ isShowRefund ? t('expenseList.refundsToggle.hide') : t('expenseList.refundsToggle.show') } {t('expenseList.refundsToggle.label')}</div>
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
    const { t } = useTranslation();
    return (
        <div className="mt-16 text-dimmed bg-primary-50 p-2 rounded-lg">
            {t('expenseList.emptyState.message')}  <br/>
            {t('expenseList.emptyState.startWith')} <Link href={`/${groupId}/expenses/create`} >{t('expenseList.emptyState.addLink')}</Link> {t('expenseList.emptyState.theFirstExpense')} 
        </div>
    )
}


/**
 * Display the expense list
 */
const FullList = ({ group, expenses, lastViewed, isShowReimbursement }: 
    { group: PartyInfo, expenses: ExpenseInfo[], lastViewed: string, isShowReimbursement: boolean }) => {

    const { t } = useTranslation();
    const { primaryParticipantId } = usePartySetting(group.id);

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

    const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);
    // Lazy fetch attachments when modal open
    const shouldFetch = !!openExpenseId;
    const { data: attachmentInfos, isLoading: attachmentsLoading } = useSWR(
        shouldFetch ? ["attachments", openExpenseId] : null,
        () => listExpenseAttachments(openExpenseId!)
    );
    const mappedAttachments = (attachmentInfos || []).map(a => ({
        id: a.attachmentId,
        fileName: a.fileName ?? 'receipt',
        url: a.url,
        sizeBytes: a.sizeBytes,
        type: 'server' as const
    }));
    const handleOpenAttachments = (expenseId: string) => {
        setOpenExpenseId(expenseId);
    };
    const handleKeyOpen: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const id = (e.currentTarget as HTMLDivElement).dataset.expenseId;
            if (id) handleOpenAttachments(id);
        }
    };
    const handleCloseModal = () => {
        setOpenExpenseId(null);
    };

    return (
        <div className="border-1 rounded-lg p-2 mt-10">
            {expenses
                .filter(expense => !expense.isReimbursement || isShowReimbursement)
                .map((expense, i) => 
                <div 
                    key={expense.id} 
                    className="my-1 flex flex-col"
                >
                   {i > 0 && <Divider className="mt-1 mb-2" />}
                   {
                        borderIds.includes(expense.id) && 
                        <Chip
                            variant="light"
                            size="sm" 
                            className={`mx-auto ${i > 0 ? '-mt-[20px]' : '-mt-[24px]'} bg-white dark:bg-black text-dimmed`}>
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
                        <div className="text-md font-semibold flex items-center">
                            <span>{expense.title}</span>
                        </div>
                        <div className="flex items-center ml-auto gap-1">
                                {expense.attachmentCount > 0 && (
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        data-expense-id={expense.id}
                                        onKeyDown={handleKeyOpen}
                                        onClick={() => handleOpenAttachments(expense.id)}
                                        aria-label={t('expenseList.attachments.indicatorAria', { count: expense.attachmentCount })}
                                        className="flex items-center mt-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                                    >
                                        <Badge 
                                            content={expense.attachmentCount}
                                            color="primary"
                                            size="sm"
                                            variant="flat"
                                            placement="top-left"
                                            showOutline={false}
                                            className="mt-1"
                                        >
                                            <PaperclipIcon className="w-6 h-6 text-dimmed mt-2 mr-1" />
                                        </Badge>
                                    </div>
                                )}
                            <Button 
                            isIconOnly
                            variant="flat"
                            size="sm"
                            radius="sm"
                            color="primary"
                            className="bg-primary-50"
                            as="a" 
                            href={`/${group.id}/expenses/${expense.id}/edit`}
                        >
                            <EditIcon className="w-5 h-5 stroke-2"/>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-row mt-1">
                        <div className="flex flex-col w-full ml-7 -mt-1">
                            <div>
                                <span className="text-sm">{t('expenseList.labels.paidBy')} </span>
                                <span className={`text-xs ${expense.lenderId === primaryParticipantId ? 'text-primary' : 'text-dimmed'}`}>{expense.lenderName}</span>
                            </div>
                            <div className="-mt-1">
                                <span className="text-sm">{expense.isReimbursement ? t('expenseList.labels.to') : t('expenseList.labels.for')} </span>
                                <span className="text-xs text-dimmed whitespace-normal">
                                    {expense.borrowers.map((b, index) => (
                                        <span key={b.participantId}>
                                            <span className={b.participantId === primaryParticipantId ? 'text-primary' : ''}>
                                                {b.participantName}
                                            </span>
                                            <>{index < expense.borrowers.length - 1 ? ', ' : ''}</> 
                                        </span>
                                    ))}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-row">
                            <div className="text-md font-bold font-mono">{expense.amount.toFixed(2)}</div>
                            &nbsp;
                            <div className="text-md text-dimmed">{group.currency}</div>
                        </div>
                    </div>
                    <div className="flex flex-row justify-between items-center mt-1">
                        <div className="flex items-center ml-7 mb-1">
                            {primaryParticipantId && (() => {
                                const primaryBorrower = expense.borrowers.find(b => b.participantId === primaryParticipantId);
                                const isPrimaryLender = expense.lenderId === primaryParticipantId;
                                
                                if (isPrimaryLender && primaryBorrower) {
                                    // Primary participant lent the full amount but also borrowed their share
                                    const netAmount = expense.amount - primaryBorrower.amount;
                                    if (netAmount > 0) {
                                        return (
                                            <div className="text-xs text-dimmed">
                                                {t('expenseList.labels.youLent')} <span className="text-success-600 font-mono">{netAmount.toFixed(2)}</span> {group.currency}
                                            </div>
                                        );
                                    }
                                } else if (primaryBorrower) {
                                    // Primary participant only borrowed
                                    return (
                                        <div className="text-xs text-dimmed">
                                            {t('expenseList.labels.youOwe')} <span className="text-danger-600 font-mono">{primaryBorrower.amount.toFixed(2)}</span> {group.currency}
                                        </div>
                                    );
                                } else if (isPrimaryLender) {
                                    // Primary participant only lent (not included in borrowers)
                                    return (
                                        <div className="text-xs text-dimmed">
                                            {t('expenseList.labels.youLent')} <span className="text-success-600 font-mono">{expense.amount.toFixed(2)}</span> {group.currency}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="flex items-center mt-1">
                            <div className={`h-2 w-2 mr-1 rounded-full ${expense.updateTimestamp > lastViewed ? 'bg-primary' : 'bg-transparent'}`}  />
                            <div className="flex text-xs text-dimmed ">{format(expense.date, "eee dd LLL yyyy")}</div>
                        </div>
                    </div>
                </div>
            )}
            <ImageModal
                isOpen={!!openExpenseId}
                onClose={handleCloseModal}
                attachments={mappedAttachments}
                isLoading={attachmentsLoading}
            />
        </div>
    )
}