import useSWR from "swr";
import { fetcher } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { GroupCard } from "../controls/GroupCard";
import { useNavigate } from "react-router-dom";
import { CardSkeleton } from "../controls/CardSkeleton";
import { ErrorCard } from "../controls/ErrorCard";
import { CreateGroupMenu } from "../controls/CreateGroupMenu";
import { Accordion, AccordionItem } from "@nextui-org/react";

export function GroupList() {

    const navigate = useNavigate();
    const { data: parties, error, isLoading } = useSWR<PartyInfo[], ProblemError>('/parties', fetcher);

    if (error)
        return <ErrorCard error={error}/>;

    if (!error && !isLoading && (!parties || parties.length === 0)) 
        navigate('/about');

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
                        aria-label="Groups"
                        title="Groups"
                        subtitle="Recently visited groups" 
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
                        aria-label="Archive"
                        title="Archive"
                        subtitle="Archived groups" 
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
