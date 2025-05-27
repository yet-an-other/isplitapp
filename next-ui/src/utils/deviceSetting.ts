import { useEffect, useState } from "react";

const settingsKey = 'settings';
export type PartyIconStyle = 'bauhaus' | 'marble' | 'none';

export class DeviceSetting {

    partyIconStyle : PartyIconStyle = 'bauhaus';

    static save(settings: DeviceSetting) {
        localStorage.setItem(
            settingsKey, 
            JSON.stringify(settings)
        );
    }

    static load(): DeviceSetting {
        const setting = localStorage.getItem(settingsKey);
        if (setting) {
            return JSON.parse(setting) as DeviceSetting;
        }
        return new DeviceSetting();
    }
}

    /**
     * @returns a hook that returns the current device settings and a setter.
     * The setter will update the device settings and also save them to local storage.
     * The device settings are loaded from local storage when the component mounts,
     * and changed settings are saved to local storage when the component is unmounted.
     */
export function useDeviceSetting() {
    const [deviceSettings, setDeviceSettings] = useState(DeviceSetting.load());

    useEffect(() => {
        DeviceSetting.save(deviceSettings);
    }, [deviceSettings]);

    const setPartyIconStyle = (partyIconStyle: PartyIconStyle) => setDeviceSettings({...deviceSettings, partyIconStyle: partyIconStyle});

    return {...deviceSettings, setPartyIconStyle} as const;
}
