import { Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react"
import { PartyInfo } from "../api/contract/PartyInfo"
import { ArchiveIcon, CashIcon, EditIcon, ExportIcon, ShareIcon, TransactionsIcon, TrashIcon, UndoIcon, UsersIcon } from "../icons"
import { useMatch, useNavigate } from "react-router-dom"
import { unfollowParty, updatePartySetings } from "../api/expenseApi"
import { mutate } from "swr"
import { useAlerts } from "../utils/useAlerts"
import { shareLink } from "../utils/shareLink"
import { generateReport } from "../utils/generateReport"
import BoringAvatar from "boring-avatars"
import { useDeviceSetting } from "../utils/deviceSetting"
import { usePartySetting } from "../utils/partySetting"
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface GroupCardProps {
    party: PartyInfo
    disablePress?: boolean
}

export const GroupCard = ({party, disablePress}: GroupCardProps) => {
    const navigate = useNavigate();
    const { alertSuccess, alertInfo } = useAlerts();
    const match = useMatch('/:groupId/edit');
    const confirmationState = useDisclosure();
    const { partyIconStyle } = useDeviceSetting();
    const { lastViewed } = usePartySetting(party.id);
    const { t } = useTranslation();

    const handleShare = async () => {
        if(party){
            await shareLink(party.id) &&
            alertSuccess(t('groupCard.messages.linkCopied'));
        }
    }

    const handleArchive = async () => {
        await updatePartySetings(party.id, {isArchived: !party.isArchived});
        await mutate(`/parties`);
        await mutate(`/parties/${party.id}`);
        alertInfo(t('groupCard.messages.archiveToggled', { 
            groupName: party.name, 
            direction: party.isArchived ? t('groupCard.messages.archiveDirections.outOf') : t('groupCard.messages.archiveDirections.into') 
        }));
    }

    return (
        <>
            <UnfollowConfirmation confirmationState={confirmationState} partyId={party.id} />

            <Card
                className={`min-h-[120px] w-full mb-8 ${party.isArchived && 'text-dimmed'} `} 
                isPressable = {!disablePress}
                as = "form"
                onPress={() => navigate(`/${party.id}`)}
            >
                <CardHeader className="block items-start">
                    <div className="float-left mr-4">
                        <Badge content={party.totalParticipants} size="lg" className={'bg-primary-100'}>
                            <Avatar
                                radius="sm"
                                icon={
                                    partyIconStyle === 'none'
                                    ?    <UsersIcon className="h-8 w-8 stroke-[1.5px] " />
                                    :    <BoringAvatar
                                            size={40}
                                            name={party.name}
                                            variant={partyIconStyle}
                                            colors={['#B9D5A0', '#8CA062', '#B6B6B6', '#6E6E6E', '#303030']}
                                            square
                                        />
                                }
                                className={`bg-transparent text-dimmed ${partyIconStyle === 'none' && 'border-1 border-default-200 dark:border-default-100'}`}
                            />
                        </Badge>
                    </div>
                    <Button 
                            isIconOnly 
                            variant="light"
                            color="primary"
                            radius="sm"
                            size="md" 
                            className="float-right bg-primary-50" 
                            onPress={() => void handleShare()}
                        >
                            <ShareIcon className="w-5 h-5" />
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
                            <TransactionsIcon className={`h-4 w-4 mr-2 text-dimmed`} /> {party.totalTransactions}
                        </div>
                        <div className="whitespace-nowrap flex flex-row text-sm leading-none mt-1 font-mono items-center">
                            <CashIcon className={`h-4 w-4 mr-2 text-dimmed`} /> 
                            <span className={`${party.outstandingBalance === 0 ? 'text-primary': 'text-danger-600'}`}>{party.outstandingBalance.toFixed(2)} </span> 
                            <span className="font-sans text-dimmed ml-1">{party.currency}</span>
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

                        <Button 
                            isIconOnly 
                            variant="light" 
                            size="md" 
                            color="primary" 
                            radius="none"
                            onPress={() => void handleArchive()}
                        >
                            {party.isArchived
                                ? <UndoIcon className="h-5 w-5"/>
                                : <ArchiveIcon className="h-5 w-5"/>
                            }
                        </Button>


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

                    <div className="flex flex-row justify-end items-center ml-auto">
                        <div className={`h-2 w-2 mr-1 rounded-full ${party.lastExpenseTimestamp > lastViewed ? 'bg-primary' : 'bg-transparent'}`}  />
                        <div className="flex text-xs text-dimmed ">{format(party.created, "eee dd LLL yyyy")}</div>
                    </div>
                </CardFooter>
            </Card>
        </>
    )
}

function UnfollowConfirmation({ confirmationState, partyId }: {confirmationState: ReturnType<typeof useDisclosure>, partyId: string}) {

    const { alertError } = useAlerts();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                alertError(t('groupCard.messages.unfollowError'));
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
                <ModalHeader className="flex flex-col gap-1">{t('groupCard.unfollowModal.title')}</ModalHeader>
                <ModalBody>
                    <p className="text-dimmed">{t('groupCard.unfollowModal.message')}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="default" variant="flat" onPress={confirmationState.onClose}>
                        {t('common.buttons.cancel')}
                    </Button>
                    <Button color="primary" variant="flat" onPress={() => void handleAction("unfollow-confirmed")}>
                        {t('common.buttons.unfollow')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}