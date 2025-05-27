import { Device } from "./contract/Device";
import { API_URL } from "../utils/apiConfig";

const LS_USER_KEY = 'user-id';
const LS_DEVICE_KEY = 'device-id';

/**
 * Returns id of the current user
 *
 * @remarks
 * At first the function is check the local storage and only if user id is not there, 
 * the function will fetch it from the server.
 */
export async function ensureDeviceId(): Promise<string> {

    let deviceId = localStorage.getItem(LS_DEVICE_KEY);
    if (!deviceId) {
        deviceId = localStorage.getItem(LS_USER_KEY);
        if (deviceId) {
            deviceId = `0${deviceId.substring(0, 10)}`
            localStorage.setItem(LS_DEVICE_KEY, deviceId);
        } else {
            deviceId = await fetchDeviceId();
            if (deviceId)
                localStorage.setItem(LS_DEVICE_KEY, deviceId);
        }
    }

    return deviceId;
}

async function fetchDeviceId(): Promise<string> {
    const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    };

    const response = await fetch(`${API_URL}/login`, requestOptions);
    return (await response.json() as Device).id;
}