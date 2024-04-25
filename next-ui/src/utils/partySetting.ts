import { useEffect, useState } from "react";

export class PartySetting {

    constructor(partyId: string) {
        this.partyId = partyId;
    }
    partyId = '';
    isArchived = false;
    isShowRefund = true;
    lastViewed = "zzzzzzz";

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
    const [partySettings, setPartySettings] = useState(PartySetting.load(partyId));

    useEffect(() => {
        PartySetting.save(partySettings);
    }, [partySettings]);

    const setIsShowRefund = (isShowRefund: boolean) => setPartySettings({...partySettings, isShowRefund: isShowRefund});
    const setLastViewed = (lastViewed: string) => setPartySettings({...partySettings, lastViewed: lastViewed});
    const setIsArchived = (isArchived: boolean) => setPartySettings({...partySettings, isArchived: isArchived});

    return {...partySettings, setIsShowRefund, setLastViewed, setIsArchived} as const;
}