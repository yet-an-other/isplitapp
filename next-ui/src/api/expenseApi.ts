import { ensureDeviceId } from "./userApi";
import { PartyPayload } from "./contract/PartyPayload";
import { ProblemError } from "./contract/ProblemError";
import { ExpensePayload } from "./contract/ExpensePayload";
import { PartySettingsPayload } from "./contract/PartySettingsPayload";
import { IosSubscriptionPayload } from "./contract/IosSubscriptionPayload";
import { API_URL } from "../utils/apiConfig";

/**
 * Retrieve object or list of objects from the server as a json
 * @returns json
 */
export async function fetcher<TResponse>(key: string) {
    return await sendRequest<undefined, TResponse>('GET', key);
}

/**
 * Creates new party
 * @param partyPayload new party data
 * @returns location
 */
export async function createParty(partyPayload: PartyPayload) {
    const endpoint = "/parties"
    const { partyId } = await sendRequest<PartyPayload, { partyId: string }>('POST', endpoint, partyPayload);
    return partyId;
}

/**
 * Updates existing party party
 * @param partyPayload new party data
 */
export async function updateParty(partyId: string, partyPayload: PartyPayload) {
    const endpoint = `/parties/${partyId}`;
    await sendRequest('PUT', endpoint, partyPayload);
}

/**
 * Updates existing party party
 * @param partyPayload new party data
 */
export async function updatePartySetings(partyId: string, partySettingsPayload: PartySettingsPayload) {
    const endpoint = `/parties/${partyId}/settings`;
    await sendRequest('PUT', endpoint, partySettingsPayload);
}

/**
 * Add new expense
 * @param partyId party id
 * @param expensePayload new party data
 */
export async function createExpense(partyId: string, expensePayload: ExpensePayload) {
    const endpoint = `/parties/${partyId}/expenses`
    await sendRequest('POST', endpoint, expensePayload);
}

/**
 * Update expense
 * @param expenseId expense id
 * @param partyPayload new party data
 */
export async function updateExpense(expenseId: string, expensePayload: ExpensePayload) {
    const endpoint = `/expenses/${expenseId}`
    await sendRequest('PUT', endpoint, expensePayload);
}

/**
 * Unfollow party
 */
export async function unfollowParty(partyId: string) {
    const endpoint = `/parties/${partyId}`
    await sendRequest('DELETE', endpoint);
}

/**
 * Delete expense
 */
export async function deleteExpense(expenseId: string) {
    const endpoint = `/expenses/${expenseId}`
    await sendRequest('DELETE', endpoint);
}

/**
 * Subscribe user to push notifications
 */
export async function registerSubscription(subscriptionPayload: PushSubscription | IosSubscriptionPayload) {
    const endpoint = `/users/subscribe`
    await sendRequest('POST', endpoint, subscriptionPayload);
}

/**
 * Delete user subscription
 */
export async function deleteSubscription() {
    const endpoint = `/users/subscribe`
    await sendRequest('DELETE', endpoint);
}

/**
 * Allowed Http methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';


/**
 * Helper function to get/post/put/delete communication with the server
 * @param method HttpMethod
 * @param endpoint method url
 * @param body request body or undefined
 * @returns 
 */
async function sendRequest<TBody, TResponse>(method:  HttpMethod, endpoint: string, body?: TBody): Promise<TResponse> {
    const deviceId = await ensureDeviceId();

    const requestOptions = {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId
        },
        body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    if (!response.ok)
        throw new ProblemError(await response.json());

    const buffer = (await response.arrayBuffer());
    return (buffer.byteLength === 0)
        ? {} as TResponse
        : JSON.parse(new TextDecoder().decode(buffer), parseDate) as TResponse;
}

const datePattern = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/

const parseDate = (_: string, value: string) => {
    if (typeof value !== 'string') {
        return value;
    }
    if (datePattern.test(value)) {
        return new Date(value);
    }
    return value;
}