
import { useCallback, useMemo } from "react";
import useLocalStorageState from "use-local-storage-state";

const settingsKey = 'settings';
export type PartyIconStyle = 'bauhaus' | 'marble' | 'beam' | 'none';

export class DeviceSetting {

    partyIconStyle : PartyIconStyle = 'bauhaus';
    
    defaultUserName = '';
}

    /**
     * @returns a hook that returns the current device settings and a setter.
     * The setter will update the device settings and also save them to local storage.
     * The device settings are loaded from local storage when the component mounts,
     * and changed settings are saved to local storage when the component is unmounted.
     */
export function useDeviceSetting() {

    const [deviceSettings, setDeviceSettings] = useLocalStorageState<DeviceSetting>(
        settingsKey, 
        { 
            defaultValue: new DeviceSetting(),
            storageSync: true,
        }
    );

    const setPartyIconStyle = useCallback((partyIconStyle: PartyIconStyle) => {
        setDeviceSettings(prev => ({...prev, partyIconStyle}));
    }, [setDeviceSettings]);
    
    const setDefaultUserName = useCallback((defaultUserName: string) => {
        setDeviceSettings(prev => ({...prev, defaultUserName}));
    }, [setDeviceSettings]);

    return useMemo(() => 
        ({...deviceSettings, setPartyIconStyle, setDefaultUserName}),
        [deviceSettings, setPartyIconStyle, setDefaultUserName]
    );
}


