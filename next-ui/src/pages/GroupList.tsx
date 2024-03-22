
import useSWR from "swr";
import { fetcher } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { GroupCard } from "../controls/GroupCard";
import { useNavigate } from "react-router-dom";
import { CardSkeleton } from "../controls/CardSkeleton";
import { ErrorCard } from "../controls/ErrorCard";
import { CreateGroupMenu } from "../controls/CreateGroupMenu";

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
            <div className="flex flex-col w-full px-4">
                <h1 className="text-2xl ">Groups</h1>
                <div className="flex flex-row justify-between text-sm text-dimmed w-full">
                    Recently visited groups
                </div>

                { actual.length > 0 &&
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full">
                            { parties.map(party => <GroupCard key={party.id} party={party} />) }
                    </div>
                }
                { archived.length > 0 && 
                    <div>
                        <h1 className="text-2xl ">Archive</h1>
                        <div className="flex flex-row justify-between text-sm text-dimmed w-full">
                            Archived groups
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full">
                            {parties.map(party => <GroupCard key={party.id} party={party} />)}
                        </div>
                    </div>
                }
                <CreateGroupMenu />
            </div>
        )
    }
}
