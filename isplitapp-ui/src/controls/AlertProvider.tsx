import { Alert, AlertTitle, Snackbar } from "@mui/material";
import { ReactNode, createContext, useContext, useState } from "react";


type AlertContextType = {
    message: string
    setShowError: (message: string) => void;
    setShowSuccess: (message: string) => void;
}

export const AlertContext = createContext<AlertContextType>({ message: "", setShowError: (msg: string) => { }, setShowSuccess: (msg: string) => { } })

export const useErrorAlert = () => useContext(AlertContext).setShowError;

export const useSuccessAlert = () => useContext(AlertContext).setShowSuccess;

export const AlertContextProvider = ({ children }: {children?: ReactNode}) => {

    const [message, setMessage] = useState<string>("");
    const [severity, setSeverity] = useState<"error" | "success" | "info">("error");
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = () => { 
        setMessage(''); 
        setIsOpen(false) 
    };

    const setShowError = (message: string) => {
        setMessage(message);
        setSeverity("error");
        setIsOpen(true);
    } 

    const setShowSuccess = (message: string) => {
        setMessage(message);
        setSeverity("success");
        setIsOpen(true);
    }

    return (
        <AlertContext.Provider value={{ message, setShowError, setShowSuccess }}>
            {children}
            <Snackbar 
                open={isOpen}
                autoHideDuration={10000}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity={severity} sx={{ width: '100%' }} onClose={handleClose} >
                    <AlertTitle>{severity}</AlertTitle>
                    {message}
                </Alert>
            </Snackbar>
        </AlertContext.Provider>
    )
}