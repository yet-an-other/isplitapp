import { Avatar, Badge, Card, CardBody, CardFooter, CardHeader } from "@nextui-org/react"
import { PartyInfo } from "../api/contract/PartyInfo"
import { CashIcon, TransactionsIcon, UsersIcon } from "../icons"
import { useNavigate } from "react-router-dom"

interface GroupCardProps {
    party: PartyInfo
    disablePress?: boolean
    children: React.ReactNode
}

export const GroupCard = ({party, children, disablePress}: GroupCardProps) => {
    const navigate = useNavigate();
    return (
    <Card 
        className="min-h-[120px] w-full" 
        isPressable = {!disablePress}
        as = "form"
        onPress={() => navigate(`/groups/${party.id}`)}
    >
        <CardHeader className="block items-start">

            <div className="float-left mr-4">
                <Badge content={party.totalParticipants} size="lg" className={party.outstandingBalance != 0 ? 'bg-primary-100' : 'bg-success-100'}  >
                    <Avatar
                        radius="sm"
                        icon={<UsersIcon className="h-8 w-8" />}
                        className="bg-transparent border-1 text-dimmed stroke-[1.5px] border-default-200 dark:border-default-100"
                    />
                </Badge>
            </div>
            {children}
            <h1 className="text-lg">{party.name}</h1>
        </CardHeader>
        <CardBody className="flex flex-row">
            <div className="whitespace-nowrap mt-auto">
                <span className="text-xl font-bold font-mono">{party.totalExpenses.toFixed(2)}</span>
                <span className="text-dimmed ml-2 text-xl">{party.currency}</span>
            </div>
            <div className="flex flex-col ml-auto">
                <div className="whitespace-nowrap flex flex-row text-sm leading-none font-mono items-center">
                    <TransactionsIcon className="h-4 w-4 mr-2 text-dimmed" /> {party.totalTransactions}
                </div>
                <div className="whitespace-nowrap flex flex-row text-sm leading-none mt-1 font-mono items-center">
                    <CashIcon className="h-4 w-4 mr-2 text-dimmed" /> {party.outstandingBalance.toFixed(2)} <span className="font-sans text-dimmed ml-1">{party.currency}</span>
                </div>
            </div>
        </CardBody>
        <CardFooter className="flex justify-end text-xs text-dimmed">
            {new Date(party.created).toDateString()}
        </CardFooter>
    </Card>
    )
}
