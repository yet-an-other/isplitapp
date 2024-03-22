
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

    return (
        <div className="flex flex-col w-full px-4">
            <h1 className="text-2xl ">Groups</h1>
            <div className="flex flex-row justify-between text-sm text-dimmed w-full">
                Recently visited groups
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full">
                { isLoading && <CardSkeleton/> }
                { !error && !isLoading && !!parties && parties.length > 0 &&
                    parties.map(party => 
                        <GroupCard key={party.id} party={party} />
                    )
                }
            </div>
            <CreateGroupMenu />
        </div>
    )
}
