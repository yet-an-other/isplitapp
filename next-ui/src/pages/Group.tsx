import useSWR from "swr";
import { GroupCard } from "../controls/GroupCard";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { Outlet, useMatches, useNavigate, useParams } from "react-router-dom";
import { Button, ButtonGroup } from "@heroui/react";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { useTranslation } from "react-i18next";
import { usePartySetting } from "../utils/partySetting";
import { useDeviceSetting } from "../utils/deviceSetting";

export function Group() {    
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { t } = useTranslation();
    const { enableActivityLog } = useDeviceSetting();
    
    // Load fresh data from localStorage
    const currentSettings = usePartySetting(groupId || '');
    const primaryParticipantId = currentSettings.primaryParticipantId;

    const partyUrl = groupId 
        ? `/parties/${groupId}${primaryParticipantId ? `?ppId=${primaryParticipantId}` : ''}`
        : null;
    const { data: party, isLoading, error} = 
        useSWR<PartyInfo, ProblemError>(partyUrl, fetcher);
    
    const matches = useMatches();
    const current = matches
        .filter((match) => Boolean(match.handle))
        .map((match) => match.handle)[0] as keyof typeof items;

    const baseItems = {
        expenses: t('group.tabs.expenses'), 
        balance: t('group.tabs.balance'), 
    };
    
    const items = enableActivityLog 
        ? { ...baseItems, activity: t('group.tabs.activity') }
        : baseItems;
    
    const itemsDesc = {
        expenses: t('group.tabs.descriptions.expenses'), 
        balance: t('group.tabs.descriptions.balance'), 
        activity: t('group.tabs.descriptions.activity'),
        edit: t('group.tabs.descriptions.edit')
    };

    const itemKeys = Object.keys(items) as (keyof typeof items)[];

    return (

        <div className="w-full px-4">
            { error && <ErrorCard error={error}/>}
            { isLoading && <CardSkeleton />}
            { !error && !isLoading && !!party && 
                <div>
                    <GroupCard party={party} disablePress />
                    <div className="mt-3">
                        <div className="flex flex-row">
                            <h1 className="text-2xl">{items[current]}</h1>
                            <ButtonGroup
                                className="ml-auto"
                                size="sm"
                                variant="flat"
                                color="primary"
                            >
                                {itemKeys.map((key) => (
                                    <Button 
                                        key={key}
                                        isDisabled={key === current} 
                                        onPress={() => void navigate(`/${groupId}/${key}`)}
                                    >
                                        {items[key]}
                                    </Button>
                                ))}
                                
                            </ButtonGroup>
                        </div>
                        <div className="flex flex-row justify-between text-dimmed text-sm mt-1">
                            {itemsDesc[current]}
                        </div>
                    </div>

                    <Outlet context={{ party, primaryParticipantId }} />
                </div>
            }
        </div>
    )
}