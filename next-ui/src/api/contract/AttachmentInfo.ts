export interface AttachmentInfo {
  readonly attachmentId: string;
  readonly fileName?: string | null;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly url: string;
  readonly expiresAt: Date; // parsed by sendRequest
}
