import { Modal, ModalContent, ModalHeader, ModalBody, Image, Button } from '@heroui/react';
import { CloseIcon } from '../icons/CloseIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import type { Attachment } from './AttachmentButtons';

export interface ImageModalProps {
  attachments: Attachment[];
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  initialIndex?: number;
}

/**
 * ImageModal - displays attachment images in full-size modal view
 *
 * Features:
 * - Full-screen image viewing for single or multiple images
 * - Support for both draft (blob URLs) and server attachments
 * - Navigation between multiple images with arrows and keyboard
 * - Responsive sizing with proper aspect ratio
 * - No overlap between wide images and navigation buttons
 * - Keyboard navigation (ESC to close, arrow keys for navigation)
 * - Touch-friendly navigation and close buttons
 * - Loading state support
 * - Image counter for multiple images
 *
 * Usage:
 *   <ImageModal
 *     attachments={attachments}
 *     isOpen={isModalOpen}
 *     onClose={() => setIsModalOpen(false)}
 *     isLoading={isLoading}
 *     initialIndex={0}
 *   />
 */
export default function ImageModal({
  attachments,
  isOpen,
  onClose,
  isLoading = false,
  initialIndex = 0
}: ImageModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : (attachments?.length || 1) - 1));
  }, [attachments?.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < (attachments?.length || 1) - 1 ? prev + 1 : 0));
  }, [attachments?.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]);

  if (!isOpen) return null;

  if (isLoading || !attachments || attachments.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        backdrop="blur"
        hideCloseButton
        classNames={{
          base: "bg-black/80",
          backdrop: "bg-black/50",
        }}
      >
        <ModalContent className="bg-transparent shadow-none m-0 max-w-none max-h-none">
          <ModalHeader className="absolute top-4 right-4 z-50 p-0">
            <Button
              isIconOnly
              variant="flat"
              onPress={onClose}
              className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              aria-label={t('common.close')}
            >
              <CloseIcon className="w-5 h-5" />
            </Button>
          </ModalHeader>
          <ModalBody className="p-4 flex items-center justify-center min-h-screen">
            <div className="text-white text-lg">
              {isLoading ? t('common.loading') : t('attachments.noImages')}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  const currentAttachment = attachments?.[currentIndex];
  const hasMultiple = (attachments?.length || 0) > 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      backdrop="blur"
      hideCloseButton
      classNames={{
        base: "bg-black/80",
        backdrop: "bg-black/50",
      }}
      motionProps={{
        variants: {
          enter: {
            scale: 1,
            opacity: 1,
            transition: {
              duration: 0.2,
              ease: "easeOut",
            },
          },
          exit: {
            scale: 0.95,
            opacity: 0,
            transition: {
              duration: 0.15,
              ease: "easeIn",
            },
          },
        }
      }}
    >
      <ModalContent className="bg-transparent shadow-none m-0 max-w-none max-h-none">
        {/* Header with close button and counter */}
        <ModalHeader className="absolute top-4 right-4 z-50 p-0 flex gap-2 items-center">
          {hasMultiple && (
            <div className="bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm text-sm">
              {currentIndex + 1} of {attachments?.length || 0}
            </div>
          )}
          <Button
            isIconOnly
            variant="flat"
            onPress={onClose}
            className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            aria-label={t('common.close')}
          >
            <CloseIcon className="w-5 h-5" />
          </Button>
        </ModalHeader>

        {/* Navigation arrows - positioned outside image area to prevent overlap */}
        {hasMultiple && (
          <>
            <Button
              isIconOnly
              variant="flat"
              onPress={handlePrevious}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              aria-label={t('attachments.previousImage')}
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </Button>
            <Button
              isIconOnly
              variant="flat"
              onPress={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              aria-label={t('attachments.nextImage')}
            >
              <ChevronRightIcon className="w-6 h-6" />
            </Button>
          </>
        )}

        <ModalBody className="p-0 flex items-center justify-center min-h-screen">
          {/* Container with padding to prevent image from reaching the edges where buttons are */}
          <div className={`relative flex items-center justify-center ${hasMultiple ? 'max-w-[calc(100vw-120px)]' : 'max-w-[95vw]'} max-h-[95vh]`}>
            {currentAttachment && (
              <>
                <Image
                  src={currentAttachment.url}
                  alt={currentAttachment.fileName}
                  className="max-w-full max-h-full object-contain"
                  classNames={{
                    wrapper: "bg-transparent",
                    img: "max-w-full max-h-full object-contain"
                  }}
                  loading="lazy"
                  radius="sm"
                />

                {/* Image info overlay */}
                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm z-40">
                  <p className="text-sm font-medium">{currentAttachment.fileName}</p>
                  <p className="text-xs text-white/70">
                    {(currentAttachment.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                </div>

              </>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}