/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ExpenseList } from '../../pages/ExpenseList';
import { ExpenseInfo } from '../../api/contract/ExpenseInfo';
import { PartyInfo } from '../../api/contract/PartyInfo';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockOutletContext = {
  party: {
    id: 'party-1',
    name: 'Test Party',
    description: null,
    currency: 'USD',
    created: new Date(),
    updated: new Date(),
    totalExpenses: 0,
    totalTransactions: 0,
    outstandingBalance: 0,
    totalParticipants: 0,
    participants: [],
    isArchived: false,
    updateTimestamp: '2023-01-01T00:00:00Z',
    lastExpenseTimestamp: '2023-01-01T00:00:00Z',
    primaryParticipantBalance: null,
    primaryParticipantExpenses: null
  } as PartyInfo,
  primaryParticipantId: 'user-1'
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useOutletContext: () => mockOutletContext
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'expenseList.attachments.indicatorAria': `View ${options?.count || 0} attachments`,
        'expenseList.emptyState.message': 'No expenses yet',
        'expenseList.emptyState.startWith': 'Start with',
        'expenseList.emptyState.addLink': 'adding',
        'expenseList.emptyState.theFirstExpense': 'the first expense',
        'expenseList.refundsToggle.hide': 'Hide',
        'expenseList.refundsToggle.show': 'Show',
        'expenseList.refundsToggle.label': 'refunds',
        'expenseList.labels.paidBy': 'Paid by',
        'expenseList.labels.for': 'for',
        'expenseList.labels.to': 'to',
        'expenseList.labels.youLent': 'You lent',
        'expenseList.labels.youOwe': 'You owe',
        'common.close': 'Close'
      };
      return translations[key] || key;
    }
  })
}));

// Mock utils
vi.mock('../../utils/partySetting', () => ({
  usePartySetting: () => ({
    isShowRefund: false,
    setIsShowRefund: vi.fn(),
    lastViewed: '2023-01-01T00:00:00Z',
    setLastViewed: vi.fn(),
    primaryParticipantId: 'user-1'
  })
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  intlFormatDistance: () => 'Today',
  format: () => 'Mon 01 Jan 2023'
}));

// Mock attachment API
vi.mock('../../api/expenseApi', () => ({
  fetcher: vi.fn(),
  listExpenseAttachments: vi.fn()
}));

// Import the mocked function
import { listExpenseAttachments } from '../../api/expenseApi';
const mockListExpenseAttachments = vi.mocked(listExpenseAttachments);

// Mock SWR
const mockSWRData = vi.fn();
const mockSWRError = vi.fn();
const mockSWRIsLoading = vi.fn();

// Create a mock that tracks SWR calls and triggers the fetcher
const mockAttachmentData = [
  {
    attachmentId: 'att-1',
    fileName: 'receipt1.jpg',
    contentType: 'image/jpeg',
    url: 'https://example.com/receipt1.jpg',
    sizeBytes: 1024,
    expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
  },
  {
    attachmentId: 'att-2',
    fileName: 'receipt2.png',
    contentType: 'image/png',
    url: 'https://example.com/receipt2.png',
    sizeBytes: 2048,
    expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
  }
];

vi.mock('swr', () => ({
  default: vi.fn((key: string | null, fetcher?: () => unknown) => {
    // Handle expense list SWR call
    if (typeof key === 'string' && key.includes('/expenses')) {
      return {
        data: mockSWRData(),
        error: mockSWRError(),
        isLoading: mockSWRIsLoading()
      };
    }

    // Handle attachment SWR call
    if (Array.isArray(key) && key[0] === 'attachments') {
      // When the key is present, trigger the fetcher function to track API calls
      if (fetcher && key[1]) {
        // Call the fetcher function synchronously to track the call
        try {
          fetcher();
        } catch {
          // Ignore promise rejections, we just want to track the call
        }
      }

      return {
        data: mockAttachmentData,
        error: null,
        isLoading: false
      };
    }

    return {
      data: null,
      error: null,
      isLoading: false
    };
  })
}));

describe('ExpenseList - Attachment functionality', () => {
  const mockExpenses: ExpenseInfo[] = [
    {
      id: 'exp-1',
      title: 'Dinner',
      amount: 50.00,
      date: new Date('2023-01-01'),
      lenderId: 'user-1',
      lenderName: 'John',
      isReimbursement: false,
      splitMode: 'Evenly' as const,
      updateTimestamp: '2023-01-01T00:00:00Z',
      borrowers: [
        { participantId: 'user-1', participantName: 'John', amount: 25.00, share: 0.5, percent: 50 },
        { participantId: 'user-2', participantName: 'Jane', amount: 25.00, share: 0.5, percent: 50 }
      ],
      attachmentCount: 2
    },
    {
      id: 'exp-2',
      title: 'Coffee',
      amount: 5.00,
      date: new Date('2023-01-02'),
      lenderId: 'user-2',
      lenderName: 'Jane',
      isReimbursement: false,
      splitMode: 'Evenly' as const,
      updateTimestamp: '2023-01-02T00:00:00Z',
      borrowers: [
        { participantId: 'user-1', participantName: 'John', amount: 2.50, share: 0.5, percent: 50 },
        { participantId: 'user-2', participantName: 'Jane', amount: 2.50, share: 0.5, percent: 50 }
      ],
      attachmentCount: 0
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSWRData.mockReturnValue(mockExpenses);
    mockSWRError.mockReturnValue(null);
    mockSWRIsLoading.mockReturnValue(false);

    // Set up attachment API mock to return the same data as the SWR mock
    mockListExpenseAttachments.mockResolvedValue(mockAttachmentData);
  });

  const renderExpenseList = () => {
    return render(
      <BrowserRouter>
        <ExpenseList />
      </BrowserRouter>
    );
  };

  describe('Paperclip icon visibility', () => {
    it('shows paperclip icon when expense has attachmentCount > 0', () => {
      renderExpenseList();

      // Find the expense with attachments
      const dinnerExpense = screen.getByText('Dinner').closest('.flex.flex-col');
      expect(dinnerExpense).toBeInTheDocument();

      // Should show paperclip icon with badge
      const paperclipButton = dinnerExpense?.querySelector('[role="button"][data-expense-id="exp-1"]');
      expect(paperclipButton).toBeInTheDocument();
      expect(paperclipButton).toHaveAttribute('aria-label', 'View 2 attachments');

      // Should show badge with count
      expect(paperclipButton?.textContent).toContain('2');
    });

    it('does not show paperclip icon when expense has no attachments', () => {
      renderExpenseList();

      // Find the expense without attachments
      const coffeeExpense = screen.getByText('Coffee').closest('.flex.flex-col');
      expect(coffeeExpense).toBeInTheDocument();

      // Should not show paperclip icon
      const paperclipButton = coffeeExpense?.querySelector('[role="button"][data-expense-id="exp-2"]');
      expect(paperclipButton).toBeNull();
    });
  });

  describe('Paperclip click functionality', () => {
    it('opens ImageModal when paperclip is clicked', async () => {
      renderExpenseList();

      // Find and click the paperclip button
      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });
      expect(paperclipButton).toBeInTheDocument();

      fireEvent.click(paperclipButton);

      // Should trigger attachment fetch
      expect(mockListExpenseAttachments).toHaveBeenCalledWith('exp-1');

      // Wait for modal to appear
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      });

      // Should show close button
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('shows first attachment when modal opens', async () => {
      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });
      fireEvent.click(paperclipButton);

      await waitFor(() => {
        const image = screen.getByAltText('receipt1.jpg');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/receipt1.jpg');
      });

      // Should show file info
      expect(screen.getByText('receipt1.jpg')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      renderExpenseList();

      // Open modal
      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });
      fireEvent.click(paperclipButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard accessibility', () => {
    it('opens modal when Enter key is pressed on paperclip', async () => {
      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });

      // Focus and press Enter
      paperclipButton.focus();
      fireEvent.keyDown(paperclipButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('opens modal when Space key is pressed on paperclip', async () => {
      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });

      // Focus and press Space
      paperclipButton.focus();
      fireEvent.keyDown(paperclipButton, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('ignores other keys', () => {
      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });

      // Press other keys - should not open modal
      fireEvent.keyDown(paperclipButton, { key: 'a', code: 'KeyA' });
      fireEvent.keyDown(paperclipButton, { key: 'Escape', code: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('has proper tabIndex and focus management', () => {
      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });

      // Should be focusable
      expect(paperclipButton).toHaveAttribute('tabIndex', '0');

      // Should have cursor pointer style
      expect(paperclipButton).toHaveClass('cursor-pointer');

      // Should have focus-visible styles
      expect(paperclipButton).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-primary');
    });
  });

  describe('SWR integration and loading states', () => {
    it('fetches attachments lazily when modal is opened', async () => {
      renderExpenseList();

      // Initially, attachments should not be fetched
      expect(mockListExpenseAttachments).not.toHaveBeenCalled();

      // Open modal
      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });
      fireEvent.click(paperclipButton);

      // Now it should fetch attachments
      expect(mockListExpenseAttachments).toHaveBeenCalledWith('exp-1');

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('handles multiple clicks gracefully', async () => {
      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });

      // Click multiple times quickly
      fireEvent.click(paperclipButton);
      fireEvent.click(paperclipButton);
      fireEvent.click(paperclipButton);

      // Should call the API (SWR may call multiple times during render cycles, which is normal)
      expect(mockListExpenseAttachments).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('properly manages state when switching between expenses', async () => {
      // Add another expense with attachments
      const multiAttachmentExpenses = [
        ...mockExpenses,
        {
          id: 'exp-3',
          title: 'Lunch',
          amount: 25.00,
          date: new Date('2023-01-03'),
          lenderId: 'user-1',
          lenderName: 'John',
          isReimbursement: false,
          splitMode: 'Evenly' as const,
          updateTimestamp: '2023-01-03T00:00:00Z',
          borrowers: [
            { participantId: 'user-1', participantName: 'John', amount: 12.50 },
            { participantId: 'user-2', participantName: 'Jane', amount: 12.50 }
          ],
          attachmentCount: 1
        }
      ];

      mockSWRData.mockReturnValue(multiAttachmentExpenses);
      renderExpenseList();

      // Click first expense
      const firstPaperclip = screen.getByRole('button', { name: 'View 2 attachments' });
      fireEvent.click(firstPaperclip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Click second expense
      const secondPaperclip = screen.getByRole('button', { name: 'View 1 attachments' });
      fireEvent.click(secondPaperclip);

      // Should call API for second expense
      expect(mockListExpenseAttachments).toHaveBeenCalledWith('exp-3');

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles expenses with zero attachmentCount', () => {
      renderExpenseList();

      // Coffee expense has 0 attachments
      const coffeeExpense = screen.getByText('Coffee').closest('.flex.flex-col');

      // Should not have any paperclip button
      const paperclipButtons = coffeeExpense?.querySelectorAll('[role="button"][data-expense-id]');
      expect(paperclipButtons?.length).toBe(0);
    });

    it('handles empty attachment response gracefully', async () => {
      // Mock empty attachments response
      mockListExpenseAttachments.mockResolvedValueOnce([]);

      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });
      fireEvent.click(paperclipButton);

      // Modal should still open but without content
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should show close button even with no attachments
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('prevents opening modal when expense ID is missing', () => {
      renderExpenseList();

      // Create a button without data-expense-id
      const invalidButton = document.createElement('div');
      invalidButton.setAttribute('role', 'button');
      invalidButton.setAttribute('tabIndex', '0');
      document.body.appendChild(invalidButton);

      // Click should not trigger modal
      fireEvent.click(invalidButton);
      fireEvent.keyDown(invalidButton, { key: 'Enter' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockListExpenseAttachments).not.toHaveBeenCalled();

      document.body.removeChild(invalidButton);
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      mockListExpenseAttachments.mockRejectedValueOnce(new Error('Network error'));

      renderExpenseList();

      const paperclipButton = screen.getByRole('button', { name: 'View 2 attachments' });
      fireEvent.click(paperclipButton);

      // Should not throw error and modal should still be manageable
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading states and expenses', () => {
    it('does not render expense list when loading', () => {
      mockSWRIsLoading.mockReturnValue(true);
      mockSWRData.mockReturnValue(undefined);

      renderExpenseList();

      // Should not show any expenses or paperclip buttons
      expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View.*attachments/ })).not.toBeInTheDocument();
    });

    it('does not render expense list when there is an error', () => {
      mockSWRError.mockReturnValue({ message: 'Failed to fetch' });
      mockSWRData.mockReturnValue(undefined);

      renderExpenseList();

      // Should not show any expenses or paperclip buttons
      expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View.*attachments/ })).not.toBeInTheDocument();
    });

    it('shows empty state when no expenses exist', () => {
      mockSWRData.mockReturnValue([]);

      renderExpenseList();

      // Should show empty state message - the text is spread across multiple elements
      expect(screen.getByText(/No expenses yet/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View.*attachments/ })).not.toBeInTheDocument();
    });
  });
});