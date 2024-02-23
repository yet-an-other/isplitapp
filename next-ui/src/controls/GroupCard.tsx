import { Avatar, Badge, Card, CardBody, CardFooter, CardHeader, Tooltip } from "@nextui-org/react"
import { PartyInfo } from "../api/contract/PartyInfo"
import { CashIcon, TransactionsIcon, UsersIcon } from "../icons"

interface GroupCardProps {
    party: PartyInfo
    children: React.ReactNode
}

export const GroupCard = ({party, children}: GroupCardProps) => {
    return (
    <Card className="min-h-[120px] w-full">
        <CardHeader className="block items-start">

            <div className="float-left mr-4">
                <Badge content={party.totalParticipants} size="lg" className="bg-primary-100"  >
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
            <Tooltip content="Total expenses">
                <div className="whitespace-nowrap mt-auto">
                    <span className="text-xl font-bold font-mono">{party.totalExpenses}</span>
                    <span className="text-dimmed ml-2 text-xl">{party.currency}</span>
                </div>
            </Tooltip>
            <div className="flex flex-col ml-auto">
                <Tooltip content="Total transactions">
                    <div className="whitespace-nowrap flex flex-row text-sm leading-none font-mono">
                        <TransactionsIcon className="h-4 w-4 mr-2" /> {party.totalTransactions}
                    </div>
                </Tooltip>
                <Tooltip content="Outstanding balance">
                    <div className="whitespace-nowrap flex flex-row text-sm leading-none mt-1 font-mono">
                        <CashIcon className="h-4 w-4 mr-2" /> {party.outstandingBalance} <span className="font-sans text-dimmed ml-1">{party.currency}</span>
                    </div>
                </Tooltip>
            </div>
        </CardBody>
        <CardFooter className="flex justify-end text-xs text-dimmed">
            {new Date(party.created).toDateString()}
        </CardFooter>
    </Card>
    )
}
