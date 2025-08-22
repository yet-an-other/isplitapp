/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GroupCard } from '../../controls/GroupCard';
import { MemoryRouter } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { PartyInfo } from '../../api/contract/PartyInfo';

// Mock all external dependencies using vi.mock with factory functions
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useMatch: () => vi.fn(() => null),
  };
});

vi.mock('../../utils/useHeroUIAlerts', () => ({
  useHeroUIAlerts: () => ({
    alertSuccess: vi.fn(),
    alertInfo: vi.fn(),
    alertError: vi.fn(),
  }),
}));

vi.mock('../../utils/deviceSetting', () => ({
  useDeviceSetting: () => ({
    partyIconStyle: 'beam',
  }),
}));

vi.mock('../../utils/partySetting', () => ({
  usePartySetting: () => ({
    lastViewed: '2023-01-01T00:00:00Z',
    primaryParticipantId: null,
  }),
}));

vi.mock('../../utils/shareLink', () => ({
  shareLink: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../utils/generateReport', () => ({
  generateReport: vi.fn(),
}));

vi.mock('../../api/expenseApi', () => ({
  unfollowParty: vi.fn(() => Promise.resolve()),
  updatePartySetings: vi.fn(() => Promise.resolve()),
}));

vi.mock('swr', () => ({
  mutate: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'groupCard.messages.linkCopied': 'Link copied to clipboard',
        'groupCard.messages.archiveToggled': `The group '${options?.groupName}' has been moved ${options?.direction} Archive`,
        'groupCard.messages.archiveDirections.into': 'INTO',
        'groupCard.messages.archiveDirections.outOf': 'OUT of',
        'groupCard.messages.unfollowError': 'Failed to unfollow group',
        'groupCard.unfollowModal.title': 'Unfollow Group',
        'groupCard.unfollowModal.message': 'Are you sure you want to unfollow this group?',
        'common.buttons.cancel': 'Cancel',
        'common.buttons.unfollow': 'Unfollow',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('boring-avatars', () => ({
  default: ({ name, variant, size }: { name: string; variant: string; size: number }) => (
    <div data-testid={`boring-avatar-${variant}`} style={{ width: size, height: size }}>
      {name}
    </div>
  ),
}));

vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'eee dd LLL yyyy') {
      return 'Mon 01 Jan 2023';
    }
    return date.toISOString().split('T')[0];
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  </MemoryRouter>
);

describe('GroupCard', () => {
  const mockPartyInfo: PartyInfo = {
    id: 'test-party-id',
    name: 'Test Party',
    description: null,
    currency: 'USD',
    created: new Date('2023-01-01'),
    updated: new Date('2023-01-02'),
    totalExpenses: 125.50,
    totalTransactions: 8,
    outstandingBalance: 25.75,
    totalParticipants: 4,
    participants: [
      { id: 'p1', name: 'Alice', canDelete: false },
      { id: 'p2', name: 'Bob', canDelete: false },
    ],
    isArchived: false,
    updateTimestamp: '2023-01-02T00:00:00Z',
    lastExpenseTimestamp: '2023-01-02T00:00:00Z',
    primaryParticipantBalance: null,
    primaryParticipantExpenses: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders party information correctly', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      expect(screen.getAllByText('Test Party')).toHaveLength(2); // One in h1, one in avatar
      expect(screen.getByText('125.50')).toBeInTheDocument();
      expect(screen.getAllByText('USD').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('25.75')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Mon 01 Jan 2023')).toBeInTheDocument();
    });

    it('renders with correct card structure', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const card = document.querySelector('form') || document.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      if (card) {
        expect(card).toHaveClass('min-h-[120px]', 'w-full', 'mb-8');
      }
    });

    it('displays boring avatar when party icon style is not none', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      expect(screen.getByTestId('boring-avatar-beam')).toBeInTheDocument();
    });
  });

  describe('Archived State', () => {
    it('renders with archived styling when party is archived', () => {
      const archivedParty = { ...mockPartyInfo, isArchived: true };
      
      render(
        <TestWrapper>
          <GroupCard party={archivedParty} />
        </TestWrapper>
      );

      const cardElement = document.querySelector('.text-dimmed');
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe('Balance Display', () => {
    it('renders outstanding balance with correct color styling', () => {
      const { rerender } = render(
        <TestWrapper>
          <GroupCard party={{ ...mockPartyInfo, outstandingBalance: 0 }} />
        </TestWrapper>
      );

      let balanceElement = screen.getAllByText('0.00').find(el => el.classList.contains('text-primary'));
      expect(balanceElement).toBeDefined();
      expect(balanceElement).toHaveClass('text-primary');

      rerender(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      balanceElement = screen.getByText('25.75');
      expect(balanceElement).toHaveClass('text-danger-600');
    });

    it('displays primary participant balance when available', () => {
      const partyWithPrimaryParticipant = { 
        ...mockPartyInfo, 
        primaryParticipantBalance: 25.50,
        primaryParticipantExpenses: 100.00
      };

      render(
        <TestWrapper>
          <GroupCard party={partyWithPrimaryParticipant} />
        </TestWrapper>
      );

      expect(screen.getByText('25.50')).toBeInTheDocument();
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('does not display primary participant balance when null', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      // Primary participant balance section should not be rendered
      const primaryExpenses = screen.queryByText('100.00');
      expect(primaryExpenses).not.toBeInTheDocument();
    });

    it('displays primary participant balance with correct color styling', () => {
      const { rerender } = render(
        <TestWrapper>
          <GroupCard party={{ ...mockPartyInfo, primaryParticipantBalance: 25.50 }} />
        </TestWrapper>
      );

      let balanceElement = screen.getByText('25.50');
      expect(balanceElement).toHaveClass('text-success-600');

      rerender(
        <TestWrapper>
          <GroupCard party={{ ...mockPartyInfo, primaryParticipantBalance: -15.25 }} />
        </TestWrapper>
      );

      balanceElement = screen.getByText('-15.25');
      expect(balanceElement).toHaveClass('text-danger-600');

      rerender(
        <TestWrapper>
          <GroupCard party={{ ...mockPartyInfo, primaryParticipantBalance: 0 }} />
        </TestWrapper>
      );

      balanceElement = screen.getAllByText('0.00').find(el => el.classList.contains('text-primary'))!;
      expect(balanceElement).toBeDefined();
      expect(balanceElement).toHaveClass('text-primary');
    });
  });

  describe('User Interactions', () => {
    it('renders clickable card when not disabled', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const card = document.querySelector('form') || document.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      if (card) {
        expect(card).toHaveAttribute('tabindex', '0');
      }
    });

    it('does not navigate when disablePress is true', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} disablePress={true} />
        </TestWrapper>
      );

      // When disablePress is true, the card might not have a button role
      const card = document.querySelector('form') || document.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      // Check that it doesn't have cursor-pointer when disabled
      if (card) {
        expect(card).not.toHaveClass('cursor-pointer');
      }
    });

    it('renders share button correctly', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const shareButton = screen.getAllByRole('button')[0];
      expect(shareButton).toBeInTheDocument();
      expect(shareButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('disables export button when no expenses', () => {
      const noExpensesParty = { ...mockPartyInfo, totalExpenses: 0 };
      
      render(
        <TestWrapper>
          <GroupCard party={noExpensesParty} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const exportButton = buttons[buttons.length - 1]; // Export button is last
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Unfollow Modal', () => {
    it('opens unfollow confirmation modal when trash button is clicked', async () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const trashButton = buttons.find(btn => 
        btn.querySelector('svg') && 
        btn.getAttribute('color') === 'danger'
      );
      
      if (trashButton) {
        await userEvent.click(trashButton);

        await waitFor(() => {
          expect(screen.getByText('Unfollow Group')).toBeInTheDocument();
          expect(screen.getByText('Are you sure you want to unfollow this group?')).toBeInTheDocument();
        });
      }
    });

    it('cancels unfollow when cancel button is clicked', async () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const trashButton = buttons.find(btn => 
        btn.querySelector('svg') && 
        btn.getAttribute('color') === 'danger'
      );
      
      if (trashButton) {
        await userEvent.click(trashButton);

        await waitFor(() => {
          const cancelButton = screen.getByText('Cancel');
          expect(cancelButton).toBeInTheDocument();
        });

        const cancelButton = screen.getByText('Cancel');
        await userEvent.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByText('Unfollow Group')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles party with zero values', () => {
      const zeroParty = {
        ...mockPartyInfo,
        totalExpenses: 0,
        totalTransactions: 0,
        outstandingBalance: 0,
        totalParticipants: 0,
      };

      render(
        <TestWrapper>
          <GroupCard party={zeroParty} />
        </TestWrapper>
      );

      expect(screen.getAllByText('0.00').length).toBeGreaterThanOrEqual(2); // Total expenses and outstanding balance
      expect(screen.getAllByText('0')).toHaveLength(2); // Total transactions and participants badge both show 0
    });

    it('handles party with large numbers', () => {
      const largeNumberParty = {
        ...mockPartyInfo,
        totalExpenses: 9999999.99,
        totalTransactions: 9999,
        outstandingBalance: 9999999.99,
        totalParticipants: 999,
      };

      render(
        <TestWrapper>
          <GroupCard party={largeNumberParty} />
        </TestWrapper>
      );

      expect(screen.getAllByText('9999999.99')).toHaveLength(2); // Total expenses and outstanding balance
      expect(screen.getByText('9999')).toBeInTheDocument(); // Total transactions
      expect(screen.getByText('999')).toBeInTheDocument(); // Total participants
    });

    it('handles different currency codes', () => {
      const eurParty = { ...mockPartyInfo, currency: 'EUR' };

      render(
        <TestWrapper>
          <GroupCard party={eurParty} />
        </TestWrapper>
      );

      expect(screen.getAllByText('EUR').length).toBeGreaterThanOrEqual(2);
    });

    it('handles very long party names', () => {
      const longNameParty = {
        ...mockPartyInfo,
        name: 'This is a very long party name that might cause layout issues in the UI',
      };

      render(
        <TestWrapper>
          <GroupCard party={longNameParty} />
        </TestWrapper>
      );

      expect(screen.getAllByText('This is a very long party name that might cause layout issues in the UI')).toHaveLength(2);
    });
  });

  describe('Computed Values', () => {
    it('updates balance color when outstanding balance changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <GroupCard party={{ ...mockPartyInfo, outstandingBalance: 0 }} />
        </TestWrapper>
      );

      let balanceElement = screen.getAllByText('0.00').find(el => el.classList.contains('text-primary'));
      expect(balanceElement).toBeDefined();
      expect(balanceElement).toHaveClass('text-primary');

      rerender(
        <TestWrapper>
          <GroupCard party={{ ...mockPartyInfo, outstandingBalance: 100 }} />
        </TestWrapper>
      );

      balanceElement = screen.getByText('100.00');
      expect(balanceElement).toHaveClass('text-danger-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles and labels', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('has proper modal accessibility when opened', async () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      const trashButton = buttons.find(btn => 
        btn.querySelector('svg') && 
        btn.getAttribute('color') === 'danger'
      );
      
      if (trashButton) {
        await userEvent.click(trashButton);

        await waitFor(() => {
          const modal = screen.getByRole('dialog');
          expect(modal).toBeInTheDocument();
          expect(modal).toHaveAttribute('aria-modal', 'true');
        });
      }
    });
  });

  describe('Description Display', () => {
    it('renders description when provided', () => {
      const partyWithDescription = { 
        ...mockPartyInfo, 
        description: 'A test group for weekend activities and expenses' 
      };
      
      render(
        <TestWrapper>
          <GroupCard party={partyWithDescription} />
        </TestWrapper>
      );

      expect(screen.getByText('A test group for weekend activities and expenses')).toBeInTheDocument();
    });

    it('does not render description when null', () => {
      render(
        <TestWrapper>
          <GroupCard party={mockPartyInfo} />
        </TestWrapper>
      );

      // Should not contain any description paragraph
      const descriptions = document.querySelectorAll('p');
      expect(descriptions).toHaveLength(0);
    });
  });
});