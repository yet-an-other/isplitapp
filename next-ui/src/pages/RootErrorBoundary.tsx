import { Card } from "@heroui/react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function RootBoundary() {
    const error = useRouteError();
    const { t } = useTranslation();
    console.error(error);

    if (isRouteErrorResponse(error)) {
        
        if (error.status === 404) {
            return <ErrorMessage>{t('common.errors.notFound')}</ErrorMessage>;
        }
    
        if (error.status === 401) {
            return <ErrorMessage>{t('common.errors.unauthorized')}</ErrorMessage>;
        }
    
        if (error.status === 503) {
            return <ErrorMessage>{t('common.errors.apiDown')}</ErrorMessage>;
        }
    }
  
    return <ErrorMessage>{t('common.errors.tryAgainLater')}</ErrorMessage>;
}

const ErrorMessage = ({children: message} : {children: string}) => {
    const { t } = useTranslation();
    
    return (
        <Card isBlurred className="min-h-[120px] flex flex-col bg-danger-100 m-4">
            <div className="flex flex-col justify-between gap-2 px-4 my-4">
                <div className="text-danger">{t('common.errors.generic')}</div>
                <div>{message}</div>
            </div>
        </Card>
    );
}