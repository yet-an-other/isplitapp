import { 
    Button, 
    Modal, 
    ModalBody, 
    ModalContent, 
    ModalFooter, 
    ModalHeader, 
    Navbar, 
    NavbarBrand, 
    NavbarContent, 
    NavbarItem, 
    Select, 
    SelectItem, 
    Switch, 
    useDisclosure 
} from "@heroui/react";
import { BellIcon, BellRingIcon, LogoIcon, MoonIcon, SettingsIcon, SunIcon, UsersIcon } from "../icons";
import { useDarkMode } from "../utils/useDarkMode";
import { useCallback, useEffect, useState } from "react";
import { getSubscription, subscribeForIosPush, subscribeForWebPush, unsubscribeWebPush } from "../utils/notification";
import { useNavigate } from "react-router-dom";
import BoringAvatar from "boring-avatars";
import { PartyIconStyle, useDeviceSetting } from "../utils/deviceSetting";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";


export default function HeaderBar() {

    const {isDarkMode, toggle: toggleDarkMode } = useDarkMode();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {partyIconStyle, setPartyIconStyle} = useDeviceSetting();
    const { t } = useTranslation();

    const navigate = useNavigate();

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
        <>
            <Navbar isBordered maxWidth="full">
                <NavbarBrand>
                    <Button 
                        isIconOnly 
                        variant="light" 
                        onPress={() => navigate("/")}
                        className="-ml-2 data-[hover=true]:bg-transparent"
                    >
                        <LogoIcon 
                            className="h-[32px] w-[32px] stroke-none dark:text-gray-200"
                        />
                    </Button>
                </NavbarBrand>
                <NavbarContent className="gap-4" justify="center">
                    <NavbarItem>
                        <Button
                            color="primary" 
                            variant="light" 
                            size="md"
                            onPress={() => navigate("/about")} 
                        >
                            <span className="font-bold">{t('common.appName')}</span>
                        </Button>
                    </NavbarItem>
                </NavbarContent>
                <NavbarContent justify="end">
                    <NavbarItem >
                        <Button isIconOnly variant="light" onPress={onOpen}>
                            <SettingsIcon className="h-[24px] w-[24px] text-primary dark:text-primary" />
                        </Button>  
                    </NavbarItem>
                </NavbarContent>
            </Navbar>   
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
                            <span className="text-md dark:text-zinc-100">{t('headerBar.settings.title')}</span>
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

                        <Select 
                            label={t('headerBar.settings.iconStyle.label')} 
                            selectedKeys={new Set([partyIconStyle])}
                            startContent={ partyIconStyle === 'none' 
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
                                key="none"
                                startContent = { <UsersIcon className="h-10 w-10 text-primary stroke-[1.5px]" /> }                                
                            >
                                {t('headerBar.settings.iconStyle.options.beam')}
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

                    </ModalBody>
                    <ModalFooter>
                        
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
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



const PartyAvatar = ({variant, size = 40}: {variant: "bauhaus" | "marble", size?: number }) => {
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