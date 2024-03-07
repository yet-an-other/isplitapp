import { User } from "./contract/User";

const LS_USER_KEY = 'user-id';
const API_URL = import.meta.env.VITE_API_URL as string;

/**
 * Returns id of the current user
 *
 * @remarks
 * At first the function is check the local storage and only if user id is not there, 
 * the function will fetch it from the server.
 */
export async function ensureUserId(): Promise<string> {
    const method = "/login";
    let userId = localStorage.getItem(LS_USER_KEY);
    if (!userId) {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };

        const response = await fetch(`${API_URL}${method}`, requestOptions);
        userId = (await response.json() as User).id;

        if (userId)
            localStorage.setItem(LS_USER_KEY, userId);
    }

    return userId;
}