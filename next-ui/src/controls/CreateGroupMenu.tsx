import { Button, Input, Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@heroui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "../utils/useAlerts";
import { ImportIcon, LinkIcon, PasteIcon, PlusIcon } from "../icons";
import { useTranslation } from "react-i18next";
import { importPartiesFromDevice } from "../api/expenseApi";
import { mutate } from "swr/_internal";

/**
 * The main menu for the group list page with create and add by url options
 */
export function CreateGroupMenu() {

    const linkModal = useDisclosure();
    const importModal = useDisclosure();
    const [isOpen, setIsOpen] = useState(false);
    const [groupLink, setGroupLink] = useState("");
    const [deviceId, setDeviceId] = useState("");
    const navigate = useNavigate();
    const { alertError, alertSuccess } = useAlerts();
    const { t } = useTranslation();

    const pasteDeviceId = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setDeviceId(text);
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
        }
    };

    const handleAction = async (key: React.Key ) => {
        setIsOpen(false);
        key === 'create' && navigate('/create');

        key === 'addbyurl' && linkModal.onOpen();
        key === 'importfromdevice' && importModal.onOpen();

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

        if (key === 'importconfirmed' && deviceId) {
            if (!deviceId.trim()) {
                alertError(t('createGroupMenu.errors.invalidDeviceId'));
                return;
            }

            // we need to close the modal before starting the import
            // to show the alerts properly
            //
            importModal.onClose();
            setDeviceId("");
            
            try {
                const importedPartyIds = await importPartiesFromDevice(deviceId.trim());
                if (importedPartyIds.length > 0) {

                    // Refresh the parties list
                    //
                    await mutate('/parties');
                    navigate('/');
                    alertSuccess(t('createGroupMenu.success.importSuccess', { 
                        count: importedPartyIds.length,
                        plural: importedPartyIds.length > 1 ? 's' : ''
                    }));
                } else {
                    alertError(t('createGroupMenu.errors.noGroupsFound'));
                }
            } catch (error) {
                console.error("Failed to import groups:", error);
                alertError(t('createGroupMenu.errors.importFailed'));
            } 
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

            <Modal 
                placement="top" 
                isOpen={importModal.isOpen} 
                onOpenChange={importModal.onOpenChange} 
                size="xs" 
                backdrop="blur"
                disableAnimation
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">{t('createGroupMenu.importFromDeviceModal.title')}</ModalHeader>
                    <ModalBody>
                        <p className="text-dimmed text-sm">
                            {t('createGroupMenu.importFromDeviceModal.description')}
                        </p>
                        <Input
                            label={t('createGroupMenu.importFromDeviceModal.deviceIdLabel')}
                            value={deviceId}
                            className="mt-2"
                            variant="flat"
                            size="sm"
                            onChange={e => setDeviceId(e.target.value)}
                            endContent={
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={pasteDeviceId}
                                    className="min-w-unit-6 w-unit-6 h-unit-6"
                                >
                                    <PasteIcon className="h-[24px] w-[24px] stroke-[1.5px] text-primary" />
                                </Button>
                            }
                            classNames={{
                                label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                                description: "text-dimmed",
                                input: "text-[16px] font-mono"
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            color="default" 
                            variant="flat" 
                            onPress={importModal.onClose}
                        >
                            {t('common.buttons.cancel')}
                        </Button>
                        <Button 
                            color="primary" 
                            variant="flat" 
                            onPress={() => void handleAction("importconfirmed")}
                            isDisabled={!deviceId.trim()}
                        >
                            {t('createGroupMenu.importFromDeviceModal.importButton')}
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
                        <div className="text-s font-bold ml-2 text-center mb-2">
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
                                description={<div>{t('createGroupMenu.menu.addByUrl.description')}</div>}
                                startContent={<LinkIcon className="h-6 w-7 text-foreground mx-1" />}
                                color="primary"
                                textValue={t('createGroupMenu.menu.addByUrl.textValue')}
                            >
                                <span className="text-foreground font-semibold">{t('createGroupMenu.menu.addByUrl.text')}</span>
                            </ListboxItem>
                            <ListboxItem
                                key="importfromdevice"
                                description={<div>{t('createGroupMenu.menu.importFromDevice.description')}</div>}
                                startContent={<ImportIcon className="h-6 w-7 text-foreground mx-1" />}
                                color="primary"
                                textValue={t('createGroupMenu.menu.importFromDevice.textValue')}
                            >
                                <span className="text-foreground font-semibold">{t('createGroupMenu.menu.importFromDevice.text')}</span>
                            </ListboxItem>
                        </Listbox>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}