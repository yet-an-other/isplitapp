import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useHeroUIAlerts as useAlerts } from '../utils/useHeroUIAlerts';
import { compressImage } from '../utils/imageCompression';

export interface ProcessedFile {
  originalFile: File;
  blob: Blob;
  contentType: string;
  sizeBytes: number;
  previewUrl: string;
}

export interface UseFileProcessorOptions {
  maxSizeBytes?: number;
  onError?: (error: string) => void;
  onTooLarge?: (fileName: string) => void;
}

/**
 * Shared hook for processing files (compression, validation, preview generation)
 * Used by both existing and draft attachment components
 */
export function useFileProcessor(options: UseFileProcessorOptions = {}) {
  const { t } = useTranslation();
  const { alertError } = useAlerts();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    maxSizeBytes = 450 * 1024,
    onError = (error) => alertError(error),
    onTooLarge = (_fileName) => alertError(t('expenseEdit.receipts.errors.tooLarge'))
  } = options;

  const processFile = useCallback(async (file: File): Promise<ProcessedFile | null> => {
    try {
      const { blob, contentType, bytes } = await compressImage(file);

      if (bytes > maxSizeBytes) {
        onTooLarge(file.name);
        return null;
      }

      return {
        originalFile: file,
        blob,
        contentType,
        sizeBytes: bytes,
        previewUrl: URL.createObjectURL(blob),
      };
    } catch (error) {
      console.error('File processing failed:', error);
      onError(t('expenseEdit.receipts.errors.processingFailed'));
      return null;
    }
  }, [maxSizeBytes, onError, onTooLarge, t]);

  const processFiles = useCallback(async (
    files: FileList | null,
    maxCount?: number
  ): Promise<ProcessedFile[]> => {
    if (!files || files.length === 0) return [];

    setIsProcessing(true);

    try {
      const filesToProcess = maxCount
        ? Array.from(files).slice(0, maxCount)
        : Array.from(files);

      const processed: ProcessedFile[] = [];

      for (const file of filesToProcess) {
        const result = await processFile(file);
        if (result) {
          processed.push(result);
        }
      }

      return processed;
    } finally {
      setIsProcessing(false);
    }
  }, [processFile]);

  const cleanupPreviewUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  return {
    processFile,
    processFiles,
    cleanupPreviewUrl,
    isProcessing,
  };
}