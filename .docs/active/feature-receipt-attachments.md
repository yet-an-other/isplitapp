## Feature Plan: Receipt Photo Attachments for Expenses

### Summary
Enable users to attach up to 3 receipt photos to an expense, view them on the expense create/edit and detail pages, and see a preview in the expense list. Photos are stored securely in S3 via presigned uploads with client-side image compression and strict limits (≤ 500 KB per file on server).

### Goals
- Attach up to 3 images to any expense.
- View previously attached images on expense Edit/View pages and show small previews in the expense list.
- Store images in S3 (private bucket) using presigned POST/GET URLs.
- Enforce attachment count and size limits, with client-side compression to meet ≤ 500 KB.
- Reuse existing backend patterns: IEndpoint, RequestValidator, AuidFactory, ExpenseDb (linq2db), CommonQuery logging, NotificationService.
- Reuse existing front-end API approach (`sendRequest`, `ensureDeviceId`) and state handling.

### Non‑Goals
- No generic media library or non-image types.
- No server-side image transformations (optional future work).

---

## Requirements (explicit)
- User can attach receipt photos to an expense in a group.
- User can review previously attached photos in Edit/View expense page and in expense list.
- Photos are stored in S3.
- Max 3 attachments per expense.
- Each attachment must not exceed 500 KB “on server”; use client-side compression to guarantee this.

## Assumptions
- Use AWS S3 or S3-compatible storage (e.g., MinIO) with SDK v3 for .NET.
- Private bucket with presigned POST for uploads, presigned GET for viewing.
- We’ll generate short-lived presigned URLs server-side.
- We follow existing minimal API structure in `core/Expenses/Endpoints/*` and database style in `core/Expenses/Data/*` using LinqToDB.
 - Users may start creating a new expense, attach images, and abandon without saving the expense. Design must prevent orphaned data and allow recovery.

---

## Data Model
Add a new table `expense_attachment`:
- id (Auid, PK)
- expense_id (Auid, FK -> expense.id)
- file_name (text, nullable)
- content_type (text, not null) — allow image/jpeg, image/png, image/webp
- size_bytes (int, not null)
- s3_key (text, unique, not null) — e.g., `expenses/{expenseId}/{attachmentId}`
- created_at (timestamptz, default now)

Indexes:
- (expense_id)
- unique (s3_key)

Constraints:
- Check size_bytes <= 512000 (server-side hard limit; client targets ~450 KB to be safe).
- Enforce ≤ 3 rows per expense via logic in endpoints (and optionally via partial index if desired).

Add a new table `draft_attachment` to support attachments before an expense exists:
- id (Auid, PK)
- device_id (Auid, required) — to associate with the creator device
- party_id (Auid, required) — attachments are scoped to a party during creation
- file_name (text)
- content_type (text, not null)
- size_bytes (int, not null)
- s3_key (text, unique, not null) — e.g., `drafts/{deviceId}/{draftId}`
- created_at (timestamptz, default now)
- expires_at (timestamptz, indexed) — for TTL cleanup (e.g., 24–48h)

Indexes:
- (device_id, party_id)
- (expires_at)

Constraints:
- Check size_bytes ≤ 512000
- Limit to ≤ 3 draft attachments per device+party active draft

Migration:
- Create `V8Migration` adding `expense_attachment` and needed indexes.
- Update `Migrations.csproj` if necessary and wire through `MigrationRunner` (reuse existing pattern from prior `VxMigration.cs`).

---

## Backend Design (ASP.NET Core)

Follow existing patterns in `core/Expenses/Endpoints/*`:
- Use `IEndpoint` classes with `PathPattern`, `Method`, `Build`, and `Endpoint` delegate.
- Validate headers and params via `RequestValidator` (`X-Device-Id`, route Auid parsing).
- Use `AuidFactory` to generate IDs and timestamps.
- Use `ExpenseDb` (LinqToDB) for DB operations; wrap multi-step changes in transactions.
- Log via `CommonQuery.LogActivityAsync` and notify via `NotificationService` similar to expense updates.

Endpoints (new):
1) POST /expenses/{expenseId}/attachments/presign
   - Purpose: Request a presigned POST for S3 to upload one image. Returns an attachmentId and the form fields required for direct upload.
   - Input: { fileName: string, contentType: string, expectedSizeBytes: number }
   - Steps:
     - Validate deviceId & expenseId.
     - Check expense exists and belongs to a party accessible by device.
     - Count attachments for expense; if ≥ 3, return 409/400.
     - Validate contentType (jpeg/png/webp) and expectedSizeBytes ≤ 512000.
     - Create new attachment row with status “pending” (implicit; can omit explicit status if we rely on finalize step), store s3_key.
     - Generate S3 presigned POST with conditions:
       - content-length-range: 1 to 512000
       - content-type must match
       - key = computed s3_key
       - short expiration (e.g., 5 minutes)
     - Return: { attachmentId, uploadUrl, fields, maxBytes: 512000 }

2) POST /expenses/{expenseId}/attachments/{attachmentId}/finalize
   - Purpose: Confirm upload is done (client calls after successful upload).
   - Input: none (or ETag optional)
   - Steps:
     - Validate IDs and existence of the attachment for the expense.
     - Optionally verify object exists and size/content-type via S3 HEAD.
     - Update `size_bytes`, `content_type`, `file_name` (if not set), set as “complete”.
     - Log activity: “ExpenseAttachmentAdded”.
     - Push notification via `NotificationService` similar to Create/Update expense.
     - Return 204.

3) GET /expenses/{expenseId}/attachments
   - Purpose: List attachments for expense with short-lived presigned GET URLs for display.
   - Output: Array of { attachmentId, fileName, contentType, sizeBytes, url, expiresAt }
   - Steps:
     - Validate device & expense.
     - Fetch rows; for each, generate presigned GET (e.g., 10 minutes).

4) DELETE /expenses/{expenseId}/attachments/{attachmentId}
   - Purpose: Remove an attachment.
   - Steps:
     - Validate IDs.
     - Delete S3 object, then delete DB row in a transaction.
     - Log activity: “ExpenseAttachmentRemoved”.
     - Notify via `NotificationService`.

Service wiring:
- Add S3 client setup in `ServiceExtension`:
  - Read config from `appsettings.json` (S3:Endpoint, Region, AccessKey, SecretKey, Bucket, UseMinio, ForcePathStyle).
  - Register a small `IAttachmentStorage` service encapsulating presign POST/GET and HEAD/delete operations.
  - Follow existing DI style (singleton for config, transient for service).

Validation:
- Reuse `RequestValidator` and FluentValidation as in other payloads.
- On presign, validate expectedSizeBytes and contentType.
- Enforce ≤ 3 attachments server-side before issuing a presign.

Activity & Notifications:
- Use `CommonQuery.LogActivityAsync(partyId, deviceId, "ExpenseAttachmentAdded", ...)` and “…Removed”.
- Use `NotificationService.PushExpenseUpdateMessage(deviceId, expenseId, "Receipt added")`/"Receipt removed".

Security:
- Bucket is private; only presigned URLs expose limited access.
- Short TTL for presigned URLs.
- Strict content-length-range in presigned POST policy.
- Prefix keys with `expenses/{expenseId}/` to avoid collisions; ensure only authorized users can request presigns for those keys.

Draft flow (for new expenses with unknown expenseId):
- Users can attach images to a “draft” under a party before saving the expense.
- Endpoints (draft):
  5) POST /parties/{partyId}/expenses/drafts/attachments/presign
    - Same validation as expense presign but scoped by deviceId+partyId.
    - Enforce ≤ 3 draft attachments per device+party.
    - Create row in `draft_attachment` and presign S3 key `drafts/{deviceId}/{draftId}`.
  6) POST /parties/{partyId}/expenses/drafts/attachments/{draftId}/finalize
    - HEAD object and update size/content_type/file_name.
  7) GET /parties/{partyId}/expenses/drafts/attachments
    - List draft attachments for current device in this party with presigned GETs.
  8) DELETE /parties/{partyId}/expenses/drafts/attachments/{draftId}
    - Delete draft row and object.
- Promotion on expense save (create):
  - After `POST /parties/{partyId}/expenses`, if the client indicates draft attachments present, server migrates draft rows to `expense_attachment` and renames/moves S3 keys:
   - Copy or move object from `drafts/{deviceId}/{draftId}` to `expenses/{expenseId}/{attachmentId}` (prefer server-side COPY then DELETE to avoid client reupload).
   - Insert attachment rows under new expenseId in a transaction.
   - Log activity and notify once.
- Abandoned drafts cleanup:
  - Background job (or scheduled endpoint) deletes `draft_attachment` with `expires_at < now`, and corresponding S3 objects.
  - TTL default 48h; configurable.

---

## Front-End Design (Vite + React/TS in `next-ui`)

API additions (`src/api/expenseApi.ts`):
- `presignExpenseAttachment(expenseId, { fileName, contentType, expectedSizeBytes })` -> returns { attachmentId, uploadUrl, fields, maxBytes }
- `finalizeExpenseAttachment(expenseId, attachmentId)` -> void
- `listExpenseAttachments(expenseId)` -> AttachmentInfo[] with presigned GET URLs
- `deleteExpenseAttachment(expenseId, attachmentId)` -> void

Reuse patterns:
- Use `sendRequest`/`sendRequestWithDeviceId` and `ensureDeviceId` to keep `X-Device-Id`.
- Parse JSON with existing helper and error handling (`ProblemError`).

UI/UX updates:
- Expense Create/Edit page:
  - Add “Receipts” section with an attachment grid (max 3 slots).
  - Each slot shows a preview thumbnail, size, and a delete button.
  - Add button: “Add photo (max 3)”.
  - On add: open file picker (accept: image/*). For each file:
    1. Compress client-side to target ≤ 450 KB (see compression below).
    2. Call presign endpoint with contentType and size.
    3. Upload to S3 using returned `uploadUrl` + `fields` (multipart/form-data POST).
    4. On success, call finalize endpoint.
    5. Refresh list via `listExpenseAttachments`.
- Expense View page:
  - Show thumbnails under expense details. Clicking opens full-size image in a modal.
- Expense List page:
  - If attachments exist, show a small paperclip icon and (optionally) the first thumbnail (lazy-loaded).

Client-side compression:
- Implement a utility `compressImage(file, { maxSizeKB: 450, maxWidth: 2000, maxHeight: 2000, mimeType: image/jpeg|webp })`.
- Prefer WebP or JPEG (choose based on browser support; default WebP with fallback to JPEG).
- Use Canvas/OffscreenCanvas to resize and re-encode; or a lightweight lib (e.g., `browser-image-compression`) if acceptable.
- Ensure output Blob size ≤ 450 KB before presign call (retry with lower quality if needed).

Edge cases:
- Reject non-image types early.
- Multiple selections beyond available slots: cap to remaining.
- Upload cancellation and progress UI.
- Handle presign expiration: if upload fails due to expiry, re-presign.
 - New expense without id: use draft endpoints and store draft state per party+device; on successful expense creation, call “attach-drafts” sequence to promote.

Accessibility & i18n:
- Add alt text like “Receipt 1 of 3 for {expense.title}”.
- Localize labels and errors using existing i18n pattern.

---

## Configuration & Deploy
- Backend `appsettings.json` / environment:
  - S3:Endpoint, Region, Bucket, AccessKey, SecretKey, UseMinio, ForcePathStyle, PresignExpiryMinutes.
- Helm values: add corresponding env vars and secrets; wire via `deploy/helm/values.yaml` and templates (no code change in this PR; plan only).
- Dev: support MinIO locally with `ForcePathStyle=true` and custom Endpoint.

### S3 Bucket CORS (required)
For browser-based presigned uploads to work, configure CORS on the bucket to allow your web origins to PUT. Example for AWS S3:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>http://localhost:5173</AllowedOrigin>
    <AllowedOrigin>https://dev.isplit.app</AllowedOrigin>
    <AllowedOrigin>https://isplit.app</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>content-type</AllowedHeader>
    <AllowedHeader>x-amz-acl</AllowedHeader>
    <AllowedHeader>x-amz-meta-*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>x-amz-request-id</ExposeHeader>
    <ExposeHeader>x-amz-id-2</ExposeHeader>
    <MaxAgeSeconds>300</MaxAgeSeconds>
  </CORSRule>
  <!-- Optionally allow wildcard headers -->
  <!-- <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>300</MaxAgeSeconds>
  </CORSRule> -->
  
</CORSConfiguration>
```

Notes:
- The client sets only `Content-Type` for presigned PUT; include it in AllowedHeader to satisfy the preflight.
- If you choose to add `x-amz-acl` (e.g., `private`) to uploads, also allow it in headers.
- You do not list `OPTIONS` in S3 CORS; S3 answers preflight automatically when the actual method (PUT/GET) is allowed.
- For AWS, prefer virtual-hosted-style URLs (e.g., `https://<bucket>.s3.<region>.amazonaws.com/...`). If using a custom endpoint or MinIO, set `ForcePathStyle=true` and configure CORS on that endpoint accordingly.

MinIO/R2 example (JSON):

```json
[
  {
    "AllowedOrigin": ["http://localhost:5173", "https://dev.isplit.app", "https://isplit.app"],
    "AllowedMethod": ["PUT", "GET", "HEAD"],
    "AllowedHeader": ["content-type", "x-amz-acl", "x-amz-meta-*"],
    "ExposeHeader": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

Backend guardrails:
- The API now throws a clear startup error if `S3:Bucket` is missing to avoid generating unusable presigned URLs.
- Presigned URLs are short-lived and require the exact `Content-Type` the client will upload with.

---

## Logging, Metrics, and Tracing
- Log attachment operations at info level with expenseId and attachmentId (no PII).
- Record failures from S3 interactions with exception details.
- Emit counters: attachments_created, attachments_deleted, attachments_bytes_total.
- Include activity logs via `CommonQuery` for user-visible history.

---

## Testing Plan
- Backend unit tests:
  - Presign rejects when already 3 attachments.
  - Presign enforces allowed content types and size.
  - Finalize requires existing pending row and updates metadata.
  - List returns entries with valid presigned GETs (mock clock to validate TTL windows).
  - Delete removes both S3 and DB (mock S3 client).
- Integration tests (API): happy path and error flows.
- Front-end unit/integration (Vitest+RTL):
  - Compression utility produces ≤ 450 KB for typical phone photos (use fixtures, skip on CI if oversized).
  - Presign+POST+finalize sequence.
  - UI caps at 3 attachments and updates previews.

---

## Rollout & Migration
- Add `V8Migration` and run migrations through existing `MigrationRunner`.
- Feature flag (optional): hide UI until backend is deployed.
- Backfill: none required (attachments are new).

---

## Risks & Mitigations
- Large images still exceeding 500 KB after compression: progressively reduce quality/resolution; show clear error if cannot meet limit.
- Presigned URL misuse: short TTLs, strict conditions, private bucket.
- S3 latency: perform uploads directly from client; show progress and retries.
- Privacy: keep bucket private; URLs are short-lived; do not log raw URLs.

---

## Acceptance Criteria
- User can attach up to 3 images (jpeg/png/webp), each ≤ 500 KB on server, to an expense.
- Attachments are visible in edit/view and indicated in expense list.
- Deleting attachments works and updates UI immediately.
- Limits enforced on both client and server.
- Images are stored in S3 under expense-specific keys; bucket remains private.

---

## Task Breakdown (with steps)

1) DB migration for attachments
  - [x] Draft schema for `expense_attachment` (id, expense_id, file_name, content_type, size_bytes, s3_key, created_at)
  - [x] Create `V8Migration` with CREATE TABLE and indexes
  - [x] Add size_bytes check constraint (≤ 512000)
  - [x] Ensure FK to `expense.id`
  - [ ] Run migration locally
  - [ ] Add/extend test in `Tests/MigrationRunnerTest.cs`
  - [ ] Add constraint ≤ 3 per device+party

2) S3 storage service
  - [x] Define config section (Endpoint, Region, Bucket, AccessKey, SecretKey, ForcePathStyle, PresignExpiryMinutes)
  - [x] Create options class and bind in `ServiceExtension`
  - [x] Implement `IAttachmentStorage` interface
  - [x] Implement CreatePresignedUpload (using presigned PUT in V1) with content-type; enforce size on finalize via HEAD
  - [x] Implement CreatePresignedGet with short TTL
  - [x] Implement HeadObject and DeleteObject
  - [x] Register service in DI (`ServiceExtension`)
  - [x] Implement server-side copy (for future promotion)


3) Backend endpoints
  - [x] Add folder `core/Expenses/Endpoints/Attachments`
  - [x] Implement Presign: `POST /expenses/{expenseId}/attachments/presign`
  - [x] Implement Finalize: `POST /expenses/{expenseId}/attachments/{attachmentId}/finalize`
  - [x] Implement List: `GET /expenses/{expenseId}/attachments`
  - [x] Implement Delete: `DELETE /expenses/{expenseId}/attachments/{attachmentId}`
  - [x] Enforce ≤ 3 attachments per expense (pre-presign)
  - [x] Validate content types (jpeg/png/webp) and size ≤ 512000
  - [x] Use transactions where needed; update DB rows
  - [x] Activity log: Added/Removed
  - [x] Notifications via `NotificationService`

4) Front-end API additions
  - [x] Add `presignExpenseAttachment` in `src/api/expenseApi.ts`
  - [x] Add `finalizeExpenseAttachment` in `src/api/expenseApi.ts`
  - [x] Add `listExpenseAttachments` in `src/api/expenseApi.ts`
  - [x] Add `deleteExpenseAttachment` in `src/api/expenseApi.ts`
  - [x] Implement PUT upload to S3 using presigned URL and returned headers (Content-Type)
  - [ ] Add error mapping for presign expiry and size errors

5) Client-side compression utility
  - [x] Create `src/utils/imageCompression.ts`
  - [x] Implement canvas-based resize + encode (WebP/JPEG), target ≤ 450 KB
  - [x] Add retries with quality reduction if > 450 KB
  - [x] Export helper to return Blob + contentType
  - [x] Unit tests with deterministic mocks (no large fixtures needed)

6) UI changes
  - [x] Expense View: thumbnails + full-size modal
  - [ ] Expense List: show paperclip/preview indicator
  - [ ] Add i18n strings (labels, errors)
  - [ ] Ensure accessibility (alt text, keyboard)


7) Telemetry & logs
  - [ ] Add structured logs for presign/finalize/list/delete
  - [ ] Add basic counters (if metrics infra exists) or document follow-up
  - [ ] Validate no sensitive data in logs/URLs
  - [ ] Distinguish logs between draft and expense attachment flows

8) E2E validation
  - [ ] Manual: create expense and attach 1–3 images
  - [ ] Verify uploaded object sizes ≤ 500 KB in S3
  - [ ] Delete an attachment and confirm removal in UI and S3
  - [ ] Confirm activity log and push notifications
  - [ ] Start a new expense, add drafts, abandon; confirm drafts are visible when returning (same device) within TTL and auto-clean after TTL

---

## References to Reuse (existing code)
- Minimal API & validation: `core/Expenses/Endpoints/*` and `core/Infrastructure/RequestValidator.cs`
- IDs/timestamps: `IB.Utils.Ids.Auid`, `AuidFactory`
- DB access: `ExpenseDb` (LinqToDB), patterns in `ExpenseCreate`, `ExpenseUpdate`
- Activity log: `CommonQuery.LogActivityAsync` usage in `ExpenseCreate`/`ExpenseUpdate`
- Notifications: `NotificationService.PushExpenseUpdateMessage`
- Front-end requests: `src/api/expenseApi.ts` with `sendRequest`, `ensureDeviceId`

---

## Open Questions
- Thumbnail generation: for bandwidth we could generate an additional small preview client-side and upload as a second object (optional future).
- CDN: Do we want CloudFront in front of S3 for GETs? For now, presigned GET directly to S3 is acceptable.
