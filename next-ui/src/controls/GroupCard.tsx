import { Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react"
import { PartyInfo } from "../api/contract/PartyInfo"
import { ArchiveIcon, CashIcon, EditIcon, ExportIcon, ShareIcon, TransactionsIcon, TrashIcon, UsersIcon } from "../icons"
import { useMatch, useNavigate } from "react-router-dom"
import { unfollowParty } from "../api/expenseApi"
import { mutate } from "swr"
import { useAlerts } from "../utils/useAlerts"
import { shareLink } from "../utils/shareLink"
import { generateReport } from "../utils/generateReport"

interface GroupCardProps {
    party: PartyInfo
    disablePress?: boolean
}

export const GroupCard = ({party, disablePress}: GroupCardProps) => {
    const navigate = useNavigate();
    const { alertSuccess } = useAlerts();
    const match = useMatch('/:groupId/edit');
    const confirmationState = useDisclosure();

    const handleShare = async () => {
        if(party){
            await shareLink(party.id) &&
            alertSuccess("The link has been successfully copied");
        }
    }

    return (
        <>
            <UnfollowConfirmation confirmationState={confirmationState} partyId={party.id} />

            <Card 
                className="min-h-[120px] w-full" 
                isPressable = {!disablePress}
                as = "form"
                onPress={() => navigate(`/${party.id}`)}
            >
                <CardHeader className="block items-start">
                    <div className="float-left mr-4">
                        <Badge content={party.totalParticipants} size="lg" className={'bg-primary-100'}>
                            <Avatar
                                radius="sm"
                                icon={<UsersIcon className="h-8 w-8" />}
                                className="bg-transparent border-1 text-dimmed stroke-[1.5px] border-default-200 dark:border-default-100"
                            />
                        </Badge>
                    </div>
                    <Button 
                            isIconOnly 
                            variant="light" 
                            className="float-right" 
                            onPress={() => void handleShare()}
                        >
                            <ShareIcon className="w-6 h-6" />
                        </Button>
                    <h1 className="text-lg">{party.name}</h1>
                </CardHeader>
                <CardBody className="flex flex-row">
                    <div className="whitespace-nowrap mt-auto leading-none">
                        <span className="text-xl font-bold font-mono leading-none">{party.totalExpenses.toFixed(2)}</span>
                        <span className="text-dimmed ml-2 text-xl leading-none">{party.currency}</span>
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
                <CardFooter className="flex -mt-2 items-end">
                    <div className="flex flex-row bg-primary-50 rounded-lg items-center" >
                        <Button 
                            isIconOnly 
                            variant="light" 
                            size="md" 
                            color="danger" 
                            radius="sm"
                            className="rounded-r-none"
                            onPress={confirmationState.onOpen}
                        >
                            <TrashIcon className="h-5 w-5"/>
                        </Button>
                        <div className="hidden">
                            <div className="w-[1px] bg-divider h-8" />
                            <Button isIconOnly variant="light" size="sm" color="primary" className="mx-2">
                                <ArchiveIcon className="h-5 w-5"/>
                            </Button>
                        </div>

                        <Button
                            isDisabled={!!match}
                            isIconOnly 
                            variant="light" 
                            size="md" 
                            color="primary" 
                            radius="none"
                            onPress={() => navigate(`/${party.id}/edit`)}
                        >
                            <EditIcon className="h-5 w-5"/>
                        </Button>

                        <Button 
                            isDisabled={party.totalExpenses === 0}
                            isIconOnly 
                            variant="light" 
                            size="md" 
                            color="primary"
                            radius="sm"
                            className="rounded-l-none"
                            onPress={() => void generateReport(party.id)}
                        >
                            <ExportIcon className="h-5 w-5"/>
                        </Button>
                    </div>
                    <div className="text-xs text-dimmed ml-auto">{new Date(party.created).toDateString()}</div>
                </CardFooter>
            </Card>
        </>
    )
}

function UnfollowConfirmation({ confirmationState, partyId }: {confirmationState: ReturnType<typeof useDisclosure>, partyId: string}) {

    const { alertError } = useAlerts();
    const navigate = useNavigate();

    const handleAction = async (key: React.Key ) => {
        if (key === 'unfollow-confirmed') {
            try {
                await unfollowParty(partyId);
                await mutate('/parties');
                confirmationState.onClose();
                navigate('/');
            }
            catch(e){
                console.error(`Error unfollowing the group '${partyId}' ${(e as Error).message}`);
                alertError("Oops, something went wrong! Unable to unfollow the group. Please try again later.");
            }
        } 
    }

    return (
        <Modal 
            placement="top" 
            isOpen={confirmationState.isOpen} 
            onOpenChange={confirmationState.onOpenChange} 
            size="xs" 
            backdrop="blur"
            disableAnimation
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Unfollow the group?</ModalHeader>
                <ModalBody>
                    <p className="text-dimmed">You&apos;ll be following the group automatically, if visiting it again.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="default" variant="flat" onPress={confirmationState.onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" variant="flat" onPress={() => void handleAction("unfollow-confirmed")}>
                        Unfollow
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}