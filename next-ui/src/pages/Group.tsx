import useSWR from "swr";
import { GroupCard } from "../controls/GroupCard";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { ShareIcon } from "../icons";
import { Outlet, useParams } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";

export function Group() {
    
    const { groupId } = useParams();

    const { data: party, isLoading, error} = useSWR<PartyInfo, ProblemError>(`/parties/${groupId}`, fetcher);


    return (

        <div className="w-full px-4">
        { error && <ErrorCard error={error}/>}
        { isLoading && <CardSkeleton />}
        { !error && !isLoading && !!party && 
            <div >
                <GroupCard party={party} disablePress>
                    <Button isIconOnly variant="light" className="float-right">
                        <ShareIcon className="w-[24px] h-[24px]" />
                    </Button>
                </GroupCard>

                <Outlet context={party} />
            </div>
        }
        </div>
    )
}