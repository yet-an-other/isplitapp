import { addToast } from "@heroui/react";

export const useHeroUIAlerts = () => {
  
  const alertSuccess = (message: string, timeout = 5) => {
    addToast({
      title: "SUCCESS",
      description: message,
      color: "success",
      variant: "flat",
      timeout: timeout * 1000,
      hideIcon: false,
    });
  };

  const alertError = (message: string, timeout = 5) => {
    addToast({
      title: "ERROR",
      description: message,
      color: "danger",
      variant: "flat",
      timeout: timeout * 1000,
      hideIcon: false,
    });
  };

  const alertInfo = (message: string, timeout = 5) => {
    addToast({
      title: "INFO", 
      description: message,
      color: "primary",
      variant: "flat",
      timeout: timeout * 1000,
      hideIcon: false,
    });
  };

  const clearAlerts = () => {
    // Note: HeroUI doesn't provide removeAllToasts in the current version
    // This would need to be implemented if needed
    console.warn("clearAlerts not implemented for HeroUI toasts");
  };

  const addAlert = (alert: { message: string; severity: 'info' | 'success' | 'warning' | 'error'; timeout: number }) => {
    const colorMap = {
      info: "primary" as const,
      success: "success" as const, 
      warning: "warning" as const,
      error: "danger" as const,
    };

    addToast({
      title: alert.severity.toUpperCase(),
      description: alert.message,
      color: colorMap[alert.severity],
      variant: "flat",
      timeout: alert.timeout * 1000,
      hideIcon: false,
    });
  };

  return { addAlert, clearAlerts, alertSuccess, alertError, alertInfo };
};