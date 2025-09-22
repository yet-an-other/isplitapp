export interface PresignAttachmentRequest {
  readonly fileName: string;
  readonly contentType: string; // image/jpeg | image/png | image/webp
  readonly expectedSizeBytes: number; // must be <= 512000
}

export interface PresignAttachmentResponse {
  readonly attachmentId: string;
  readonly uploadUrl: string;
  readonly headers: Record<string, string>; // typically { 'Content-Type': '...' }
  readonly maxBytes: number;
  readonly expiresAt: Date; // parsed by sendRequest
}
