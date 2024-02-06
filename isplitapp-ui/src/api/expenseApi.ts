import { ensureUserId } from "./userApi";
import { PartyInfo } from "./contract/PartyInfo";
import { PartyPayload } from "./contract/PartyPayload";
import { ProblemError } from "./contract/ProblemError";
import { ExpenseInfo } from "./contract/ExpenseInfo";
import { ExpensePayload } from "./contract/ExpensePayload";
import { BalanceInfo } from "./contract/BalanceInfo";

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Retrieve party list from the server
 * @returns {PartyInfo[]}
 */
export async function fetchPartyList() {
    const endpoint = "/parties"
    return await fetchResult<undefined, PartyInfo[]>('GET', endpoint, undefined)
}

/**
 * Creates new party
 * @param partyPayload new party data
 */
export async function createParty(partyPayload: PartyPayload) {
    const endpoint = "/parties"
    await sendBody('POST', endpoint, partyPayload);
}

/**
 * Updates existing party party
 * @param partyPayload new party data
 */
export async function updateParty(partyId: string, partyPayload: PartyPayload) {
    const endpoint = `/parties/${partyId}`;
    return await sendBody<PartyPayload>('PUT', endpoint, partyPayload);
}

/**
 * Retrieve party from the server
 * @param partyId Unique party id
 * @returns {PartyInfo}
 */
export async function fetchParty(partyId: string) {
    const endpoint = `/parties/${partyId}`;
    return await fetchResult<undefined, PartyInfo>('GET', endpoint, undefined);
}

/**
 * Fetche the list of all expenses in the party
 * @param partyId 
 * @returns {ExpenseInfo[]}
 */
export async function fetchExpenseList(partyId: string) {
    const endpoint = `/parties/${partyId}/expenses`;
    return await fetchResult<undefined, ExpenseInfo[]>('GET', endpoint, undefined);
}

/**
 * Add new expense
 * @param partyPayload new party data
 */
export async function createExpense(partyId: string, expensePayload: ExpensePayload) {
    const endpoint = `/parties/${partyId}/expenses`
    await sendBody('POST', endpoint, expensePayload);
}

/**
 * Get expense
 */
export async function fetchExpense(expenseId: string) {
    const endpoint = `/expenses/${expenseId}`
    return await fetchResult<undefined, ExpenseInfo>('GET', endpoint, undefined);
}

/**
 * Add new expense
 * @param partyPayload new party data
 */
export async function updateExpense(expenseId: string, expensePayload: ExpensePayload) {
    const endpoint = `/expenses/${expenseId}`
    await sendBody('PUT', endpoint, expensePayload);
}


/**
 * Get Balance
 */
export async function fetchBalance(partyId: string) {
    const endpoint = `/parties/${partyId}/balance`
    return await fetchResult<undefined, BalanceInfo>('GET', endpoint, undefined);
}

/**
 * Allowed Http methods
 */
type HttpMethod = 'GET'|'POST'|'PUT'|'DELETE';


/**
 * Helper function to get/post/put/delete communication with the server
 * @param method HttpMethod
 * @param endpoint method url
 * @param body request body or undefined
 * @returns 
 */
async function commonFetch<TBody>(method:  HttpMethod, endpoint: string, body: TBody): Promise<Response> {
    const userId = await ensureUserId();

    const requestOptions = {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'X-USER-ID': userId
        },
        body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    if (!response.ok)
        throw new ProblemError(await response.json())

    return response;
}

async function fetchResult<TBody, TResult>(method:  HttpMethod, endpoint: string, body: TBody): Promise<TResult> {
    const result = await commonFetch(method, endpoint, body)
    return await result.json() as TResult;
}

async function sendBody<TBody>(method:  HttpMethod, endpoint: string, body: TBody) {
    await commonFetch(method, endpoint, body)
    return;
}

