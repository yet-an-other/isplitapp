import { Button, Input, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@heroui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "../utils/useAlerts";
import { LinkIcon, PlusIcon } from "../icons";
import { useTranslation } from "react-i18next";

/**
 * The main menu for the group list page with create and add by url options
 */
export function CreateGroupMenu() {

    const linkModal = useDisclosure();
    const [isOpen, setIsOpen] = useState(false);
    const [groupLink, setGroupLink] = useState("");
    const navigate = useNavigate();
    const { alertError } = useAlerts();
    const { t } = useTranslation();

    const handleAction = (key: React.Key ) => {
        setIsOpen(false);
        key === 'create' && navigate('/create');

        key === 'addbyurl' && linkModal.onOpen();

        if (key === 'confirmed' && groupLink) {
            linkModal.onClose();
            const match = groupLink.match("(^|/)([0-9a-zA-Z]{11})($|/)");
            setGroupLink("");
            if (!match?.[2]){
                alertError(t('createGroupMenu.errors.parseLink'));
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
                    <ModalHeader className="flex flex-col gap-1">{t('createGroupMenu.addByLinkModal.title')}</ModalHeader>
                    <ModalBody>
                        <p className="text-dimmed text-sm">
                            {t('createGroupMenu.addByLinkModal.description')}
                        </p>
                        <Input
                            label={t('createGroupMenu.addByLinkModal.linkLabel')}
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
                            {t('common.buttons.cancel')}
                        </Button>
                        <Button color="primary" variant="flat" onPress={() => void handleAction("confirmed")}>
                            {t('common.buttons.add')}
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
                        className="fixed bottom-16 right-16 lg:right-[max(64px,calc(50vw-512px+64px))]"
                    >
                        <PlusIcon className="h-8 w-8 " />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2">
                    <div className="w-full max-w-[300px] border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
                        <div className="text-s font-bold ml-2">
                            {t('createGroupMenu.menu.title')}
                        </div>
                        <Listbox variant="flat" aria-label={t('createGroupMenu.menu.ariaLabel')} onAction={handleAction}>
                            <ListboxItem
                                key="create"
                                description={<div>{t('createGroupMenu.menu.createGroup.description')}</div>}
                                startContent={<PlusIcon className="h-6 w-7 mx-1 bg-primary text-white rounded-lg" />}
                                color="primary"
                                textValue={t('createGroupMenu.menu.createGroup.textValue')}
                            >
                                <span className="text-foreground font-semibold">{t('createGroupMenu.menu.createGroup.text')}</span>
                            </ListboxItem>
                            <ListboxItem
                                key="addbyurl"
                                description={t('createGroupMenu.menu.addByUrl.description')}
                                startContent={<LinkIcon className="h-6 w-7 text-foreground mx-1" />}
                                color="primary"
                                textValue={t('createGroupMenu.menu.addByUrl.textValue')}
                            >
                                <span className="text-foreground font-semibold">{t('createGroupMenu.menu.addByUrl.text')}</span>
                            </ListboxItem>
                        </Listbox>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}