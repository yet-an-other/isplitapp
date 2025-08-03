import { 
    Button, 
    Navbar, 
    NavbarBrand, 
    NavbarContent, 
    NavbarItem, 
    useDisclosure 
} from "@heroui/react";
import { LogoIcon, MenuIcon, SettingsIcon } from "../icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SettingsModal } from "./SettingsModal";



export default function HeaderBar() {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const { t } = useTranslation();
    const navigate = useNavigate();


    return (
        <>
            <Navbar isBordered={true} isBlurred maxWidth="lg" >
                <NavbarBrand>
                    <Button 
                        isIconOnly 
                        variant="light" 
                        onPress={() => navigate("/about")}
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
                            onPress={() => navigate("/")} 
                        >
                            <MenuIcon className="h-7 w-7 stroke-[1.5px]" />
                            <span className="font-bold text-gl">{t('common.appName')}</span>
                        </Button>
                    </NavbarItem>
                </NavbarContent>
                <NavbarContent justify="end">
                    <NavbarItem >
                        <Button isIconOnly variant="light" onPress={onOpen}>
                            <SettingsIcon className="h-[28px] w-[28px] stroke-[1.5px] text-primary dark:text-primary" />
                        </Button>  
                    </NavbarItem>
                </NavbarContent>
            </Navbar>   
            <SettingsModal isOpen={isOpen} onClose={onClose} />
        </>
    )
}
