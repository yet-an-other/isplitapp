import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Attachments from '../../controls/Attachments';
vi.mock('react-i18next', async () => ({
  useTranslation: () => ({ t: (k: string) => {
    if (k === 'expenseEdit.receipts.uploading') return 'Uploading';
    return k;
  } }),
}));

vi.mock('../../api/expenseApi', async () => {
  return {
    listExpenseAttachments: vi.fn(async () => []),
    presignExpenseAttachment: vi.fn(async () => ({
      attachmentId: 'att1',
      uploadUrl: 'https://s3.upload/url',
      headers: { 'Content-Type': 'image/webp' },
      maxBytes: 512000,
      expiresAt: new Date(),
    })),
    uploadToPresignedUrl: vi.fn(async () => {}),
    finalizeExpenseAttachment: vi.fn(async () => {}),
    deleteExpenseAttachment: vi.fn(async () => {}),
  };
});

import * as imageCompression from '../../utils/imageCompression';

describe('Attachments (existing)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and allows adding a receipt (buttons mode)', async () => {
  vi.spyOn(imageCompression, 'compressImage').mockResolvedValue({
      blob: new Blob([new Uint8Array(10)]),
      contentType: 'image/webp',
      width: 10,
      height: 10,
      bytes: 1000,
    });

  render(<Attachments kind="existing" expenseId="exp1" mode="buttons" />);

  const buttons = screen.getAllByRole('button');
  expect(buttons.length).toBeGreaterThanOrEqual(2);

  // Trigger file input by clicking the first add button
  fireEvent.click(buttons[0]);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array(100)], 'r.jpg', { type: 'image/jpeg' });
    await waitFor(() => expect(input).toBeTruthy());
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('common.loading')).toBeInTheDocument();
    });
  });

  it('renders grid mode without buttons or header', async () => {
  render(<Attachments kind="existing" expenseId="exp1" mode="grid" />);
    expect(screen.queryByText('expenseEdit.receipts.title')).toBeNull();
    expect(screen.queryByLabelText('expenseEdit.receipts.addButton')).toBeNull();
  });
});
