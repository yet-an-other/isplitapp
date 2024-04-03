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
import { BellIcon, BellRingIcon, LogoIcon, MoonIcon, SettingsIcon, SunIcon } from "../icons";
import { useDarkMode } from "../utils/useDarkMode";
import { useEffect, useState } from "react";
import { getSubscription, subscribeForIosPush, subscribeForWebPush, unsubscribeWebPush } from "../utils/notification";
import { useNavigate } from "react-router-dom";


export default function HeaderBar() {

    const {isDarkMode, toggle:toggleDarkMode } = useDarkMode();
    const {isOpen, onOpen, onClose} = useDisclosure();

    const navigate = useNavigate();

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
                            startContent={<SunIcon />}
                            endContent={<MoonIcon />}
                            onChange={() => toggleDarkMode()}
                        >
                            Dark mode
                        </Switch>

                        <NotificationSwitch />
                        
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
        if (e.detail.permissionStatus !== "not-determined"){
            setSwitchDisabled(true);
            setSubscribed(e.detail.permissionStatus === "granted");
            if (e.detail.permissionStatus === "denied" && e.detail.reason) {
                console.warn("Notifications are disabled", e.detail.reason)
            }
        }
    }

    // Handle the response from the iOS app regarding the registration for notifications
    //
    const handleIosRegister = async ({ detail }: RegisterEvent) => {
        if (detail.isRegistrationSuccess && detail.fcmToken) {
            await subscribeForIosPush(detail.fcmToken)
        } else {
            console.warn("Failed to register for notifications", detail.error);
        }
    }

    // Add event listeners for the iOS app messages
    //
    useEffect(() => {
        addEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
        addEventListener('permission-status', (e) => handleIosStatus(e as CheckPermissionEvent), false);
        return () => {
            removeEventListener('register-subscription', (e) => void handleIosRegister(e as RegisterEvent), false);
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
                Notifications
            </Switch>
            <span className="text-xs text-dimmed -mt-1">
                { isSwitchDisabled 
                ? "To switch on or off notifications, you need to open Settings -> Notifications -> iSplitApp, toggle the notifications switch and reload iSplitApp."
                : "Enable to be notified about the new or changed expenses in your groups."
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