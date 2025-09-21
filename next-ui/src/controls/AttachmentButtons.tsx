import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import useSWR, { mutate } from "swr";
import { Button, Spinner } from "@heroui/react";
import { PaperclipIcon } from "../icons/PaperclipIcon";
import { CameraAddIcon } from "../icons/CameraAddIcon";
import { useHeroUIAlerts as useAlerts } from "../utils/useHeroUIAlerts";
import { useFileProcessor } from "../utils/useFileProcessor";
import { useIsMobile, hasCameraSupport } from "../utils/deviceDetection";
import {
  finalizeExpenseAttachment,
  listExpenseAttachments,
  presignExpenseAttachment,
  uploadToPresignedUrl
} from "../api/expenseApi";
import type { AttachmentInfo } from "../api/contract/AttachmentInfo";

// Unified attachment format that represents both server and draft attachments
export interface Attachment {
  id: string;
  fileName: string;
  url: string; // API URL or blob URL
  sizeBytes: number;
  type: 'server' | 'draft';
}

export interface AttachmentButtonsProps {
  expenseId?: string; // If provided, uploads directly to server
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  max?: number;
}

/**
 * AttachmentButtons - handles file selection/upload with header
 *
 * Behavior:
 * - If expense exists: uploads directly to server, manages server attachments
 * - If expense doesn't exist: keeps files on client as drafts
 * - Produces unified attachment array format
 *
 * Usage:
 *   <AttachmentButtons
 *     expenseId={expenseId}
 *     attachments={attachments}
 *     onAttachmentsChange={setAttachments}
 *     max={3}
 *   />
 */
export default function AttachmentButtons({
  expenseId,
  attachments,
  onAttachmentsChange,
  max = 3
}: AttachmentButtonsProps) {
  const { t } = useTranslation();
  const { alertError, alertInfo } = useAlerts();
  const isMobile = useIsMobile();
  const [hasCamera, setHasCamera] = React.useState(false);

  // Check for camera support on mount
  //
  React.useEffect(() => {
    if (isMobile) {
      hasCameraSupport().then(setHasCamera);
    }
  }, [isMobile]);

  // Load existing server attachments if expense exists
  //
  const key = expenseId ? `/expenses/${expenseId}/attachments` : null;
  const { data: serverAttachments, error } = useSWR<AttachmentInfo[]>(key, async () => await listExpenseAttachments(expenseId!));

  // Update attachments when server data loads
  //
  const updateAttachmentsFromServer = useCallback(() => {
    if (serverAttachments && expenseId) {
      const serverAttachmentsList: Attachment[] = serverAttachments.map(attachment => ({
        id: attachment.attachmentId,
        fileName: attachment.fileName ?? 'receipt',
        url: attachment.url,
        sizeBytes: attachment.sizeBytes,
        type: 'server' as const
      }));

      // Only update if different to avoid infinite loops
      //
      const currentServerIds = attachments.filter(a => a.type === 'server').map(a => a.id).sort();
      const newServerIds = serverAttachmentsList.map(a => a.id).sort();

      if (JSON.stringify(currentServerIds) !== JSON.stringify(newServerIds)) {
        // Keep draft attachments and replace server attachments
        const draftAttachments = attachments.filter(a => a.type === 'draft');
        onAttachmentsChange([...serverAttachmentsList, ...draftAttachments]);
      }
    }
  }, [serverAttachments, expenseId, attachments, onAttachmentsChange]);

  // Update when server attachments change
  React.useEffect(() => {
    updateAttachmentsFromServer();
  }, [updateAttachmentsFromServer]);

  const { processFiles, isProcessing, cleanupPreviewUrl } = useFileProcessor({
    onError: (_error) => alertError(t('expenseEdit.receipts.errors.uploadFailed')),
    onTooLarge: () => alertError(t('expenseEdit.receipts.errors.tooLarge'))
  });

  const handleFilesSelected = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = max - attachments.length;
    if (remaining <= 0) return;

    const processedFiles = await processFiles(files, remaining);

    if (processedFiles.length === 0) return;

    if (expenseId) {
      // Upload directly to server for existing expenses
      for (const processed of processedFiles) {
        try {
          const presigned = await presignExpenseAttachment(expenseId, {
            fileName: processed.originalFile.name,
            contentType: processed.contentType,
            expectedSizeBytes: processed.sizeBytes
          });

          await uploadToPresignedUrl(presigned.uploadUrl, presigned.headers, processed.blob);
          await finalizeExpenseAttachment(expenseId, presigned.attachmentId);

          // Cleanup the preview URL since we don't need it
          cleanupPreviewUrl(processed.previewUrl);

          alertInfo(t('expenseEdit.receipts.uploaded'));
        } catch (e) {
          console.error('Upload failed:', e);
          alertError(t('expenseEdit.receipts.errors.uploadFailed'));
        }
      }

      // Refresh server attachments
      await mutate(key);
    } else {
      // Keep as drafts for new expenses
      const draftAttachments: Attachment[] = processedFiles.map(processed => ({
        id: crypto.randomUUID(),
        fileName: processed.originalFile.name,
        url: processed.previewUrl,
        sizeBytes: processed.sizeBytes,
        type: 'draft' as const
      }));

      onAttachmentsChange([...attachments, ...draftAttachments]);
    }
  }, [expenseId, attachments, max, processFiles, alertError, alertInfo, t, key, onAttachmentsChange, cleanupPreviewUrl]);


  // Inline action bar component
  const fileInputId = crypto.randomUUID();
  const cameraInputId = crypto.randomUUID();
  const isMax = attachments.length >= max;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFilesSelected(e.target.files);
    // reset so same file can be chosen again if needed
    e.target.value = '';
  };

  return (
    <>
      {error && (
        <div className="text-danger text-sm mb-2">
          {t('expenseEdit.receipts.errors.loadFailed')}
        </div>
      )}

      <div className="flex gap-2 items-center">
        {/* File input for attachment button (file browser) */}
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="hidden"
          multiple={false}
          onChange={handleInputChange}
        />
        {/* Camera input for camera button (camera only) */}
        {isMobile && hasCamera && (
          <input
            id={cameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            multiple={false}
            onChange={handleInputChange}
          />
        )}

        {isProcessing ? (
          <div className="flex items-center gap-2 text-sm text-dimmed">
            <Spinner size="sm" />
          </div>
        ) : (
          <>
            <Button
              aria-label={t('expenseEdit.receipts.addButton')}
              variant="flat"
              size="sm"
              color="primary"
              isIconOnly
              onPress={() => document.getElementById(fileInputId)?.click()}
              isDisabled={isMax}
            >
              <PaperclipIcon className="w-5 h-5" />
            </Button>
            {isMobile && hasCamera && (
              <Button
                aria-label={t('expenseEdit.receipts.takePhoto')}
                variant="flat"
                color="primary"
                size="sm"
                isIconOnly
                onPress={() => document.getElementById(cameraInputId)?.click()}
                isDisabled={isMax}
              >
                <CameraAddIcon className="w-5 h-5" />
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}