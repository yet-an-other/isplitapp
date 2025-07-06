import { Card, Skeleton } from "@heroui/react";

/**
 * CardSkeleton is used to display the loading state
 */
export const CardSkeleton = () => {
    return (
        <Card className="min-h-[120px] w-full flex flex-col">
            <div className="max-w-[300px] w-full flex flex-row items-center gap-3 mt-4 ml-3">
                <div>
                    <Skeleton className="flex rounded-full w-12 h-12"/>
                </div>  
                <div className="w-full flex flex-col gap-2">
                    <Skeleton className="h-3 w-3/5 rounded-lg"/>
                    <Skeleton className="h-3 w-9/10 rounded-lg"/>
                    <Skeleton className="h-3 w-7/8 rounded-lg"/>
                </div>
            </div>
            <div className="flex flex-col justify-between gap-2 px-4 my-4">
                <Skeleton className="h-3 w-full rounded-lg"/>
                <Skeleton className="h-3 w-full rounded-lg"/>
            </div>
      </Card>
    );
  }