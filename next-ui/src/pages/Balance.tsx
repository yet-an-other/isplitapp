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
import { Button, Link } from "@heroui/react";
import { SendMoneyIcon } from "../icons";
import { useTranslation } from "react-i18next";

export function Balance(){

    const { party: group, primaryParticipantId } = useOutletContext<{ party: PartyInfo, primaryParticipantId: string | null }>();
    const {data: balanceInfo, error, isLoading } = useSWR<BalanceInfo, ProblemError>(`/parties/${group.id}/balance`, fetcher);

    if (error)
        return <ErrorCard error={error} />;

    if (isLoading)
        return <CardSkeleton />;

    if (balanceInfo) {
        return (
            <div className="mt-6">
                <BalanceChart balances={balanceInfo.balances} party={group} primaryParticipantId={primaryParticipantId}/>
                <ReimbursementList reimbursements={balanceInfo.reimbursements} party={group} primaryParticipantId={primaryParticipantId}/>
            </div>
        )
    }
    return null;
}

function BalanceChart({balances, party, primaryParticipantId}: {balances: BalanceEntry[], party: PartyInfo, primaryParticipantId: string | null}) {
    const { t } = useTranslation();

    if (party.outstandingBalance === 0) {
        return (
            <div className="mt-28 text-dimmed p-2 rounded-lg bg-primary-50">
                {t('balance.allSettled.title')} <br/> 
                {t('balance.allSettled.description')} <Link href={`/${party.id}/expenses/create`}>{t('balance.allSettled.addLink')}</Link> {t('balance.allSettled.expensesHere')}
            </div>
        )
    }
    const maxBalance = Math.max(...Object.values(balances).map(b => Math.abs(b.amount)));

    return(
        <div className="w-full flex flex-col">
            {balances
                //.filter(b => b.amount != 0)
                .map( balance => {
                const isPositive = balance.amount >= 0;
                const isPrimaryParticipant = balance.participantId === primaryParticipantId;
                return(
                    <div 
                        key={balance.participantId}
                        className={`w-full h-10 flex bg-transparent items-center justify-center ${isPositive ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                        <div className={`w-1/2 px-1 flex ${isPositive ? 'justify-end' : 'justify-start'}`}>
                            <div className={`text-sm font-bold ${isPrimaryParticipant ? 'text-primary' : ''}`}>
                                {balance.participantName}
                            </div>
                        </div>
                        <div className={`w-1/2 px-1 flex ${isPositive ? 'justify-start' : 'justify-end'}`}>
                            <div 
                                className={`h-7 ${isPositive ? 'bg-green-100' : 'bg-red-100'} ${isPositive ? 'rounded-r-md' : 'rounded-l-md'}`} 
                                style={{width: `${(Math.abs(balance.amount) / maxBalance) * 100}%`}}
                            />
                            <div className="absolute text-sm self-center px-1">
                                <span className={`font-mono font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {balance.amount.toFixed(2)}
                                </span>
                                <span className="text-dimmed">&nbsp;{party.currency}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}


function ReimbursementList({reimbursements, party, primaryParticipantId}: {reimbursements: ReimburseEntry[], party: PartyInfo, primaryParticipantId: string | null}) {
    const { t } = useTranslation();

    if (reimbursements.length === 0) 
        return null;

    return (
        <div className="mt-10">
            <div className=" text-2xl">{t('balance.reimbursements.title')}</div>
            <div className="text-sm text-dimmed mb-4">{t('balance.reimbursements.subtitle')}</div>
            <div className="border-1 p-2 rounded-lg ">
            {reimbursements.map((reimburse, i) =>{
                const isFromPrimary = reimburse.fromId === primaryParticipantId;
                const isToPrimary = reimburse.toId === primaryParticipantId;
                return (
                <div key={reimburse.fromId + reimburse.toId} className={`flex flex-row py-3 ${i > 0 && 'border-t-1'}`}>
                    <div>
                        <div>
                            <span className={`font-bold ${isFromPrimary ? 'text-primary' : ''}`}>{reimburse.fromName}</span>
                            <span className="text-dimmed"> {t('balance.reimbursements.owes')} </span>
                            <span className={`font-bold ${isToPrimary ? 'text-primary' : ''}`}>{reimburse.toName}</span>
                        </div>
                        <div className="flex flex-row items-end mt-1">
                            <Button 
                                isIconOnly 
                                variant="flat"
                                color="primary"
                                radius="sm" 
                                className="float-right bg-primary-50"
                                as="a"
                                href={
                                    `/${party.id}/expenses/create?title=Reimbursement&amount=${reimburse.amount}&lenderId=${reimburse.fromId}&borrowerId=${reimburse.toId}&isReimbursement=1`
                                }
                            >
                                <SendMoneyIcon className="w-6 h-6" />
                            </Button>
                            <div className="text-dimmed text-xs ml-2" dangerouslySetInnerHTML={{ __html: t('balance.reimbursements.addReimbursement') }}></div>
                        </div>
                    </div>

                    <div className="flex flex-row ml-auto">
                        <span className="text-md font-bold font-mono">{reimburse.amount.toFixed(2)}</span>
                        &nbsp;
                        <span className="text-md text-dimmed">{party.currency}</span>
                    </div>
                </div>
                );
            })}
            </div>
        </div>
    )
}