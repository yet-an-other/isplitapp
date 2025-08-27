import { 
    Accordion,
    AccordionItem,
    Button, 
    Divider, 
    Input,
    Modal, 
    ModalBody, 
    ModalContent, 
    ModalFooter, 
    ModalHeader, 
    Select, 
    SelectItem, 
    Switch
} from "@heroui/react";
import { BellIcon, BellRingIcon, CopyIcon, MoonIcon, SettingsIcon, SunIcon, UserStarIcon, UsersIcon } from "../icons";
import { useDarkMode } from "../utils/useDarkMode";
import { useCallback, useEffect, useState } from "react";
import { getSubscription, subscribeForIosPush, subscribeForWebPush, unsubscribeWebPush } from "../utils/notification";
import BoringAvatar from "boring-avatars";
import { PartyIconStyle, useDeviceSetting } from "../utils/deviceSetting";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { ensureDeviceId } from "../api/userApi";
import { useHeroUIAlerts as useAlerts } from "../utils/useHeroUIAlerts";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const {isDarkMode, toggle: toggleDarkMode } = useDarkMode();
    const {partyIconStyle, setPartyIconStyle, defaultUserName, setDefaultUserName, enableActivityLog, setEnableActivityLog} = useDeviceSetting();
    const { t } = useTranslation();

    // Handle the response from the iOS app regarding the registration for notifications
    //
    const handleIosRegister = useCallback(async ({ detail }: RegisterEvent) => {

        if (detail.isRegistrationSuccess && detail.fcmToken) {
            await subscribeForIosPush(detail.fcmToken)
            console.debug("Successfully registered for notifications, token: ", detail.fcmToken);
        } else {
            console.warn("Failed to register for notifications", detail.error);
        }
    }, [])

    // Add event listeners for the iOS app messages to update subsctription registration
    //
    useEffect(() => {
        addEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
        return () => {
            removeEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
        }
    }, [handleIosRegister]);    

    return (
        <Modal 
            size="xs" 
            isOpen={isOpen} 
            onClose={onClose}
            placement="top-center"
            backdrop="blur"
            disableAnimation
            >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex flex-row">
                        <SettingsIcon className="h-[24px] w-[24px] text-primary mr-2" />
                        <span className="text-md text-center w-full mr-6 dark:text-zinc-100">{t('headerBar.settings.title')}</span>
                    </div>
                </ModalHeader>
                <ModalBody>

                    <Switch
                        isSelected={isDarkMode}
                        size="lg"
                        color="primary"
                        startContent={<SunIcon />}
                        endContent={<MoonIcon />}
                        onChange={toggleDarkMode}
                    >
                        {t('headerBar.settings.darkMode.label')}
                    </Switch>
                    <span className="text-xs text-dimmed -mt-1">
                        {t('headerBar.settings.darkMode.description')}
                    </span>
                    <br/>

                    <NotificationSwitch />
                    <br/>

                    <Switch
                        isSelected={enableActivityLog}
                        size="lg"
                        color="primary"
                        onChange={() => setEnableActivityLog(!enableActivityLog)}
                    >
                        {t('headerBar.settings.activityLog.label')}
                    </Switch>
                    <span className="text-xs text-dimmed -mt-1">
                        {t('headerBar.settings.activityLog.description')}
                    </span>
                    <br/>

                    <Input
                        label={t('headerBar.settings.defaultUser.label')}
                        value={defaultUserName}
                        variant="flat"
                        size="md"
                        startContent={<UserStarIcon className="-mb-1 -ml-1 h-7 w-7 text-primary fill-primary stroke-[1.5px]" />}
                        onChange={(e) => setDefaultUserName(e.target.value)}
                        description={t('headerBar.settings.defaultUser.description')}
                        placeholder={t('headerBar.settings.defaultUser.placeholder')}
                    />
                    <br/>

                    <Select 
                        label={t('headerBar.settings.iconStyle.label')} 
                        selectedKeys={new Set([partyIconStyle])}
                        startContent={ (partyIconStyle === 'none')
                            ? <UsersIcon className="h-7 w-7 text-primary stroke-[1.5px]" /> 
                            : <PartyAvatar variant={partyIconStyle} size={20} />
                        }
                        onSelectionChange={k => {
                            const [style] = (k as Set<PartyIconStyle>);
                            style && setPartyIconStyle(style);
                        }}
                        description={t('headerBar.settings.iconStyle.description')}
                    >
                        <SelectItem 
                            key="bauhaus"
                            startContent = { <PartyAvatar variant="bauhaus"/> }
                            
                        >
                            {t('headerBar.settings.iconStyle.options.bauhaus')}
                        </SelectItem>
                        <SelectItem 
                            key="marble"
                            startContent = { <PartyAvatar variant="marble"/> }
                        >
                            {t('headerBar.settings.iconStyle.options.marble')}
                        </SelectItem>
                        <SelectItem 
                            key="beam"
                            startContent = { <PartyAvatar variant="beam"/> }                                
                        >
                            {t('headerBar.settings.iconStyle.options.beam')}
                        </SelectItem>
                        <SelectItem 
                            key="none"
                            startContent = { <UsersIcon className="h-10 w-10 text-primary stroke-[1.5px]" /> }                                
                        >
                            {t('headerBar.settings.iconStyle.options.none')}
                        </SelectItem>
                    </Select>
                    <br/>

                    <Select 
                        label={t('headerBar.settings.language.label')} 
                        selectedKeys={new Set([i18n.language])}
                        startContent={i18n.language === 'de' ? '🇩🇪' : '🇺🇸'}
                        onSelectionChange={k => {
                            const [language] = k as Set<string>;
                            language && i18n.changeLanguage(language);
                        }}
                        description={t('headerBar.settings.language.description')}
                    >
                        <SelectItem 
                            className="dark:text-zinc-100" 
                            key="en"
                            startContent="🇺🇸"
                        >
                            English
                        </SelectItem>
                        <SelectItem 
                            className="dark:text-zinc-100" 
                            key="de"
                            startContent="🇩🇪"
                        >
                            Deutsch
                        </SelectItem>
                    </Select>

                    <Divider className="mt-2 mb-[-10px]" />
                    <Accordion className="px-0">
                        <AccordionItem 
                            key="advanced" 
                            aria-label={t('headerBar.settings.advanced.title')}
                            title={t('headerBar.settings.advanced.title')}
                        >
                            <DeviceIdSection onClose={onClose} />
                        </AccordionItem>
                    </Accordion>

                </ModalBody>
                <ModalFooter>
                    
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/**
 * A section to display device ID with copy functionality
 */
function DeviceIdSection({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const [deviceId, setDeviceId] = useState<string>('');
    const { alertSuccess } = useAlerts();

    useEffect(() => {
        ensureDeviceId().then(id => setDeviceId(id));
    }, []);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(deviceId);
            alertSuccess(t('headerBar.settings.advanced.deviceId.copied'));
            onClose();
            setDeviceId(""); 
        } catch (err) {
            console.error('Failed to copy device ID:', err);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Input
                label={t('headerBar.settings.advanced.deviceId.label')}
                value={deviceId || '...'}
                isReadOnly
                classNames={{
                    input: "font-mono text-xs"
                }}
                endContent={
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={copyToClipboard}
                        className="min-w-unit-6 w-unit-6 h-unit-6"
                        isDisabled={!deviceId}
                    >
                        <CopyIcon className="h-[24px] w-[24px] stroke-[1.5px] text-primary" />
                    </Button>
                }
                description={t('headerBar.settings.advanced.deviceId.description')}
            />

        </div>
    );
}

/**
 * A switch to enable or disable notifications
 */
function NotificationSwitch() {
    const { t } = useTranslation();
    const [isSubscribed, setSubscribed] = useState(false);
    const [isSwitchDisabled, setSwitchDisabled] = useState(false);

    // Set the initial state of switch based on known data
    //
    useEffect(() => {
        const checkSubscription = async () => {

            // handle iOS (send message to the app and await response in the handleIosStatus listener)
            //
            const w = window as unknown as Window;
            if (w.webkit?.messageHandlers?.checkPermission) { 
                w.webkit.messageHandlers.checkPermission.postMessage({
                    "message": "check-permission"
                });
                return
            }

            const subscription = await getSubscription();
            setSubscribed(subscription !== null);
        }
        void checkSubscription();
    }, []);


    // Handle the response from the iOS app regarding the notification permission status
    //
    const handleIosStatus = (e: CheckPermissionEvent) => {

        console.debug("Notification permission status: ", e.detail.permissionStatus);

        if (e.detail.permissionStatus !== "not-determined"){
            setSwitchDisabled(true);
            setSubscribed(e.detail.permissionStatus === "granted");
            if (e.detail.permissionStatus === "denied" && e.detail.reason) {
                console.warn("Notifications are disabled", e.detail.reason)
            }
        }
    }

    // Add event listeners for the iOS app messages
    //
    useEffect(() => {
     //   addEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
        addEventListener('permission-status', (e) => handleIosStatus(e as CheckPermissionEvent), false);
        return () => {
     //       removeEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
            removeEventListener('permission-status', (e) => handleIosStatus(e as CheckPermissionEvent), false);
        }
    }, []);

    // Toggle the subscription for notifications
    //
    const toggleSubscription = async () => {

        // handle iOS notifications
        //
        const w = window as unknown as Window;
        if (w.webkit?.messageHandlers?.toggleNotification) { 
            w.webkit.messageHandlers.toggleNotification.postMessage({
                "message": `${isSubscribed ? "unsubscribe" : "subscribe"}`
            });
            return
        }

        // handle web notifications
        //
        if (isSubscribed) {
            await unsubscribeWebPush();
            setSubscribed(false);
        } else {
            if (Notification.permission !== "granted" && 
                await Notification.requestPermission() !== "granted" ) {
                return;
            }
            const subscriptionResult = await subscribeForWebPush();
            setSubscribed(Notification.permission === "granted" && subscriptionResult);
        }
    }

    return (
        <>
            <Switch
                isSelected={isSubscribed}
                isDisabled={isSwitchDisabled}
                size="lg"
                color="primary"
                startContent={<BellIcon />}
                endContent={<BellRingIcon />}
                onChange={() => void toggleSubscription()}
            >
                {t('headerBar.settings.notifications.label')}
            </Switch>
            <span className="text-xs text-dimmed -mt-1">
                { isSwitchDisabled 
                ? t('headerBar.settings.notifications.descriptionDisabled')
                : t('headerBar.settings.notifications.descriptionEnabled')
                }
            </span>
        </>
    )
}

interface RegisterEvent extends Event {
    detail: {
        isRegistrationSuccess: boolean;
        fcmToken: string;
        error: string;
    }
}

interface CheckPermissionEvent extends Event {
    detail: {
        permissionStatus: "granted" | "denied" | "not-determined";
        reason: string;
    }
}
interface Window {
    webkit: {
        messageHandlers: {
            toggleNotification: INotify;
            checkPermission: INotify;
        }
    };
}
interface INotify {
    postMessage: (message: { message: string }) => void;
}

const PartyAvatar = ({variant, size = 40}: {variant: "bauhaus" | "marble" | "beam", size?: number }) => {
    return (
        <div className="rounded-md overflow-clip">
            <BoringAvatar
                size={size}
                name={variant}
                variant={variant}
                colors={['#B9D5A0', '#8CA062', '#B6B6B6', '#6E6E6E', '#303030']}
                square
            />
        </div>
    )
}