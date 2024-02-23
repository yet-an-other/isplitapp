import { Button, Card, Link, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, Skeleton, useDisclosure } from "@nextui-org/react";
import useSWR, { mutate } from "swr";
import { fetcher, unfollowParty } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { LinkIcon, MenuIcon, PlusIcon, ShareIcon, TrashIcon } from "../icons";
import { GroupCard } from "../controls/GroupCard";
import { useState } from "react";
import { shareLink } from "../utils/shareLink";
import { useNavigate } from "react-router-dom";


export function GroupList() {

    const { data: parties, error, isLoading } = useSWR<PartyInfo[], ProblemError>('/parties', fetcher);

    return (
        <div className="flex flex-col w-full px-4">
            <h1 className="text-2xl ">Groups</h1>
            <div className="flex flex-row justify-between text-dimmed w-full">
                Recently visited groups
            </div>

            {
                error && <div>Error: {error.message}</div>
            }

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full">
                {
                    isLoading 
                    ? <CardSkeleton/>
                    : !parties || parties.length === 0 
                        ? <EmptyList /> 
                        : parties.map(party => 
                            <GroupCard key={party.id} party={party} > 
                                <GroupMenu party={party} /> 
                            </GroupCard>
                        )
                }
            </div>
            <ListMenu />
        </div>
    )
}

/**
 * EmptyList component is used to display the empty list message
 */
const EmptyList = () => {
    return (
        <div className="text-dimmed">
                It seems you have not visited any group yet... <br/> 
                You may <Link href="/groups/create" >create a new group</Link> or ask a friend to send you the link to an existing one. 
        </div>
    )
}

const CardSkeleton = () => {
    return (
        <Card className="min-h-[120px] w-full flex flex-col">
            <div className="max-w-[300px] w-full flex flex-row items-center gap-3 mt-4 ml-3">
                <div>
                    <Skeleton className="flex rounded-full w-12 h-12"/>
                </div>  
                <div className="w-full flex flex-col gap-2">
                    <Skeleton className="h-3 w-3/5 rounded-lg"/>
                    <Skeleton className="h-3 w-9/10 rounded-lg"/>
                    <Skeleton className="h-3 w-7/8 rounded-lg"/>
                </div>
            </div>
            <div className="flex flex-col justify-between gap-2 px-4 my-4">
                <Skeleton className="h-3 w-full rounded-lg"/>
                <Skeleton className="h-3 w-full rounded-lg"/>
            </div>
      </Card>
    );
  }


const GroupMenu = ({ party }: { party: PartyInfo }) => {

    const [isOpen, setIsOpen] = useState(false);
    const confirmUnfollow = useDisclosure();

    const handleAction = async (key: React.Key ) => {

        setIsOpen(false);

        if (key === 'share' && await shareLink(party.id)) {
                alert("The link has been successfully copied");
                //successAlert("The link has been successfully copied")
        }

        key === 'unfollow' && confirmUnfollow.onOpen();

        if (key === 'unfollow-confirmed') {
            try {
                await unfollowParty(party.id);
                await mutate('/parties');
                confirmUnfollow.onClose();
            }
            catch(e){
                console.error(`Error unfollowing the group '${party.id}' ${(e as Error).message}`);
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


const ListMenu = () => {

    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleAction = (key: React.Key ) => {
        setIsOpen(false);
        if (key === 'create') {
            navigate('/groups/create');
        }
    }    

    return (
        <Popover showArrow placement="top-end" backdrop="blur" triggerType="menu" isOpen={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger>
            <Button
                isIconOnly 
                radius="full"
                color="primary" 
                variant="shadow"
                size="lg"
                className="fixed bottom-16 right-16"
            >
               <PlusIcon className="h-8 w-8 " />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2">
            <div className="w-full max-w-[300px] border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
                <div className="text-xs font-bold ml-2">
                    Create or add a new group
                </div>
                <Listbox variant="flat" aria-label="Create group menu" onAction={handleAction}>
                    <ListboxItem
                        key="create"
                        description="Simply put the group name and currency, and you're good to go!"
                        startContent={<PlusIcon className="h-6 w-6 text-primary" />}
                        color="primary"
                        textValue="Create Group"
                    >
                        <span className="text-primary">Create</span>
                    </ListboxItem>
                    <ListboxItem
                        key="addbyurl"
                        description="Paste a group link to join a group"
                        startContent={<LinkIcon className="h-6 w-6 text-foreground" />}
                        textValue="Add by URL"
                    >
                        <span className="text-foreground">Add by URL</span>
                    </ListboxItem>
                </Listbox>
            </div>
        </PopoverContent>
      </Popover>
    )
}