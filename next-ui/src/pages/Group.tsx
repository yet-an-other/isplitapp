import useSWR from "swr";
import { GroupCard } from "../controls/GroupCard";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { ShareIcon } from "../icons";
import { Outlet, useMatches, useNavigate, useParams } from "react-router-dom";
import { Button, ButtonGroup } from "@nextui-org/react";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { shareLink } from "../utils/shareLink";
import { useAlerts } from "../utils/useAlerts";

export function Group() {
    
    const { groupId } = useParams();
    const { data: party, isLoading, error} = useSWR<PartyInfo, ProblemError>(`/parties/${groupId}`, fetcher);
    const alertSuccess = useAlerts().alertSuccess;

    const handleShare = async () => {
        if(party){
            await shareLink(party.id) &&
            alertSuccess("The link has been successfully copied");
        }
    }

    const navigate = useNavigate();
    const matches = useMatches();
    const current = matches
        .filter((match) => Boolean(match.handle))
        .map((match) => match.handle)[0] as keyof typeof items;

    const items = {
        expenses:"Expenses", 
        balance:"Balance", 
        edit: "Edit"
    };
    const itemsDesc = {
        expenses: "Explore the group's expenses and money transfers here", 
        balance: "Here is the total amount each member borrowed or lent to the group", 
        edit: "Edit the group's details and members here"
    };

    const itemKeys = Object.keys(items) as (keyof typeof items)[];

    return (

        <div className="w-full px-4">
            { error && <ErrorCard error={error}/>}
            { isLoading && <CardSkeleton />}
            { !error && !isLoading && !!party && 
                <div >
                    <GroupCard party={party} disablePress>
                        <Button 
                            isIconOnly 
                            variant="light" 
                            className="float-right" 
                            onPress={() => void handleShare()}
                        >
                            <ShareIcon className="w-[24px] h-[24px]" />
                        </Button>
                    </GroupCard>
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
                                        onPress={() => void navigate(`/groups/${groupId}/${key}`)}
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

                    <Outlet context={party} />
                </div>
            }
        </div>
    )
}