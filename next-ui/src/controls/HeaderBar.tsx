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
import { GroupsIcon } from "../icons/GroupsIcon";
import { SettingIconSketch } from "../icons/SettingIconSketch";
import { SunIcon } from "../icons/SunIcon";
import { MoonIcon } from "../icons/MoonIcon";
import { LogoIcon } from "../icons/LogoIcon";
import { useDarkMode } from "../utils/useDarkMode";
import { useNavigate } from "react-router-dom";

export default function HeaderBar() {

    const {isDarkMode, toggle } = useDarkMode();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const navigate = useNavigate();

    return (
        <>
            <Navbar isBordered maxWidth="full">
                <NavbarBrand>
                    <a href="/">
                        <LogoIcon className="h-[32px] w-[32px] dark:text-gray-200" />
                    </a>
                </NavbarBrand>
                <NavbarContent className="gap-4" justify="center">
                    <NavbarItem>
                        <Button
                            onPress={() => {navigate('groups')}}
                            href="/groups" 
                            color="primary" 
                            variant="light" 
                            size="md" 
                            startContent={
                                <GroupsIcon className="h-[24px] w-[24px] text-primary"  />
                            }>
                            <span className="font-bold">GROUPS</span>
                        </Button>
                    </NavbarItem>
                </NavbarContent>
                <NavbarContent justify="end">
                    <NavbarItem >
                        <Button isIconOnly variant="light" onClick={() => onOpen()}>
                            <SettingIconSketch className="h-[24px] w-[24px] text-primary" />
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
                    <ModalHeader className="flex flex-col gap-1">Settings</ModalHeader>
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