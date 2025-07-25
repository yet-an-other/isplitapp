import useSWR from "swr";
import { fetcher } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { GroupCard } from "../controls/GroupCard";
import { useNavigate } from "react-router-dom";
import { CardSkeleton } from "../controls/CardSkeleton";
import { ErrorCard } from "../controls/ErrorCard";
import { CreateGroupMenu } from "../controls/CreateGroupMenu";
import { Accordion, AccordionItem } from "@heroui/react";
import { useTranslation } from "react-i18next";

export function GroupList() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: parties, error, isLoading } = useSWR<PartyInfo[], ProblemError>(
        '/parties', 
        fetcher, 
        {
            onSuccess: (data) => {
                if (data.length === 0)
                    navigate('/about')
            },
        } 
    );

    if (error)
        return <ErrorCard error={error}/>;

    if (isLoading)
        return <CardSkeleton />;

    if (parties) {
        const actual = parties.filter(p => !p.isArchived);
        const archived = parties.filter(p => p.isArchived);
        return (
            <div className="w-full">
                <Accordion 
                    fullWidth 
                    defaultExpandedKeys="1" 
                    showDivider={false} 
                >
                    <AccordionItem 
                        key="1" 
                        aria-label={t('groupList.groups.ariaLabel')}
                        title={t('groupList.groups.title')}
                        subtitle={t('groupList.groups.subtitle')} 
                        className="[&>section]:!overflow-y-visible px-2"
                        classNames={{
                            title: "text-2xl"
                        }}
                    >
                        { actual.length > 0 &&
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    { actual.map(party => <GroupCard key={party.id} party={party} />) }
                            </div>
                        }
                    </AccordionItem>
                    <AccordionItem 
                        key="2" 
                        aria-label={t('groupList.archive.ariaLabel')}
                        title={t('groupList.archive.title')}
                        subtitle={t('groupList.archive.subtitle')} 
                        className={`[&>section]:!overflow-y-visible px-2 ${archived.length === 0 && 'hidden'}`}
                        classNames={{
                            title: "text-2xl"
                        }}
                    >
                        { archived.length > 0 &&
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-5">
                                {archived.map(party => <GroupCard key={party.id} party={party} />)}
                            </div>
                        }
                    </AccordionItem>
                </Accordion>

                <CreateGroupMenu />
            </div>
        )
    }
}