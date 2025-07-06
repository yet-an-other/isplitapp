/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GroupCard } from './GroupCard';
import { BrowserRouter } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { PartyInfo } from '../api/contract/PartyInfo';

// Mock the hooks and utilities
vi.mock('../utils/useAlerts', () => ({
  useAlerts: () => ({
    alertSuccess: vi.fn(),
    alertInfo: vi.fn(),
    alertError: vi.fn(),
  }),
}));

vi.mock('../utils/deviceSetting', () => ({
  useDeviceSetting: () => ({
    partyIconStyle: 'beam',
  }),
}));

vi.mock('../utils/partySetting', () => ({
  usePartySetting: () => ({
    lastViewed: '2023-01-01T00:00:00Z',
  }),
}));

vi.mock('../utils/shareLink', () => ({
  shareLink: vi.fn(),
}));

vi.mock('../utils/generateReport', () => ({
  generateReport: vi.fn(),
}));

vi.mock('../api/expenseApi', () => ({
  unfollowParty: vi.fn(),
  updatePartySetings: vi.fn(),
}));

vi.mock('swr', () => ({
  mutate: vi.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  </BrowserRouter>
);

describe('GroupCard', () => {
  const mockPartyInfo: PartyInfo = {
    id: 'test-party-id',
    name: 'Test Party',
    currency: 'USD',
    created: new Date('2023-01-01'),
    updated: new Date('2023-01-02'),
    totalExpenses: 125.50,
    totalTransactions: 8,
    outstandingBalance: 25.75,
    totalParticipants: 4,
    participants: [],
    isArchived: false,
    updateTimestamp: '2023-01-02T00:00:00Z',
    lastExpenseTimestamp: '2023-01-02T00:00:00Z',
  };

  it('renders party information correctly', () => {
    render(
      <TestWrapper>
        <GroupCard party={mockPartyInfo} />
      </TestWrapper>
    );

    // Check that key elements are rendered
    expect(screen.getByText('Test Party')).toBeInTheDocument();
    expect(screen.getByText('125.50')).toBeInTheDocument();
    expect(screen.getAllByText('USD')).toHaveLength(2); // Appears twice in the component
    expect(screen.getByText('8')).toBeInTheDocument(); // totalTransactions
    expect(screen.getByText('25.75')).toBeInTheDocument(); // outstandingBalance
    expect(screen.getByText('4')).toBeInTheDocument(); // totalParticipants (in badge)
  });

  it('renders with archived styling when party is archived', () => {
    const archivedParty = { ...mockPartyInfo, isArchived: true };
    
    render(
      <TestWrapper>
        <GroupCard party={archivedParty} />
      </TestWrapper>
    );

    // Check that archived party has correct styling - find the card element
    const cardElement = document.querySelector('.text-dimmed');
    expect(cardElement).toBeInTheDocument();
  });

  it('renders balance with correct color styling', () => {
    // Test with zero balance (should be primary color)
    const zeroBalanceParty = { ...mockPartyInfo, outstandingBalance: 0 };
    
    const { rerender } = render(
      <TestWrapper>
        <GroupCard party={zeroBalanceParty} />
      </TestWrapper>
    );

    let balanceElement = screen.getByText('0.00');
    expect(balanceElement).toHaveClass('text-primary');

    // Test with non-zero balance (should be danger color)
    rerender(
      <TestWrapper>
        <GroupCard party={mockPartyInfo} />
      </TestWrapper>
    );

    balanceElement = screen.getByText('25.75');
    expect(balanceElement).toHaveClass('text-danger-600');
  });

  it('renders action buttons', () => {
    render(
      <TestWrapper>
        <GroupCard party={mockPartyInfo} />
      </TestWrapper>
    );

    // Check that action buttons are rendered (they should be icon buttons)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0); // At least some buttons should be present
  });

  it('disables export button when no expenses', () => {
    const noExpensesParty = { ...mockPartyInfo, totalExpenses: 0 };
    
    render(
      <TestWrapper>
        <GroupCard party={noExpensesParty} />
      </TestWrapper>
    );

    // The export button should be disabled - check for disabled attribute
    const disabledButton = document.querySelector('button[disabled]');
    expect(disabledButton).toBeInTheDocument();
  });

  it('renders creation date', () => {
    render(
      <TestWrapper>
        <GroupCard party={mockPartyInfo} />
      </TestWrapper>
    );

    // Check that creation date is rendered somewhere in the component
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });

  it('handles disablePress prop correctly', () => {
    const { rerender } = render(
      <TestWrapper>
        <GroupCard party={mockPartyInfo} disablePress={true} />
      </TestWrapper>
    );

    // When disablePress is true, card should not be pressable
    let card = document.querySelector('.min-h-\\[120px\\]'); // Find the main card container
    expect(card).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <GroupCard party={mockPartyInfo} disablePress={false} />
      </TestWrapper>
    );

    // When disablePress is false, card should be pressable
    // Check for the main card element that's pressable
    const pressableCard = document.querySelector('.cursor-pointer');
    expect(pressableCard).toBeInTheDocument();
  });
});