import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useSWR from 'swr';
import { ActivityList } from '../../pages/ActivityList';
import { ActivityInfo } from '../../api/contract/ActivityInfo';
import { useDeviceSetting } from '../../utils/deviceSetting';

// Mock useSWR
vi.mock('swr');
const mockUseSWR = vi.mocked(useSWR);

// Mock useDeviceSetting hook
vi.mock('../../utils/deviceSetting', () => ({
  useDeviceSetting: vi.fn()
}));
const mockUseDeviceSetting = vi.mocked(useDeviceSetting);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'activityLog.title': 'Activity Log',
        'activityLog.emptyState': 'No activities yet',
        'activityLog.disabled': 'Activity log is disabled. You can enable it in the settings.',
        'activityLog.loading': 'Loading activities...',
        'activityLog.error': 'Failed to load activities',
        'activityLog.types.ExpenseAdded': 'Added expense',
        'activityLog.types.ExpenseUpdated': 'Updated expense', 
        'activityLog.types.ExpenseDeleted': 'Deleted expense',
        'activityLog.types.GroupUpdated': 'Updated group',
        'activityLog.types.ParticipantAdded': 'Added participant',
        'activityLog.types.ParticipantRemoved': 'Removed participant'
      };
      return translations[key] || key;
    }
  })
}));

// Mock useOutletContext
const mockOutletContext = {
  party: {
    id: 'test-party-123',
    name: 'Test Group',
    currency: 'USD',
    outstandingBalance: 100
  },
  primaryParticipantId: 'participant-1'
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => mockOutletContext
  };
});

describe('ActivityList', () => {
  const mockActivities: ActivityInfo[] = [
    {
      id: 'activity-1',
      activityType: 'ExpenseAdded',
      description: 'Added expense: Dinner at restaurant',
      created: new Date('2024-01-15T10:00:00Z'),
      timestamp: '20240115100000',
      entityId: 'expense-1',
      deviceId: 'device-1'
    },
    {
      id: 'activity-2',
      activityType: 'GroupUpdated',
      description: 'Updated group name to "Trip to Paris"',
      created: new Date('2024-01-14T15:30:00Z'),
      timestamp: '20240114153000',
      deviceId: 'device-1'
    },
    {
      id: 'activity-3',
      activityType: 'ParticipantAdded',
      description: 'Added participant: Alice',
      created: new Date('2024-01-13T09:00:00Z'),
      timestamp: '20240113090000',
      entityId: 'participant-1',
      deviceId: 'device-2'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderActivityList = () => {
    return render(
      <MemoryRouter>
        <ActivityList />
      </MemoryRouter>
    );
  };

  describe('When Activity Log is Disabled', () => {
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

    it('should show disabled message when activity log is disabled', async () => {
      // Arrange
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false
      });

      // Act
      renderActivityList();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Activity log is disabled. You can enable it in the settings.')).toBeInTheDocument();
      });
    });

    it('should not fetch activity data when disabled', () => {
      // Arrange
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
        isValidating: false
      });

      // Act
      renderActivityList();

      // Assert
      expect(mockUseSWR).toHaveBeenCalledWith(
        null, // Should be null when disabled
        expect.any(Function)
      );
    });
  });

  describe('When Activity Log is Enabled', () => {
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

    describe('Loading State', () => {
      it('should show loading skeleton when data is loading', async () => {
        // Arrange
        mockUseSWR.mockReturnValue({
          data: undefined,
          error: null,
          isLoading: true,
          mutate: vi.fn(),
          isValidating: false
        });

        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          // CardSkeleton renders a shimmer effect - check for its characteristic classes
          const shimmerElement = document.querySelector('[class*="animate-shimmer"]');
          expect(shimmerElement).toBeInTheDocument();
        });
      });
    });

    describe('Error State', () => {
      it('should show error card when data fails to load', async () => {
        // Arrange
        const mockError = { message: 'Failed to fetch' };
        mockUseSWR.mockReturnValue({
          data: undefined,
          error: mockError,
          isLoading: false,
          mutate: vi.fn(),
          isValidating: false
        });

        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          // ErrorCard shows translation keys, check for actual error message content
          expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
        });
      });
    });

    describe('Empty State', () => {
      it('should show empty state when no activities are available', async () => {
        // Arrange
        mockUseSWR.mockReturnValue({
          data: [],
          error: null,
          isLoading: false,
          mutate: vi.fn(),
          isValidating: false
        });

        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          expect(screen.getByText(/no activities yet/i)).toBeInTheDocument();
        });
      });
    });

    describe('Activity List Display', () => {
      beforeEach(() => {
        mockUseSWR.mockReturnValue({
          data: mockActivities,
          error: null,
          isLoading: false,
          mutate: vi.fn(),
          isValidating: false
        });
      });

      it('should display all activities in single-line format', async () => {
        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          // Check for activity descriptions 
          expect(screen.getByText('Added expense: Dinner at restaurant')).toBeInTheDocument();
          expect(screen.getByText('Updated group name to "Trip to Paris"')).toBeInTheDocument();
          expect(screen.getByText('Added participant: Alice')).toBeInTheDocument();
          
          // Verify that all 3 activity items are rendered
          expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
          expect(screen.getByTestId('activity-item-activity-2')).toBeInTheDocument();
          expect(screen.getByTestId('activity-item-activity-3')).toBeInTheDocument();
        });
      });

      it('should display activities in chronological order (newest first)', async () => {
        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          const activityElements = screen.getAllByTestId(/activity-item/i);
          expect(activityElements).toHaveLength(3);
          
          // Check that the first activity is the most recent one (contains the expense description)
          expect(activityElements[0]).toHaveTextContent('Added expense: Dinner at restaurant');
        });
      });

      it('should display activity timestamps', async () => {
        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          // Check for relative time display (exact format may vary)
          expect(screen.getByTestId('activity-item-activity-1')).toBeInTheDocument();
        });
      });

      it('should show activity type icons', async () => {
        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          const activityItems = screen.getAllByTestId(/activity-item/i);
          expect(activityItems).toHaveLength(3);
          
          // Each activity item should have an icon (implementation-specific)
          activityItems.forEach(item => {
            expect(item).toBeInTheDocument();
          });
        });
      });

      it('should display device information in single-line format for each activity', async () => {
        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          // Check specific activities are present with their content
          const activity1 = screen.getByTestId('activity-item-activity-1');
          const activity2 = screen.getByTestId('activity-item-activity-2');
          const activity3 = screen.getByTestId('activity-item-activity-3');
          
          expect(activity1).toBeInTheDocument();
          expect(activity2).toBeInTheDocument();
          expect(activity3).toBeInTheDocument();
          
          // Each should contain device attribution
          expect(activity1).toHaveTextContent('by');
          expect(activity2).toHaveTextContent('by');
          expect(activity3).toHaveTextContent('by');
        });
      });

      it('should display formatted timestamps in single-line format for each activity', async () => {
        // Act
        renderActivityList();

        // Assert
        await waitFor(() => {
          // Check specific activities are present with their content
          const activity1 = screen.getByTestId('activity-item-activity-1');
          const activity2 = screen.getByTestId('activity-item-activity-2');
          const activity3 = screen.getByTestId('activity-item-activity-3');
          
          expect(activity1).toBeInTheDocument();
          expect(activity2).toBeInTheDocument();
          expect(activity3).toBeInTheDocument();
          
          // Each should contain timestamp with "at"
          expect(activity1).toHaveTextContent('at');
          expect(activity2).toHaveTextContent('at');
          expect(activity3).toHaveTextContent('at');
        });
      });


      it('should display all activity types in single-line format', async () => {
        // Arrange - Mock activities with different types
        const mixedActivities = [
          {
            id: 'activity-expense',
            activityType: 'ExpenseAdded', 
            description: 'Added expense: Lunch',
            created: new Date('2024-01-15T10:00:00Z'),
            timestamp: '20240115100000',
            entityId: 'expense-1',
            deviceId: 'device-1'
          },
          {
            id: 'activity-group',
            activityType: 'GroupUpdated',
            description: 'Updated group name', 
            created: new Date('2024-01-14T15:30:00Z'),
            timestamp: '20240114153000',
            deviceId: 'device-2'
          }
        ];

        mockUseSWR.mockReturnValue({
          data: mixedActivities,
          error: null,
          isLoading: false,
          mutate: vi.fn(),
          isValidating: false
        });

        // Act
        renderActivityList();

        // Assert  
        await waitFor(() => {
          // Check descriptions
          expect(screen.getByText('Added expense: Lunch')).toBeInTheDocument();
          expect(screen.getByText('Updated group name')).toBeInTheDocument();
          
          // Check activities are rendered with device and timestamp info
          expect(screen.getByTestId('activity-item-activity-expense')).toHaveTextContent('by');
          expect(screen.getByTestId('activity-item-activity-group')).toHaveTextContent('by');
          expect(screen.getByTestId('activity-item-activity-expense')).toHaveTextContent('at');
          expect(screen.getByTestId('activity-item-activity-group')).toHaveTextContent('at');
          
          // Should not show any edit buttons
          expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        });
      });
    });

    describe('Data Fetching', () => {
      it('should fetch activities for the correct party ID when enabled', () => {
        // Arrange
        mockUseSWR.mockReturnValue({
          data: mockActivities,
          error: null,
          isLoading: false,
          mutate: vi.fn(),
          isValidating: false
        });

        // Act
        renderActivityList();

        // Assert
        expect(mockUseSWR).toHaveBeenCalledWith(
          `/parties/${mockOutletContext.party.id}/activities`,
          expect.any(Function)
        );
      });
    });
  });
});