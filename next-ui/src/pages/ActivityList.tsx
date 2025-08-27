import { useOutletContext } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import useSWR from "swr";
import { fetcher } from "../api/expenseApi";
import { ActivityInfo } from "../api/contract/ActivityInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { TransactionsIcon, SpendIcon, UsersIcon, EditIcon } from "../icons";
import { Divider, Chip } from "@heroui/react";
import { intlFormatDistance, format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useDeviceSetting } from "../utils/deviceSetting";
import { ensureDeviceId } from "../api/userApi";
import { useEffect, useState } from "react";

export function ActivityList() {
    const { party: group } = useOutletContext<{ party: PartyInfo, primaryParticipantId: string | null }>();
    const { enableActivityLog } = useDeviceSetting();
    const { data: activities, error, isLoading } = useSWR<ActivityInfo[], ProblemError>(
        enableActivityLog ? `/parties/${group.id}/activities` : null, 
        fetcher
    );
    const { t } = useTranslation();

    if (!enableActivityLog) {
        return (
            <div className="mt-16 text-center text-dimmed bg-primary-50 p-2 rounded-lg">
                {t('activityLog.disabled')}
            </div>
        );
    }

    if (error) {
        return <ErrorCard error={error} />;
    }

    if (isLoading) {
        return <CardSkeleton />;
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="mt-16 text-center text-dimmed bg-primary-50 p-2 rounded-lg">
                {t('activityLog.emptyState')}
            </div>
        );
    }

    return (
        <div className="mt-6">
            <ActivityListContent activities={activities} />
        </div>
    );
}

function ActivityListContent({ activities }: { activities: ActivityInfo[] }) {
    
    let lastDateGroup = "";
    const dateGroupIds: string[] = [];
    activities.forEach(activity => {
        const dateGroup = format(activity.created, 'yyyy-MM-dd');
        if (dateGroup !== lastDateGroup) {
            dateGroupIds.push(activity.id);
            lastDateGroup = dateGroup;
        }
    });

    const [deviceId, setDeviceId] = useState<string>('');

    useEffect(() => {
        ensureDeviceId().then(id => setDeviceId(id));
    }, []);



    return (
        <div className="border-1 rounded-lg p-2">
            {activities.map((activity, i) => (
                <div 
                    key={activity.id} 
                    className="my-1 flex flex-col"
                    data-testid={`activity-item-${activity.id}`}
                >
                    {i > 0 && <Divider className="mt-1 mb-2" />}
                    {dateGroupIds.includes(activity.id) && (
                        <Chip
                            variant="light"
                            size="sm" 
                            className={`mx-auto ${i > 0 ? '-mt-[20px]' : '-mt-[24px]'} bg-white dark:bg-black text-dimmed`}
                        >
                            {intlFormatDistance(activity.created, Date.now())}
                        </Chip>
                    )}
                    
                    <div className="flex flex-row items-center py-2">
                        <div className="min-w-7">
                            <ActivityIcon activityType={activity.activityType} />
                        </div>
                        <div className="flex-1 ml-3 text-sm">
                            <div className="font-medium">{activity.description}</div>
                            <div className="font-mono"> 
                                <span className="text-primary">by&nbsp;</span> 
                                <span className={`text-xs ${activity.deviceId === deviceId ? 'text-black' : 'text-dimmed'}`}>{formatDeviceId(activity.deviceId)},&nbsp;</span>
                                <span className="text-primary">at&nbsp;</span>
                                <span className="text-dimmed text-xs">{format(activity.created, 'MMM d, yyyy HH:mm')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ActivityIcon({ activityType }: { activityType: string }) {
    const iconClass = "h-5 w-5 stroke-[1px] text-dimmed mr-2";
    
    switch (activityType) {
        case 'ExpenseAdded':
        case 'ExpenseUpdated':
        case 'ExpenseDeleted':
            return <SpendIcon className={iconClass} />;
        case 'GroupUpdated':
            return <EditIcon className={iconClass} />;
        case 'ParticipantAdded':
        case 'ParticipantRemoved':
            return <UsersIcon className={iconClass} />;
        default:
            return <TransactionsIcon className={iconClass} />;
    }
}



function formatDeviceId(deviceId: string): string {
    // Show first 4 and last 4 characters of device ID for privacy
    if (deviceId.length <= 8) {
        return deviceId;
    }
    return `${deviceId.slice(0, 4)}...${deviceId.slice(-4)}`;
}