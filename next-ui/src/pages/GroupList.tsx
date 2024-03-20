import { Button, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@nextui-org/react";
import useSWR, { mutate } from "swr";
import { fetcher, unfollowParty } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { MenuIcon, ShareIcon, TrashIcon } from "../icons";
import { GroupCard } from "../controls/GroupCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "../utils/useAlerts";
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

/**
 * The menu for the group card with share and unfollow options
 * @param party party info
 */
const GroupMenu = ({ party }: { party: PartyInfo }) => {

    const [isOpen, setIsOpen] = useState(false);
    const confirmUnfollow = useDisclosure();
    const { alertSuccess, alertError } = useAlerts();

    const handleAction = async (key: React.Key ) => {

        setIsOpen(false);

        key === 'share' && await shareLink(party.id) &&
            alertSuccess("The link has been successfully copied");

        key === 'unfollow' && confirmUnfollow.onOpen();

        if (key === 'unfollow-confirmed') {
            try {
                await unfollowParty(party.id);
                await mutate('/parties');
                confirmUnfollow.onClose();
            }
            catch(e){
                console.error(`Error unfollowing the group '${party.id}' ${(e as Error).message}`);
                alertError("Oops, something went wrong! Unable to unfollow the group. Please try again later.");
            }
        } 
    }

    return (
        <>
            <Modal 
                placement="top" 
                isOpen={confirmUnfollow.isOpen} 
                onOpenChange={confirmUnfollow.onOpenChange} 
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
                        <Button color="default" variant="flat" onPress={confirmUnfollow.onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" variant="flat" onPress={() => void handleAction("unfollow-confirmed")}>
                            Unfollow
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Popover showArrow placement="left" backdrop="blur" triggerType="menu" isOpen={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger>
                    <Button isIconOnly variant="light" className="float-right">
                        <MenuIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2">
                    <div className="w-full max-w-[260px] border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
                        <Listbox 
                            variant="flat" 
                            aria-label="Group menu"
                            onAction={key => void handleAction(key)}
                        >
                            <ListboxItem
                                key="share"
                                description="Copy the group link to your clipboard"
                                startContent={<ShareIcon className="h-6 w-6 text-foreground" />}
                                textValue="Share Group"
                            >
                                <span className="text-foreground">Share Group</span>
                            </ListboxItem>
                            <ListboxItem
                                key="unfollow"
                                description="You can follow the group back anytime"
                                startContent={<TrashIcon className="h-6 w-6 text-danger" />}
                                color="danger"
                                textValue="Unfollow Group"
                            >
                                <span className="text-foreground">Unfollow Group</span>
                            </ListboxItem>
                        </Listbox>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}


