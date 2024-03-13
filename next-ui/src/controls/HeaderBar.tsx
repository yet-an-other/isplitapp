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

export default function HeaderBar() {

    const {isDarkMode, toggle } = useDarkMode();
    const {isOpen, onOpen, onClose} = useDisclosure();

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
                            onChange={() => toggle()}
                        >
                            Dark mode
                        </Switch>
                    </ModalBody>
                    <ModalFooter>
                        
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}