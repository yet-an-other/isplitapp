import { Card } from "@heroui/react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RootBoundary() {
    const error = useRouteError();
    console.error(error);

    if (isRouteErrorResponse(error)) {
        
        if (error.status === 404) {
            return <ErrorMessage>This page doesn&apos;t exist!</ErrorMessage>;
        }
    
        if (error.status === 401) {
            return <ErrorMessage>You aren&apos;t authorized to see this</ErrorMessage>;
        }
    
        if (error.status === 503) {
            return <ErrorMessage>Looks like our API is down</ErrorMessage>;
        }
    }
  
    return <ErrorMessage>Something went wrong</ErrorMessage>;
}

const ErrorMessage = ({children: message} : {children: string}) => {
    return (
        <Card isBlurred className="min-h-[120px] flex flex-col bg-danger-100 m-4">
            <div className="flex flex-col justify-between gap-2 px-4 my-4">
                <div className="text-danger">Oops, something went wrong! Please try again later.</div>
                <div>{message}</div>
            </div>
        </Card>
    );
}