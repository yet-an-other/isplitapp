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
    Switch, 
    useDisclosure 
} from "@nextui-org/react";
import { LogoIcon, MoonIcon, SettingsIcon, SunIcon } from "../icons";
import { useDarkMode } from "../utils/useDarkMode";
import { useEffect, useState } from "react";
import { getSubscription, subscribeForIosPush, subscribeForWebPush, unsubscribeWebPush } from "../utils/subscribeToPush";

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

export default function HeaderBar() {

    const {isDarkMode, toggle:toggleDarkMode } = useDarkMode();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [isSubscription, setSubscription] = useState(false);
    const [isSubsToggleDisabled, setSubsToggleDisabled] = useState(false);

    useEffect(() => {
        const checkSubscription = async () => {

            // handle iOS 
            //
            const w = window as unknown as Window;
            if (w.webkit?.messageHandlers?.checkPermission) { 
                w.webkit.messageHandlers.checkPermission.postMessage({
                    "message": "check-permission"
                });
                return
            }

            const subscription = await getSubscription();
            setSubscription(subscription !== null);
        }
        void checkSubscription();
    }, []);

    const handleIosStatus = (e: CheckPermissionEvent) => {
        if (e.detail.permissionStatus !== "not-determined"){
            setSubsToggleDisabled(true);
            setSubscription(e.detail.permissionStatus === "granted");
            if (e.detail.permissionStatus === "denied" && e.detail.reason) {
                console.warn("Notifications are disabled", e.detail.reason)
            }
        }
    }

    const handleIosRegister = async ({ detail }: RegisterEvent) => {
        if (detail.isRegistrationSuccess && detail.fcmToken) {
            await subscribeForIosPush(detail.fcmToken)
        } else {
            console.warn("Failed to register for notifications", detail.error);
        }
    }

    useEffect(() => {
        addEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
        addEventListener('permission-status', (e) => handleIosStatus(e as CheckPermissionEvent), false);
        return () => {
            removeEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
            removeEventListener('permission-status', (e) => handleIosStatus(e as CheckPermissionEvent), false);
        }
    }, []);

    const toggleSubscription = async () => {

        // handle iOS notifications
        //
        const w = window as unknown as Window;
        if (w.webkit?.messageHandlers?.toggleNotification) { 
            w.webkit.messageHandlers.toggleNotification.postMessage({
                "message": `${isSubscription ? "unsubscribe" : "subscribe"}`
            });
            return
        }

        if (isSubscription) {
            await unsubscribeWebPush();
            setSubscription(false);
        } else {

            if (Notification.permission !== "granted" && 
                await Notification.requestPermission() !== "granted" ) {
                return;
            }

            const subscriptionResult = await subscribeForWebPush();
            setSubscription(Notification.permission === "granted" && subscriptionResult);
        }
    }

    return (
        <>
            <Navbar isBordered maxWidth="full">
                <NavbarBrand>
                    <a href="/">
                        <LogoIcon 
                            className="h-[32px] w-[32px] stroke-none dark:text-gray-200"
                        />
                    </a>
                </NavbarBrand>
                <NavbarContent className="gap-4" justify="center">
                    <NavbarItem>
                        <Button
                            as="a"
                            href="/about" 
                            color="primary" 
                            variant="light" 
                            size="md" 
                        >
                            <span className="font-bold">iSplitApp</span>
                        </Button>
                    </NavbarItem>
                </NavbarContent>
                <NavbarContent justify="end">
                    <NavbarItem >
                        <Button isIconOnly variant="light" onClick={() => onOpen()}>
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
                            <span className="text-md dark:text-zinc-100">Settings</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <Switch
                            isSelected={isDarkMode}
                            size="lg"
                            color="primary"
                            startContent={<MoonIcon className="w-[24px] h-[24px]" />}
                            endContent={<SunIcon className="w-[24px] h-[24px]" />}
                            onChange={() => toggleDarkMode()}
                        >
                            Dark mode
                        </Switch>


                            <Switch
                                isSelected={isSubscription}
                                isDisabled={isSubsToggleDisabled}
                                size="lg"
                                color="primary"
                                startContent={<MoonIcon className="w-[24px] h-[24px]" />}
                                endContent={<SunIcon className="w-[24px] h-[24px]" />}
                                onChange={() => void toggleSubscription()}
                            >
                                Notifications
                            </Switch>
                            <span className="text-xs text-dimmed">
                                { isSubsToggleDisabled 
                                 ? "To switch on or off notifications, you need to open Settings -> Notifications -> iSplitApp, toggle the notifications switch and reload iSplitApp."
                                 : "This enables notifications about new or changed expenses in your group."
                                }
                            </span>
                        
                    </ModalBody>
                    <ModalFooter>
                        
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
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