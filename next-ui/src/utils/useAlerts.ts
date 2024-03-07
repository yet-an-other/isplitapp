import { useContext, useRef, useState } from "react";
import { AlertProps } from "../controls/Alert";
import { AlertsContext } from "../controls/AlertContext";

export const useAlerts = () => {
    const [alertIds, setAlertIds] = useState([] as string[]);
    const alertIdsRef = useRef(alertIds);
    const { addAlert, dismissAlert } = useContext(AlertsContext)!;
  
    const addAlertWithId = (alert: AlertProps) => {
      const id = addAlert(alert);
      alertIdsRef.current.push(id);
      setAlertIds(alertIdsRef.current);
    }
  
    const clearAlerts = () => {
      alertIdsRef.current.forEach((id) => dismissAlert(id));
      alertIdsRef.current = [];
      setAlertIds([]);
    }
  
    const alertSuccess = (message: string, timeout = 5) => {
      addAlertWithId({ message, severity: 'success', timeout });
    }
  
    const alertError = (message: string, timeout = 5) => {
      addAlertWithId({ message, severity: 'error', timeout });
    }
  
    const alertInfo = (message: string, timeout = 5) => {
      addAlertWithId({ message, severity: 'info', timeout });
    }
    
    return { addAlert: addAlertWithId, clearAlerts, alertSuccess, alertError, alertInfo };
  }