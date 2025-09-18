import { Button, Spinner, Card, CardBody, Image } from "@heroui/react";
import { AttachmentAddIcon } from "../icons/AttachmentAddIcon";
import { CameraAddIcon } from "../icons/CameraAddIcon";
import { CloseIcon } from "../icons/CloseIcon";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** Generic action bar for picking attachments (draft or existing). */
export interface AttachmentActionBarProps {
  /** Triggered when user selects files. Provide FileList handler. */
  onFiles: (files: FileList | null) => void | Promise<void>;
  /** Whether an upload / processing is in progress. */
  busy?: boolean;
  /** Current attachment count. */
  count: number;
  /** Maximum allowed attachments. */
  max: number;
  /** Visual style variant: solid used in full header section, light when embedded. */
  variant?: 'solid' | 'light';
  /** Add bottom margin (default true). */
  withMargin?: boolean;
  /** Allow selecting multiple files. */
  multiple?: boolean;
  /** Disabled externally. */
  disabled?: boolean;
}

export const AttachmentActionBar = ({ onFiles, busy, count, max, variant = 'light', withMargin = true, multiple = false, disabled }: AttachmentActionBarProps) => {
  const { t } = useTranslation();
  const id = 'file-input-' + Math.random().toString(36).slice(2);
  const isMax = count >= max;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void onFiles(e.target.files);
    // reset so same file can be chosen again if needed
    e.target.value = '';
  };
  const btnVariant = variant === 'solid' ? 'solid' : 'light';
  const btnColor = variant === 'solid' ? 'primary' : 'default';
  return (
    <div className={`flex gap-2 items-center ${withMargin ? 'mb-3' : ''}`}>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
      />
      <Button 
        aria-label={t('expenseEdit.receipts.addButton')} 
        variant={btnVariant} 
        color={btnColor} 
        size="sm" 
        isIconOnly 
        onPress={() => document.getElementById(id)?.click()} 
        isDisabled={busy || isMax || disabled}
      >
        <AttachmentAddIcon className="w-5 h-5" />
      </Button>
      <Button 
        aria-label={t('expenseEdit.receipts.addButton')} 
        variant={btnVariant} 
        color={btnColor} 
        size="sm" 
        isIconOnly 
        onPress={() => document.getElementById(id)?.click()} 
        isDisabled={busy || isMax || disabled}
      >
        <CameraAddIcon className="w-5 h-5" />
      </Button>
      {busy && (
        <div className="flex items-center gap-2 text-sm text-dimmed">
          <Spinner size="sm" />
          {t('common.loading')}
        </div>
      )}
  {/* Max reached message intentionally removed (buttons just disable). */}
    </div>
  );
};

export interface AttachmentGridItem {
  id: string;
  fileName: string; // kept for alt text / accessible label only
  sizeBytes: number; // unused in minimal UI but retained for potential future use
  url: string;
  deletable?: boolean;
  onDelete?: () => void | Promise<void>;
  clickable?: boolean; // if true the image will be wrapped in a link to url
}

export interface AttachmentGridProps {
  items: AttachmentGridItem[];
  columns?: { base: number; sm: number; md: number };
  imageHeightClass?: string; // e.g. h-24
  emptyState?: ReactNode;
}

export const AttachmentGrid = ({ items, columns = { base: 3, sm: 5, md: 6 }, imageHeightClass = 'h-24', emptyState }: AttachmentGridProps) => {
  if (items.length === 0) return emptyState ? <>{emptyState}</> : null;
  return (
    <div className={`grid grid-cols-${columns.base} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} gap-3`}>
      {items.map(a => (
        <Card key={a.id} className="p-0 border rounded overflow-hidden relative group">
          <CardBody className="p-0">
            <div className="relative">
              {a.clickable ? (
                <a href={a.url} target="_blank" rel="noreferrer" aria-label={`Open ${a.fileName}`}>
                  <Image src={a.url} alt={a.fileName} className={`w-full ${imageHeightClass} object-cover`} radius="none" />
                </a>
              ) : (
                <Image src={a.url} alt={a.fileName} className={`w-full ${imageHeightClass} object-cover`} radius="none" />
              )}
              {a.deletable && a.onDelete && (
                <Button
                  aria-label="Delete attachment"
                  size="sm"
                  isIconOnly
                  className="!min-w-0 w-5 h-5 rounded-full bg-danger/90 backdrop-blur text-white absolute top-1 right-1 z-10 shadow-sm hover:bg-danger hover:opacity-100"
                  onPress={() => void a.onDelete?.()}
                  variant="flat"
                >
                  <CloseIcon className="w-3 h-3 stroke-[3px]" />
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default {
  AttachmentActionBar,
  AttachmentGrid
};
