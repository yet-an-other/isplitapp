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
import { getSubscription, subscribeIos, subscribeToPush, unregisterSubscription } from "../utils/subscribeToPush";

interface RegisterEvent extends Event {
    fcmToken: string;
}

export default function HeaderBar() {

    const {isDarkMode, toggle:toggleDarkMode } = useDarkMode();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [isSubscription, setSubscription] = useState(false);

    useEffect(() => {
        const checkSubscription = async () => {
            const subscription = await getSubscription();
            setSubscription(subscription !== null);
        }
        void checkSubscription();
    }, []);

    addEventListener('register-subscription', (e) => {

        alert((e as RegisterEvent).fcmToken);

        void (async () => {
            if ((e as RegisterEvent).fcmToken){
                setSubscription(await subscribeIos((e as RegisterEvent).fcmToken));
            }
        })();
    });

    const toggleSubscription = async () => {

        // handle iOS notifications
        //
        const w = window as unknown as Window;
        if (w.webkit?.messageHandlers?.toggleNotification) { 
            w.webkit.messageHandlers.toggleNotification.postMessage({
                "message": `${isSubscription ? "unsubscribe" : "subscribe"}`
            });
            setSubscription(!isSubscription);
            return
        }

        if (isSubscription) {
            await unregisterSubscription();
            setSubscription(false);
        } else {
            if (Notification.permission !== "granted") {
                await Notification
                    .requestPermission()
                    .then(permission => {
                        if (permission !== "granted") {
                            return;
                        }
                    });
            }

            const subscriptionResult = await subscribeToPush();
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

                        {//!((window as unknown as Window).webkit) &&
                            <Switch
                                isSelected={isSubscription}
                                size="lg"
                                color="primary"
                                startContent={<MoonIcon className="w-[24px] h-[24px]" />}
                                endContent={<SunIcon className="w-[24px] h-[24px]" />}
                                onChange={() => void toggleSubscription()}
                            >
                                Notifications
                            </Switch>
                        }
                    </ModalBody>
                    <ModalFooter>
                        
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

interface Window {
    webkit: Webkit;
}

interface Webkit {
    messageHandlers: MessageHandler; 
}

interface MessageHandler {
    toggleNotification: INotify;
}

interface INotify {
    postMessage: (message: { message: string }) => void;
}