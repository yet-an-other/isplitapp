import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export class PartySetting {

    constructor(partyId: string) {
        this.partyId = partyId;
    }
    partyId = '';
    isArchived = false;
    isShowRefund = true;
    lastViewed = "zzzzzzz";
    primaryParticipantId: string | null = null;

    static save(setting: PartySetting) {
        localStorage.setItem(
            `ls:${setting.partyId}`, 
            JSON.stringify({ ...setting, partyId: undefined })
        );
    }

    static load(partyId: string): PartySetting {
        const setting = localStorage.getItem(`ls:${partyId}`);
        if (setting) {
            return { ...JSON.parse(setting), partyId: partyId } as PartySetting;
        }
        return new PartySetting(partyId);
    }
}

export function usePartySetting(partyId: string)
{
    const [partySettings, setPartySettings] = useState(() => PartySetting.load(partyId));
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce saving to localStorage to prevent excessive writes
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            PartySetting.save(partySettings);
        }, 100);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [partySettings]);

    // Memoize setter functions to prevent infinite re-renders
    const setIsShowRefund = useCallback((isShowRefund: boolean) => {
        setPartySettings(prev => ({...prev, isShowRefund}));
    }, []);

    const setLastViewed = useCallback((lastViewed: string) => {
        setPartySettings(prev => ({...prev, lastViewed}));
    }, []);

    const setIsArchived = useCallback((isArchived: boolean) => {
        setPartySettings(prev => ({...prev, isArchived}));
    }, []);

    const setPrimaryParticipantId = useCallback((primaryParticipantId: string | null) => {
        setPartySettings(prev => ({...prev, primaryParticipantId}));
    }, []);

    // Memoize the return object to prevent unnecessary re-renders
    return useMemo(() => ({
        ...partySettings, 
        setIsShowRefund, 
        setLastViewed, 
        setIsArchived, 
        setPrimaryParticipantId
    }), [partySettings, setIsShowRefund, setLastViewed, setIsArchived, setPrimaryParticipantId]);
}