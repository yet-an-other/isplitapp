import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchActivities } from '../../api/expenseApi';
import { ActivityInfo } from '../../api/contract/ActivityInfo';
import * as userApi from '../../api/userApi';

// Mock the userApi module
vi.mock('../../api/userApi', () => ({
  ensureDeviceId: vi.fn()
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Activity API Integration', () => {
  const mockDeviceId = 'test-device-id-12345';
  const mockPartyId = 'test-party-id-67890';
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userApi.ensureDeviceId).mockResolvedValue(mockDeviceId);
  });

  describe('fetchActivities', () => {
    it('should fetch activities for a party successfully', async () => {
      // Arrange
      const mockActivities: ActivityInfo[] = [
        {
          id: 'activity-1',
          activityType: 'ExpenseAdded',
          description: 'Added expense: Dinner',
          created: new Date('2024-01-15T10:00:00Z'),
          timestamp: '20240115100000',
          entityId: 'expense-1',
          deviceId: mockDeviceId
        },
        {
          id: 'activity-2',
          activityType: 'GroupUpdated',
          description: 'Updated group name',
          created: new Date('2024-01-14T15:30:00Z'),
          timestamp: '20240114153000',
          deviceId: mockDeviceId
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(mockActivities)).buffer)
      });

      // Act
      const result = await fetchActivities(mockPartyId);

      // Assert
      expect(result).toEqual(mockActivities);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/parties/${mockPartyId}/activities$`)),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Device-Id': mockDeviceId
          })
        })
      );
    });

    it('should handle empty activity list', async () => {
      // Arrange
      const emptyActivities: ActivityInfo[] = [];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(emptyActivities)).buffer)
      });

      // Act
      const result = await fetchActivities(mockPartyId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle API error responses', async () => {
      // Arrange
      const errorResponse = {
        title: 'Not Found',
        status: 404,
        detail: 'Party not found'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse)
      });

      // Act & Assert
      await expect(fetchActivities(mockPartyId)).rejects.toThrow();
    });

    it('should parse dates correctly in activity responses', async () => {
      // Arrange

      // The API response will have date as string, but should be parsed to Date object
      const apiResponse = [
        {
          id: 'activity-with-date',
          activityType: 'ExpenseAdded',
          description: 'Test activity with date',
          created: '2024-01-15T10:00:00.123Z',
          timestamp: '20240115100000',
          deviceId: mockDeviceId
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(apiResponse)).buffer)
      });

      // Act
      const result = await fetchActivities(mockPartyId);

      // Assert
      expect(result[0].created).toBeInstanceOf(Date);
      expect(result[0].created).toEqual(new Date('2024-01-15T10:00:00.123Z'));
    });

    it('should include device ID in request headers', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode('[]').buffer)
      });

      // Act
      await fetchActivities(mockPartyId);

      // Assert
      expect(userApi.ensureDeviceId).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Device-Id': mockDeviceId
          })
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchActivities(mockPartyId)).rejects.toThrow('Network error');
    });
  });
});