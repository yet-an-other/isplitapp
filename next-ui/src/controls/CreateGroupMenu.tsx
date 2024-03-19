import { Button, Input, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@nextui-org/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "../utils/useAlerts";
import { LinkIcon, PlusIcon } from "../icons";

/**
 * The main menu for the group list page with create and add by url options
 */
export function CreateGroupMenu() {

    const linkModal = useDisclosure();
    const [isOpen, setIsOpen] = useState(false);
    const [groupLink, setGroupLink] = useState("");
    const navigate = useNavigate();
    const { alertError } = useAlerts();

    const handleAction = (key: React.Key ) => {
        setIsOpen(false);
        key === 'create' && navigate('/create');

        key === 'addbyurl' && linkModal.onOpen();

        if (key === 'confirmed' && groupLink) {
            linkModal.onClose();
            const match = groupLink.match("(^|/)([a-zA-Z]{16})($|/)");
            setGroupLink("");
            if (!match?.[2]){
                alertError("Cannot find party id");
                return;
            }
    
            navigate(`/${match[2]}/expenses`);
        } 
    }

    return (
        <>
            <Modal 
                placement="top" 
                isOpen={linkModal.isOpen} 
                onOpenChange={linkModal.onOpenChange} 
                size="xs" 
                backdrop="blur"
                disableAnimation
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Add group by link</ModalHeader>
                    <ModalBody>
                        <p className="text-dimmed text-sm">
                            If someone has shared a group link with you, you can paste it here to include the group in your list.
                        </p>
                        <Input
                            label="Group link"
                            className="mt-2"
                            variant="flat"
                            size="sm"
                            onChange={e => setGroupLink(e.target.value)}
                            classNames={{
                                label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                                description: "text-dimmed",
                                input: "text-[16px]"
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" variant="flat" onPress={linkModal.onClose}>
                            Cancel
                        </Button>
                        <Button color="primary" variant="flat" onPress={() => void handleAction("confirmed")}>
                            Add
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

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
                                startContent={<PlusIcon className="h-6 w-7 mx-1 bg-primary text-white rounded-lg" />}
                                color="primary"
                                textValue="Create Group"
                            >
                                <span className="text-foreground font-semibold">Create</span>
                            </ListboxItem>
                            <ListboxItem
                                key="addbyurl"
                                description="Paste a group link to join a group"
                                startContent={<LinkIcon className="h-6 w-7 text-foreground mx-1" />}
                                textValue="Add by URL"
                            >
                                <span className="text-foreground font-semibold">Add by URL</span>
                            </ListboxItem>
                        </Listbox>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}