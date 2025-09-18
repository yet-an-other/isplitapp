import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { useTranslation } from "react-i18next";
import { useHeroUIAlerts as useAlerts } from "../utils/useHeroUIAlerts";
import { compressImage } from "../utils/imageCompression";
import { AttachmentActionBar, AttachmentGrid } from "./AttachmentShared";
import { deleteExpenseAttachment, finalizeExpenseAttachment, listExpenseAttachments, presignExpenseAttachment, uploadToPresignedUrl } from "../api/expenseApi";
import type { AttachmentInfo } from "../api/contract/AttachmentInfo";

export type DraftAttachment = {
  id: string; // local temp id
  fileName: string;
  blob: Blob;
  contentType: string;
  sizeBytes: number;
  previewUrl: string; // object URL
};

type ExistingProps = {
  kind: 'existing';
  expenseId: string;
  mode?: 'buttons' | 'grid';
};

type DraftProps = {
  kind: 'draft';
  max?: number; // default 3
  onChange?: (drafts: DraftAttachment[]) => void;
  drafts?: DraftAttachment[];
  inlineButtons?: boolean;
};

type Props = ExistingProps | DraftProps;

export default function Attachments(props: Props) {
  const { t } = useTranslation();
  const { alertError, alertInfo } = useAlerts();

  if (props.kind === 'existing') {
    const { expenseId, mode = 'grid' } = props;
    const [isUploading, setIsUploading] = useState(false);
    const key = `/expenses/${expenseId}/attachments`;
    const { data: attachments, isLoading, error } = useSWR<AttachmentInfo[]>(key, async () => await listExpenseAttachments(expenseId));

    useEffect(() => {}, [expenseId]);

    const handleFilesSelected = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      setIsUploading(true);
      try {
        const { blob, contentType, bytes } = await compressImage(file);
        if (bytes > 450 * 1024) {
          alertError(t('expenseEdit.receipts.errors.tooLarge'));
          return;
        }
        const presigned = await presignExpenseAttachment(expenseId, { fileName: file.name, contentType, expectedSizeBytes: bytes });
        await uploadToPresignedUrl(presigned.uploadUrl, presigned.headers, blob);
        await finalizeExpenseAttachment(expenseId, presigned.attachmentId);
        await mutate(key);
        alertInfo(t('expenseEdit.receipts.uploaded'));
      } catch (e) {
        console.error(e);
        alertError(t('expenseEdit.receipts.errors.uploadFailed'));
      } finally {
        setIsUploading(false);
      }
    };

    const handleDelete = async (attachmentId: string) => {
      try {
        await deleteExpenseAttachment(expenseId, attachmentId);
        await mutate(key);
      } catch (e) {
        console.error(e);
        alertError(t('expenseEdit.receipts.errors.deleteFailed'));
      }
    };

    const actionBar = (
      <AttachmentActionBar
        onFiles={handleFilesSelected}
        busy={isUploading}
        count={attachments?.length ?? 0}
        max={3}
      />
    );

    if (mode === 'buttons') return actionBar;

    return (
      <div>
        {error && <div className="text-danger text-sm mb-2">{t('expenseEdit.receipts.errors.loadFailed')}</div>}
        {isLoading && !attachments && <div className="text-dimmed text-sm">Loading attachments…</div>}
        <AttachmentGrid
          items={(attachments ?? []).map(a => ({
            id: a.attachmentId,
            fileName: a.fileName ?? 'receipt',
            sizeBytes: a.sizeBytes,
            url: a.url,
            clickable: true,
            deletable: true,
            onDelete: () => handleDelete(a.attachmentId)
          }))}
          imageHeightClass="h-24"
        />
      </div>
    );
  }

  // kind === 'draft'
  const { max = 3, onChange, drafts: controlledDrafts, inlineButtons = false } = props;
  const [isProcessing, setIsProcessing] = useState(false);
  const [uncontrolledDrafts, setUncontrolledDrafts] = useState<DraftAttachment[]>([]);
  const drafts = controlledDrafts ?? uncontrolledDrafts;

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - drafts.length;
    if (remaining <= 0) return;

    setIsProcessing(true);
    try {
      const toProcess = Array.from(files).slice(0, remaining);
      const additions: DraftAttachment[] = [];
      for (const file of toProcess) {
        try {
          const { blob, contentType, bytes } = await compressImage(file);
          if (bytes > 450 * 1024) {
            // Too large after compression — skip and continue
            continue;
          }
          const id = crypto.randomUUID();
          additions.push({
            id,
            fileName: file.name,
            blob,
            contentType,
            sizeBytes: bytes,
            previewUrl: URL.createObjectURL(blob),
          });
        } catch (e) {
          // Ignore failed file and continue others
          console.error(e);
        }
      }
      if (additions.length > 0) {
        const next = [...drafts, ...additions];
        if (!controlledDrafts) setUncontrolledDrafts(next);
        onChange?.(next);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const remove = (id: string) => {
    const next = drafts.filter(d => d.id !== id);
    if (!controlledDrafts) setUncontrolledDrafts(next);
    onChange?.(next);
  };

  const actionButtons = (
    <AttachmentActionBar
      onFiles={addFiles}
      busy={isProcessing}
      count={drafts.length}
      max={max}
    />
  );

  if (inlineButtons) return actionButtons;

  return (
    <div>
      <AttachmentGrid
        items={drafts.map(d => ({
          id: d.id,
          fileName: d.fileName,
          sizeBytes: d.sizeBytes,
          url: d.previewUrl,
          deletable: true,
          onDelete: () => remove(d.id)
        }))}
        columns={{ base: 3, sm: 4, md: 6 }}
        imageHeightClass="h-28"
      />
    </div>
  );
}
