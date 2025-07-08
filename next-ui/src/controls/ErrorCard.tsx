import { Card, CardBody, CardHeader } from "@heroui/react";
import { ProblemError } from "../api/contract/ProblemError";
import { useTranslation } from "react-i18next";

export const ErrorCard = ({error, title}: {error: ProblemError, title?: string}) => {
    const { t } = useTranslation();
    console.error(error);
    
    return (
        <div className="w-full">
            <Card isBlurred className="min-h-[120px] mx-4 flex flex-col bg-danger-100">
                <CardHeader className="text-danger text-lg font-bold">{t('errorCard.title')}</CardHeader>
                <CardBody className="flex flex-col justify-between gap-2 px-4 my-4">
                    <div className="text-danger text-lg">{title ?? t('errorCard.defaultMessage')}</div>
                    <div className="text-danger">{error.message}</div>
                </CardBody>
            </Card>
        </div>
    );
}