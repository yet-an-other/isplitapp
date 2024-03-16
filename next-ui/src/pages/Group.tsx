import useSWR from "swr";
import { GroupCard } from "../controls/GroupCard";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { fetcher } from "../api/expenseApi";
import { Outlet, useMatches, useNavigate, useParams } from "react-router-dom";
import { Button, ButtonGroup } from "@nextui-org/react";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { useEffect } from "react";

export function Group() {
    
    const navigate = useNavigate();
    const params = useParams().groupId?.match(/[a-zA-Z]{16}/);
    const groupId = params ? params[0] : null;

    useEffect(() => {
        if(!groupId){
            navigate("/404");
        }
    })

    const { data: party, isLoading, error} = useSWR<PartyInfo, ProblemError>(groupId && `/parties/${groupId}`, fetcher);
    
    const matches = useMatches();
    const current = matches
        .filter((match) => Boolean(match.handle))
        .map((match) => match.handle)[0] as keyof typeof items;

    const items = {
        expenses:"Expenses", 
        balance:"Balance", 
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

                    <Outlet context={party} />
                </div>
            }
        </div>
    )
}