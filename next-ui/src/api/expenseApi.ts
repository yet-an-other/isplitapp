import { ensureDeviceId } from "./userApi";
import { PartyPayload } from "./contract/PartyPayload";
import { ProblemError } from "./contract/ProblemError";
import { ExpensePayload } from "./contract/ExpensePayload";
import { PartySettingsPayload } from "./contract/PartySettingsPayload";
import { IosSubscriptionPayload } from "./contract/IosSubscriptionPayload";
import { PartyInfo } from "./contract/PartyInfo";
import { ActivityInfo } from "./contract/ActivityInfo";
import { API_URL } from "../utils/apiConfig";
import type { AttachmentInfo } from "./contract/AttachmentInfo";
import type { PresignAttachmentRequest, PresignAttachmentResponse } from "./contract/PresignAttachment";

/**
 * Retrieve object or list of objects from the server as a json
 * @returns json
 */
export async function fetcher<TResponse>(key: string) {
    return await sendRequest<undefined, TResponse>('GET', key);
}

/**
 * Creates new party
 * @param partyId party id (generated client-side)
 * @param partyPayload new party data
 */
export async function createParty(partyId: string, partyPayload: PartyPayload) {
    const endpoint = `/parties/${partyId}`;
    await sendRequest('POST', endpoint, partyPayload);
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
 * Fetch parties from another device by device ID
 * @param deviceId the device ID to fetch parties from
 * @returns array of party info
 */
export async function fetchPartiesByDeviceId(deviceId: string): Promise<PartyInfo[]> {
    const endpoint = "/parties";
    return await sendRequestWithDeviceId<undefined, PartyInfo[]>('GET', endpoint, deviceId, undefined);
}

/**
 * Import parties from another device to current device
 * @param sourceDeviceId the device ID to import parties from
 * @returns array of imported party IDs
 */
export async function importPartiesFromDevice(sourceDeviceId: string): Promise<string[]> {
    // First, fetch all parties from the source device
    const sourceParties = await fetchPartiesByDeviceId(sourceDeviceId);
    
    const importedPartyIds: string[] = [];
    
    // Import each party one by one
    for (const sourceParty of sourceParties) {
        try {
            // To import party we need to visit the party endpoint with the current device ID
            //
            const party = await fetcher<PartyInfo>(`/parties/${sourceParty.id}`); // load the party
            importedPartyIds.push(party.id);
        } catch (error) {
            console.error(`Failed to import party "${sourceParty.name}":`, error);
            // Continue with other parties even if one fails
        }
    }
    
    return importedPartyIds;
}

/**
 * Fetch activity log for a party
 * @param partyId the party ID to fetch activities for
 * @returns array of activity info
 */
export async function fetchActivities(partyId: string): Promise<ActivityInfo[]> {
    const endpoint = `/parties/${partyId}/activities`;
    return await sendRequest<undefined, ActivityInfo[]>('GET', endpoint);
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
    return await sendRequestWithDeviceId<TBody, TResponse>(method, endpoint, deviceId, body);
}

/**
 * Helper function to get/post/put/delete communication with the server using a specific device ID
 * @param method HttpMethod
 * @param endpoint method url
 * @param deviceId specific device ID to use
 * @param body request body or undefined
 * @returns 
 */
async function sendRequestWithDeviceId<TBody, TResponse>(method:  HttpMethod, endpoint: string, deviceId: string, body?: TBody): Promise<TResponse> {
    const requestOptions = {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId
        },
        body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    if (!response.ok) {
        const errorJson = await response.json() as unknown;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new ProblemError(errorJson as any);
    }

    const buffer = (await response.arrayBuffer());
    return (buffer.byteLength === 0)
        ? {} as TResponse
        : JSON.parse(new TextDecoder().decode(buffer), parseDate) as TResponse;
}

// Attachments (V1): presign, finalize, list, delete

export async function presignExpenseAttachment(
    expenseId: string,
    payload: PresignAttachmentRequest
): Promise<PresignAttachmentResponse> {
    const endpoint = `/expenses/${expenseId}/attachments/presign`;
    return await sendRequest('POST', endpoint, payload);
}

export async function finalizeExpenseAttachment(expenseId: string, attachmentId: string): Promise<void> {
    const endpoint = `/expenses/${expenseId}/attachments/${attachmentId}/finalize`;
    await sendRequest('POST', endpoint);
}

export async function listExpenseAttachments(expenseId: string): Promise<AttachmentInfo[]> {
    const endpoint = `/expenses/${expenseId}/attachments`;
    return await sendRequest<undefined, AttachmentInfo[]>('GET', endpoint);
}

export async function deleteExpenseAttachment(expenseId: string, attachmentId: string): Promise<void> {
    const endpoint = `/expenses/${expenseId}/attachments/${attachmentId}`;
    await sendRequest('DELETE', endpoint);
}

// PUT upload to S3 using presigned URL
export async function uploadToPresignedUrl(url: string, headers: Record<string, string>, data: Blob | ArrayBuffer | Uint8Array): Promise<void> {
    try {
        // Ensure Content-Length if possible; some S3 providers are strict
        const extraHeaders: Record<string, string> = { ...headers };
        if (data instanceof Blob) {
            extraHeaders['Content-Length'] = String(data.size);
        } else if (data instanceof ArrayBuffer) {
            extraHeaders['Content-Length'] = String(data.byteLength);
        } else if (data instanceof Uint8Array) {
            extraHeaders['Content-Length'] = String(data.byteLength);
        }
        const request = new Request(url, {
            method: 'PUT',
            headers: extraHeaders,
            body: data as BodyInit,
        });
        const res = await fetch(request);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            // Surface key headers often required for debugging CORS
            const corsAllowOrigin = res.headers.get('access-control-allow-origin');
            const corsExposeHeaders = res.headers.get('access-control-expose-headers');
            throw new Error(
                `Upload failed: ${res.status} ${res.statusText}. Body: ${text || '<empty>'}. ` +
                `CORS allow-origin: ${corsAllowOrigin ?? '<none>'}, expose-headers: ${corsExposeHeaders ?? '<none>'}`
            );
        }
    } catch (err) {
        // Most common runtime error is TypeError: Failed to fetch (CORS/Network)
        if (err instanceof TypeError) {
            throw new Error(`Upload network error (likely CORS or blocked by browser): ${String(err.message)}. URL: ${url}`);
        }
        throw err;
    }
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

/**
 * Create an expense and return the new expenseId from the Location header
 * @param partyId party id
 * @param expensePayload new expense data
 * @returns new expense id
 */
export async function createExpenseAndReturnId(partyId: string, expensePayload: ExpensePayload): Promise<string> {
  const deviceId = await ensureDeviceId();
  const endpoint = `/parties/${partyId}/expenses`;
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(expensePayload),
  } as const;
  const res = await fetch(`${API_URL}${endpoint}`, requestOptions);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new ProblemError(errorJson as any);
  }
  const location = res.headers.get('Location');
  if (!location) throw new Error('Create expense: Location header is missing');
  const m = /\/expenses\/(0[\w]{10})/.exec(location);
  if (!m) throw new Error(`Create expense: unable to parse expenseId from Location: ${location}`);
  return m[1];
}

export type BlobToAttach = { fileName: string; blob: Blob; contentType: string; sizeBytes: number };
export async function uploadAttachmentsForExpense(expenseId: string, items: BlobToAttach[]): Promise<void> {
  for (const it of items) {
    const presigned = await presignExpenseAttachment(expenseId, {
      fileName: it.fileName,
      contentType: it.contentType,
      expectedSizeBytes: it.sizeBytes,
    });
    await uploadToPresignedUrl(presigned.uploadUrl, presigned.headers, it.blob);
    await finalizeExpenseAttachment(expenseId, presigned.attachmentId);
  }
}