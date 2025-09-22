import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { presignExpenseAttachment, finalizeExpenseAttachment, listExpenseAttachments, deleteExpenseAttachment, uploadToPresignedUrl } from '../../api/expenseApi';
import type { PresignAttachmentRequest, PresignAttachmentResponse } from '../../api/contract/PresignAttachment';
import type { AttachmentInfo } from '../../api/contract/AttachmentInfo';

// Ensure API_URL resolves for tests
vi.mock('../../utils/apiConfig', () => ({ API_URL: 'https://api.test' }));

const deviceId = '0abcdef1234';

// Mock ensureDeviceId to return a fixed value
vi.mock('../../api/userApi', async () => {
  return {
    ensureDeviceId: vi.fn(async () => deviceId),
  };
});

// Helper: mock fetch
function mockFetchOnce(status: number, body?: unknown, headers?: Record<string, string>) {
  const init: ResponseInit = { status, headers };
  const res = status === 204
    ? new Response(null, init)
    : new Response(body === undefined ? '' : JSON.stringify(body), init);
  (globalThis.fetch as unknown as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce(res);
}

function expectLastFetch(method: string, urlEndsWith: string, hasDeviceHeader = true, contentType?: string) {
  const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1] as [Request | string | URL, RequestInit?];
  const input = last[0];
  const init = last[1] ?? {};

  const actualMethod = input instanceof Request ? input.method : (init.method ?? 'GET');
  const actualUrl = input instanceof Request ? input.url : String(input);
  const headers = input instanceof Request ? input.headers : new Headers(init.headers ?? {});

  expect(actualMethod).toBe(method);
  expect(actualUrl).toMatch(new RegExp(`${urlEndsWith}$`));
  if (hasDeviceHeader) {
    expect(headers.get('X-Device-Id')).toBe(deviceId);
  }
  if (contentType) {
    expect(headers.get('Content-Type')).toBe(contentType);
  }
}

describe('expense attachment API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('presignExpenseAttachment sends correct payload and parses response', async () => {
    const request: PresignAttachmentRequest = {
      fileName: 'a.jpg',
      contentType: 'image/jpeg',
      expectedSizeBytes: 12345,
    };
    const response: PresignAttachmentResponse = {
      attachmentId: '0123456789ab',
      uploadUrl: 'https://s3.test/put',
      headers: { 'Content-Type': 'image/jpeg' },
      maxBytes: 512000,
      expiresAt: new Date(),
    };

    mockFetchOnce(200, response, { 'Content-Type': 'application/json' });

    const res = await presignExpenseAttachment('0aaaaaaaab', request);
    expect(res.attachmentId).toBe(response.attachmentId);
    expect(res.uploadUrl).toBe(response.uploadUrl);

    expectLastFetch('POST', '/expenses/0aaaaaaaab/attachments/presign', true, 'application/json');
  });

  it('finalizeExpenseAttachment calls endpoint with POST and device header', async () => {
    mockFetchOnce(204);
    await finalizeExpenseAttachment('0aaaaaaaab', '0bbbbbbbbc');
    expectLastFetch('POST', '/expenses/0aaaaaaaab/attachments/0bbbbbbbbc/finalize');
  });

  it('listExpenseAttachments returns array and parses dates', async () => {
    const nowIso = new Date().toISOString();
    const list: AttachmentInfo[] = [
      {
        attachmentId: '0ccccccccc1',
        fileName: 'r.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 100,
        url: 'https://s3.test/get',
        expiresAt: new Date(nowIso) as unknown as Date,
      },
    ];

    mockFetchOnce(200, list, { 'Content-Type': 'application/json' });

    const res = await listExpenseAttachments('0aaaaaaaab');
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].attachmentId).toBe('0ccccccccc1');
    expect(res[0].expiresAt instanceof Date).toBe(true);

    expectLastFetch('GET', '/expenses/0aaaaaaaab/attachments');
  });

  it('deleteExpenseAttachment calls DELETE', async () => {
    mockFetchOnce(204);
    await deleteExpenseAttachment('0aaaaaaaab', '0ddddddddd2');
    expectLastFetch('DELETE', '/expenses/0aaaaaaaab/attachments/0ddddddddd2');
  });

  it('uploadToPresignedUrl performs PUT with provided headers', async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(new Response('', { status: 200 }));

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    await uploadToPresignedUrl('https://s3.test/put', { 'Content-Type': 'image/jpeg' }, blob);

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const last = calls[calls.length - 1] as [Request | string | URL, RequestInit?];
    const input = last[0];
    const req = input as Request;
    expect(req.method).toBe('PUT');
    expect(req.url).toBe('https://s3.test/put');
    expect(req.headers.get('Content-Type')).toBe('image/jpeg');
  });
});
