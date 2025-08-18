import { useCallback, useMemo } from "react";
import useLocalStorageState from "use-local-storage-state";

export class PartySetting {

    constructor(partyId: string) {
        this.partyId = partyId;
    }
    partyId = '';
    isArchived = false;
    isShowRefund = true;
    lastViewed = "zzzzzzz";
    primaryParticipantId: string | null = null;

}

export function usePartySetting(partyId: string)
{
    const [partySettings, setPartySettings] = useLocalStorageState<PartySetting>(
        `ls:${partyId}`, 
        { 
            defaultValue: new PartySetting(partyId),
            storageSync: true,
        }
    );

    // Memoize setter functions to prevent infinite re-renders
    const setIsShowRefund = useCallback((isShowRefund: boolean) => {
        setPartySettings(prev => ({...prev, isShowRefund}));
    }, [setPartySettings]);

    const setLastViewed = useCallback((lastViewed: string) => {
        setPartySettings(prev => ({...prev, lastViewed}));
    }, [setPartySettings]);

    const setIsArchived = useCallback((isArchived: boolean) => {
        setPartySettings(prev => ({...prev, isArchived}));
    }, [setPartySettings]);

    const setPrimaryParticipantId = useCallback((primaryParticipantId: string | null) => {
        setPartySettings(prev => ({...prev, primaryParticipantId}));
    }, [setPartySettings]);

    // Memoize the return object to prevent unnecessary re-renders
    return useMemo(() => ({
        ...partySettings, 
        setIsShowRefund, 
        setLastViewed, 
        setIsArchived, 
        setPrimaryParticipantId
    }), [partySettings, setIsShowRefund, setLastViewed, setIsArchived, setPrimaryParticipantId]);
}