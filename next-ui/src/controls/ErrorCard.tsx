import { Card } from "@nextui-org/react";
import { ProblemError } from "../api/contract/ProblemError";

export const ErrorCard = ({error}: {error: ProblemError}) => {
    console.error(error);
    return (
        <Card isBlurred className="min-h-[120px] w-full flex flex-col bg-danger-100">
            <div className="flex flex-col justify-between gap-2 px-4 my-4">
                <div className="text-danger">Oops, something went wrong! Unable to load your groups. Please try again later.</div>
                <div>{error.message}</div>
            </div>
        </Card>
    );
}