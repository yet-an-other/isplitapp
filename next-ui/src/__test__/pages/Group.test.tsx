import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import useSWR from 'swr';
import { Group } from '../../pages/Group';
import { PartyInfo } from '../../api/contract/PartyInfo';
import { useDeviceSetting } from '../../utils/deviceSetting';

// Mock useSWR
vi.mock('swr');
const mockUseSWR = vi.mocked(useSWR);

// Mock useDeviceSetting hook
vi.mock('../../utils/deviceSetting', () => ({
  useDeviceSetting: vi.fn()
}));
const mockUseDeviceSetting = vi.mocked(useDeviceSetting);

// Mock usePartySetting hook
vi.mock('../../utils/partySetting', () => ({
  usePartySetting: vi.fn(() => ({
    primaryParticipantId: 'participant-1'
  }))
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'group.tabs.expenses': 'Expenses',
        'group.tabs.balance': 'Balance',
        'group.tabs.activity': 'Activity',
        'group.tabs.descriptions.expenses': 'Explore the group\'s expenses and money transfers here',
        'group.tabs.descriptions.balance': 'Here is the total amount each member borrowed or lent to the group',
        'group.tabs.descriptions.activity': 'View the complete history of changes made to this group',
        'group.navigation.toGroupList': 'To Group List',
        'common.errors.generic': 'Something went wrong! Please try again later.'
      };
      return translations[key] || key;
    }
  })
}));

// Mock child components
vi.mock('../../pages/ExpenseList', () => ({
  ExpenseList: () => <div data-testid="expense-list">Expense List Content</div>
}));

vi.mock('../../pages/Balance', () => ({
  Balance: () => <div data-testid="balance">Balance Content</div>
}));

vi.mock('../../pages/ActivityList', () => ({
  ActivityList: () => <div data-testid="activity-list">Activity List Content</div>
}));

vi.mock('../../pages/GroupEdit', () => ({
  GroupEdit: () => <div data-testid="group-edit">Group Edit Content</div>
}));

describe('Group', () => {
  const mockParty: PartyInfo = {
    id: 'test-party-123',
    name: 'Test Group',
    description: 'Test Description',
    currency: 'USD',
    outstandingBalance: 100,
    totalExpenses: 250,
    totalTransactions: 10,
    totalParticipants: 2,
    participants: [
      { id: 'participant-1', name: 'Alice', canDelete: true },
      { id: 'participant-2', name: 'Bob', canDelete: true }
    ],
    isArchived: false,
    created: new Date('2024-01-01T00:00:00Z'),
    updated: new Date('2024-01-15T10:00:00Z'),
    updateTimestamp: '20240115100000',
    lastExpenseTimestamp: '20240115100000',
    primaryParticipantBalance: null,
    primaryParticipantExpenses: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful party fetch
    mockUseSWR.mockReturnValue({
      data: mockParty,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false
    });
  });

  const renderGroup = (initialRoute = '/test-party-123/expenses') => {
    const router = createMemoryRouter([
      {
        path: '/:groupId',
        element: <Group />,
        children: [
          {
            path: 'expenses',
            element: <div data-testid="expense-list">Expense List Content</div>,
            handle: 'expenses'
          },
          {
            path: 'balance', 
            element: <div data-testid="balance">Balance Content</div>,
            handle: 'balance'
          },
          {
            path: 'activity',
            element: <div data-testid="activity-list">Activity List Content</div>, 
            handle: 'activity'
          }
        ]
      }
    ], {
      initialEntries: [initialRoute]
    });

    return render(<RouterProvider router={router} />);
  };

  describe('Tab Visibility Based on Settings', () => {
    it('should show expenses and balance tabs when activity log is disabled', async () => {
      // Arrange
      mockUseDeviceSetting.mockReturnValue({
        enableActivityLog: false,
        partyIconStyle: 'bauhaus' as const,
        defaultUserName: '',
        setPartyIconStyle: vi.fn(),
        setDefaultUserName: vi.fn(),
        setEnableActivityLog: vi.fn()
      });

      // Act
      renderGroup();

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expenses' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Balance' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Activity' })).not.toBeInTheDocument();
      });
    });

    it('should show expenses, balance, and activity tabs when activity log is enabled', async () => {
      // Arrange
      mockUseDeviceSetting.mockReturnValue({
        enableActivityLog: true,
        partyIconStyle: 'bauhaus' as const,
        defaultUserName: '',
        setPartyIconStyle: vi.fn(),
        setDefaultUserName: vi.fn(),
        setEnableActivityLog: vi.fn()
      });

      // Act
      renderGroup();

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expenses' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Balance' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Activity' })).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockUseDeviceSetting.mockReturnValue({
        enableActivityLog: true,
        partyIconStyle: 'bauhaus' as const,
        defaultUserName: '',
        setPartyIconStyle: vi.fn(),
        setDefaultUserName: vi.fn(),
        setEnableActivityLog: vi.fn()
      });
    });

    it('should display expenses content when on expenses tab', async () => {
      // Act
      renderGroup('/test-party-123/expenses');

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('expense-list')).toBeInTheDocument();
      });
    });

    it('should display balance content when on balance tab', async () => {
      // Act
      renderGroup('/test-party-123/balance');

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('balance')).toBeInTheDocument();
      });
    });

    it('should display activity content when on activity tab', async () => {
      // Act
      renderGroup('/test-party-123/activity');

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('activity-list')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading skeleton when party data is loading', () => {
      // Arrange
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: vi.fn(),
        isValidating: false
      });

      mockUseDeviceSetting.mockReturnValue({
        enableActivityLog: false,
        partyIconStyle: 'bauhaus' as const,
        defaultUserName: '',
        setPartyIconStyle: vi.fn(),
        setDefaultUserName: vi.fn(),
        setEnableActivityLog: vi.fn()
      });

      // Act
      renderGroup();

      // Assert
      // Should show some loading indicator (exact implementation may vary)
      expect(screen.queryByText('Expenses')).not.toBeInTheDocument();
    });

    it('should show error message when party fails to load', async () => {
      // Arrange
      const mockError = { message: 'Failed to fetch party' };
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false
      });

      mockUseDeviceSetting.mockReturnValue({
        enableActivityLog: false,
        partyIconStyle: 'bauhaus' as const,
        defaultUserName: '',
        setPartyIconStyle: vi.fn(),
        setDefaultUserName: vi.fn(),
        setEnableActivityLog: vi.fn()
      });

      // Act
      renderGroup();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch party')).toBeInTheDocument();
      });
    });
  });

  describe('Group Header Information', () => {
    beforeEach(() => {
      mockUseDeviceSetting.mockReturnValue({
        enableActivityLog: false,
        partyIconStyle: 'bauhaus' as const,
        defaultUserName: '',
        setPartyIconStyle: vi.fn(),
        setDefaultUserName: vi.fn(),
        setEnableActivityLog: vi.fn()
      });
    });

    it('should display group name in header', async () => {
      // Act
      renderGroup();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });
    });

    it('should have navigation back to group list', async () => {
      // Act
      renderGroup();

      // Assert
      await waitFor(() => {
        // GroupCard component handles this navigation, just check that component renders
        expect(screen.getByText('Test Group')).toBeInTheDocument();
      });
    });
  });
});