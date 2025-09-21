import React, { useState } from "react";
import { Button, Card, CardBody, Image } from "@heroui/react";
import { CloseIcon } from "../icons/CloseIcon";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";
import { deleteExpenseAttachment } from "../api/expenseApi";
import { useHeroUIAlerts as useAlerts } from "../utils/useHeroUIAlerts";
import ImageModal from "./ImageModal";
import type { Attachment } from "./AttachmentButtons";

export interface AttachmentGridProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  expenseId?: string; // Required for server attachment deletion
  emptyState?: React.ReactNode;
}

/**
 * AttachmentGrid - displays thumbnails with built-in delete and view functionality
 *
 * A smart component that:
 * - Takes unified attachment array
 * - Renders thumbnail grid with delete and view capabilities
 * - Handles server and draft attachment deletion internally
 * - Opens full-size image modal when thumbnails are clicked
 *
 * Usage:
 *   <AttachmentGrid
 *     attachments={attachments}
 *     onAttachmentsChange={setAttachments}
 *     expenseId={expenseId}
 *   />
 */
export default function AttachmentGrid({ attachments, onAttachmentsChange, expenseId }: AttachmentGridProps) {
  const { t } = useTranslation();
  const { alertError } = useAlerts();
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAttachment(null);
  };

  const handleDelete = async (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (!attachment) return;

    if (attachment.type === 'server' && expenseId) {
      // Delete from server and invalidate cache
      try {
        await deleteExpenseAttachment(expenseId, id);
        // Invalidate the server attachments cache to force reload
        await mutate(`/expenses/${expenseId}/attachments`);
        // Remove from local state
        onAttachmentsChange(attachments.filter(a => a.id !== id));
      } catch (e) {
        console.error('Delete failed:', e);
        alertError(t('expenseEdit.receipts.errors.deleteFailed'));
      }
    } else if (attachment.type === 'draft') {
      // Clean up blob URL for draft attachments
      URL.revokeObjectURL(attachment.url);
      // Remove from local state
      onAttachmentsChange(attachments.filter(a => a.id !== id));
    }
  };
  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {attachments.map((attachment, index) => {
          const altText = t('expenseEdit.receipts.altPattern', { index: index + 1, total: attachments.length });
          return (
          <Card key={attachment.id} className="p-0 border rounded overflow-hidden relative group">
            <CardBody className="p-0">
              <div className="relative">
                {/* Clickable image thumbnail */}
                <button
                  type="button"
                  onClick={() => handleImageClick(attachment)}
                  className="w-full h-24 block cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label={t('expenseEdit.receipts.altPattern', { index: index + 1, total: attachments.length })}
                >
                  <Image
                    src={attachment.url}
                    alt={altText}
                    className="w-full h-24 object-cover"
                    radius="none"
                  />
                </button>

                {/* Delete button */}
                <Button
                  aria-label={t('common.buttons.delete') + ' ' + altText}
                  size="sm"
                  isIconOnly
                  className="!min-w-0 w-5 h-5 rounded-full bg-danger/90 backdrop-blur text-white absolute top-1 right-1 z-10 shadow-sm hover:bg-danger hover:opacity-100"
                  onPress={() => handleDelete(attachment.id)}
                  variant="flat"
                >
                  <CloseIcon className="w-3 h-3 stroke-[3px]" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )})}
      </div>

      {/* Image Modal */}
      <ImageModal
        attachments={selectedAttachment ? [selectedAttachment] : []}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}