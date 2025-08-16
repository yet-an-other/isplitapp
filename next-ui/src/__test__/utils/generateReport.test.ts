/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateReport } from '../../utils/generateReport';
import { PartyInfo } from '../../api/contract/PartyInfo';
import { ExpenseInfo } from '../../api/contract/ExpenseInfo';

// Mock the fetcher function
vi.mock('../../api/expenseApi', () => ({
  fetcher: vi.fn(),
}));

describe('generateReport', () => {
  let mockFetcher: ReturnType<typeof vi.fn>;
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the mocked fetcher
    const { fetcher } = await import('../../api/expenseApi');
    mockFetcher = vi.mocked(fetcher);

    // Mock DOM APIs
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    mockCreateElement = vi.fn().mockReturnValue(mockLink);
    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
      writable: true,
    });

    // Mock encodeURI
    global.encodeURI = vi.fn((str: string) => str);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockParty = (overrides: Partial<PartyInfo> = {}): PartyInfo => ({
    id: 'party-123',
    name: 'Test Party',
    currency: 'USD',
    created: new Date('2023-01-01'),
    updated: new Date('2023-01-02'),
    totalExpenses: 100.00,
    totalTransactions: 2,
    outstandingBalance: 0,
    totalParticipants: 3,
    participants: [
      { id: 'participant-1', name: 'Alice', canDelete: false },
      { id: 'participant-2', name: 'Bob', canDelete: false },
      { id: 'participant-3', name: 'Charlie', canDelete: false },
    ],
    isArchived: false,
    updateTimestamp: '2023-01-02T00:00:00Z',
    lastExpenseTimestamp: '2023-01-02T00:00:00Z',
    primaryParticipantBalance: null,
    primaryParticipantExpenses: null,
    ...overrides,
  });

  const createMockExpense = (overrides: Partial<ExpenseInfo> = {}): ExpenseInfo => ({
    id: 'expense-1',
    title: 'Test Expense',
    amount: 60.00,
    date: new Date('2023-01-01'),
    lenderId: 'participant-1',
    lenderName: 'Alice',
    isReimbursement: false,
    splitMode: 'Evenly',
    updateTimestamp: '2023-01-01T00:00:00Z',
    borrowers: [
      { participantId: 'participant-1', participantName: 'Alice', amount: 20.00, share: 1, percent: 33.33 },
      { participantId: 'participant-2', participantName: 'Bob', amount: 20.00, share: 1, percent: 33.33 },
      { participantId: 'participant-3', participantName: 'Charlie', amount: 20.00, share: 1, percent: 33.33 },
    ],
    ...overrides,
  });

  describe('Basic Report Generation', () => {
    it('generates CSV report with correct structure', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)  // First call for party
        .mockResolvedValueOnce(mockExpenses);  // Second call for expenses

      await generateReport('party-123');

      // Verify API calls
      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(mockFetcher).toHaveBeenNthCalledWith(1, '/parties/party-123');
      expect(mockFetcher).toHaveBeenNthCalledWith(2, '/parties/party-123/expenses');

      // Verify link creation and download
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('Test Party report.csv');
      expect(mockLink.click).toHaveBeenCalled();

      // Verify CSV content structure
      expect(mockLink.href).toContain('data:text/csv;charset=utf-8');
      expect(mockLink.href).toContain('Title; Date; Amount; "Alice"; "Bob"; "Charlie"');
    });

    it('includes all participants in CSV header', async () => {
      const mockParty = createMockParty({
        participants: [
          { id: 'p1', name: 'Alice', canDelete: false },
          { id: 'p2', name: 'Bob Smith', canDelete: false },
          { id: 'p3', name: 'Charlie & Co', canDelete: false },
        ],
      });
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('"Alice"');
      expect(mockLink.href).toContain('"Bob Smith"');
      expect(mockLink.href).toContain('"Charlie & Co"');
    });

    it('formats dates correctly in CSV', async () => {
      const testDate = new Date('2023-06-15T10:30:00Z');
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({ date: testDate })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain(testDate.toDateString());
    });

    it('uses semicolon as CSV delimiter', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Check that semicolons are used as delimiters
      expect(mockLink.href).toContain('Title; Date; Amount;');
    });
  });

  describe('Data Transformation and Calculations', () => {
    it('calculates participant amounts correctly for lender', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 90.00,
        lenderId: 'participant-1', // Alice is the lender
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 30.00, share: 1, percent: 33.33 },
          { participantId: 'participant-2', participantName: 'Bob', amount: 30.00, share: 1, percent: 33.33 },
          { participantId: 'participant-3', participantName: 'Charlie', amount: 30.00, share: 1, percent: 33.33 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Alice paid 90.00 and owes 30.00, so net is +60.00
      expect(mockLink.href).toContain('60.00');
    });

    it('calculates participant amounts correctly for non-lender', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 90.00,
        lenderId: 'participant-1', // Alice is the lender
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 30.00, share: 1, percent: 33.33 },
          { participantId: 'participant-2', participantName: 'Bob', amount: 30.00, share: 1, percent: 33.33 },
          { participantId: 'participant-3', participantName: 'Charlie', amount: 30.00, share: 1, percent: 33.33 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Bob paid 0.00 and owes 30.00, so net is -30.00
      expect(mockLink.href).toContain('-30.00');
    });

    it('handles expenses with uneven splits', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 100.00,
        lenderId: 'participant-1',
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 50.00, share: 2, percent: 50.00 },
          { participantId: 'participant-2', participantName: 'Bob', amount: 30.00, share: 1, percent: 30.00 },
          { participantId: 'participant-3', participantName: 'Charlie', amount: 20.00, share: 1, percent: 20.00 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Alice: paid 100.00, owes 50.00 = +50.00
      // Bob: paid 0.00, owes 30.00 = -30.00  
      // Charlie: paid 0.00, owes 20.00 = -20.00
      expect(mockLink.href).toContain('50.00');
      expect(mockLink.href).toContain('-30.00');
      expect(mockLink.href).toContain('-20.00');
    });

    it('handles multiple expenses correctly', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [
        createMockExpense({
          id: 'expense-1',
          title: 'Dinner',
          amount: 60.00,
          lenderId: 'participant-1',
        }),
        createMockExpense({
          id: 'expense-2',
          title: 'Taxi',
          amount: 30.00,
          lenderId: 'participant-2',
          borrowers: [
            { participantId: 'participant-1', participantName: 'Alice', amount: 10.00, share: 1, percent: 33.33 },
            { participantId: 'participant-2', participantName: 'Bob', amount: 10.00, share: 1, percent: 33.33 },
            { participantId: 'participant-3', participantName: 'Charlie', amount: 10.00, share: 1, percent: 33.33 },
          ],
        }),
      ];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('"Dinner"');
      expect(mockLink.href).toContain('"Taxi"');
      expect(mockLink.href).toContain('60');
      expect(mockLink.href).toContain('30');
    });

    it('handles participants not in borrowers list', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 30.00, share: 1, percent: 50.00 },
          { participantId: 'participant-2', participantName: 'Bob', amount: 30.00, share: 1, percent: 50.00 },
          // Charlie is not in borrowers list
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Charlie should have 0.00 (paid nothing, owes nothing)
      expect(mockLink.href).toContain('0.00');
    });

    it('handles decimal precision correctly', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 10.99,
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 3.66, share: 1, percent: 33.33 },
          { participantId: 'participant-2', participantName: 'Bob', amount: 3.66, share: 1, percent: 33.33 },
          { participantId: 'participant-3', participantName: 'Charlie', amount: 3.67, share: 1, percent: 33.34 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Alice: paid 10.99, owes 3.66 = 7.33
      expect(mockLink.href).toContain('7.33');
    });
  });

  describe('CSV Formatting', () => {
    it('quotes expense titles to handle special characters', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        title: 'Dinner at "Restaurant", with; special chars',
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('"Dinner at "Restaurant", with; special chars"');
    });

    it('handles party names with special characters in filename', async () => {
      const mockParty = createMockParty({
        name: 'Trip to "Paris" & Rome',
      });
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.download).toBe('Trip to "Paris" & Rome report.csv');
    });

    it('formats numbers with 2 decimal places', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 100,
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 100, share: 1, percent: 100 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Should format as 0.00, not just 0
      expect(mockLink.href).toContain('0.00');
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('handles API error when fetching party', async () => {
      mockFetcher.mockRejectedValueOnce(new Error('Party not found'));

      await expect(generateReport('invalid-party')).rejects.toThrow('Party not found');
      
      expect(mockFetcher).toHaveBeenCalledWith('/parties/invalid-party');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('handles API error when fetching expenses', async () => {
      const mockParty = createMockParty();
      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockRejectedValueOnce(new Error('Expenses not found'));

      await expect(generateReport('party-123')).rejects.toThrow('Expenses not found');
      
      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('handles empty expenses list', async () => {
      const mockParty = createMockParty();
      const mockExpenses: ExpenseInfo[] = [];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Should still generate report with header only
      expect(mockLink.href).toContain('Title; Date; Amount;');
      expect(mockLink.download).toBe('Test Party report.csv');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles party with no participants', async () => {
      const mockParty = createMockParty({
        participants: [],
      });
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Should still work, just with no participant columns
      expect(mockLink.href).toContain('Title; Date; Amount');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles expenses with empty borrowers list', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        borrowers: [],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // All participants should show 0.00 except lender
      expect(mockLink.href).toContain('0.00');
    });

    it('handles null/undefined dates', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        date: null as any,
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      // Should handle gracefully (convert null to Date would be Invalid Date)
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles very large amounts', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 999999.99,
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 999999.99, share: 1, percent: 100 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('999999.99');
      expect(mockLink.href).toContain('0.00'); // Lender paid amount minus what they owe
    });

    it('handles zero amounts', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        amount: 0,
        borrowers: [
          { participantId: 'participant-1', participantName: 'Alice', amount: 0, share: 1, percent: 100 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('0.00');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('File Download Functionality', () => {
    it('creates CSV download with correct MIME type', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('data:text/csv;charset=utf-8');
    });

    it('sets correct filename for download', async () => {
      const mockParty = createMockParty({
        name: 'My Awesome Trip',
      });
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.download).toBe('My Awesome Trip report.csv');
    });

    it('triggers download by clicking link', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.click).toHaveBeenCalledOnce();
    });

    it('properly encodes CSV content for URL', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense()];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(global.encodeURI).toHaveBeenCalledOnce();
      expect(global.encodeURI).toHaveBeenCalledWith(expect.stringContaining('data:text/csv'));
    });
  });

  describe('Real-world Scenarios', () => {
    it('generates realistic trip expense report', async () => {
      const mockParty = createMockParty({
        name: 'Weekend Getaway',
        currency: 'EUR',
        participants: [
          { id: 'alice', name: 'Alice', canDelete: false },
          { id: 'bob', name: 'Bob', canDelete: false },
          { id: 'charlie', name: 'Charlie', canDelete: false },
          { id: 'diana', name: 'Diana', canDelete: false },
        ],
      });

      const mockExpenses = [
        createMockExpense({
          id: 'hotel',
          title: 'Hotel Room',
          amount: 400.00,
          date: new Date('2023-06-10'),
          lenderId: 'alice',
          borrowers: [
            { participantId: 'alice', participantName: 'Alice', amount: 100.00, share: 1, percent: 25 },
            { participantId: 'bob', participantName: 'Bob', amount: 100.00, share: 1, percent: 25 },
            { participantId: 'charlie', participantName: 'Charlie', amount: 100.00, share: 1, percent: 25 },
            { participantId: 'diana', participantName: 'Diana', amount: 100.00, share: 1, percent: 25 },
          ],
        }),
        createMockExpense({
          id: 'dinner',
          title: 'Group Dinner',
          amount: 120.00,
          date: new Date('2023-06-11'),
          lenderId: 'bob',
          borrowers: [
            { participantId: 'alice', participantName: 'Alice', amount: 30.00, share: 1, percent: 25 },
            { participantId: 'bob', participantName: 'Bob', amount: 30.00, share: 1, percent: 25 },
            { participantId: 'charlie', participantName: 'Charlie', amount: 30.00, share: 1, percent: 25 },
            { participantId: 'diana', participantName: 'Diana', amount: 30.00, share: 1, percent: 25 },
          ],
        }),
        createMockExpense({
          id: 'gas',
          title: 'Gas',
          amount: 80.00,
          date: new Date('2023-06-12'),
          lenderId: 'charlie',
          borrowers: [
            { participantId: 'alice', participantName: 'Alice', amount: 20.00, share: 1, percent: 25 },
            { participantId: 'bob', participantName: 'Bob', amount: 20.00, share: 1, percent: 25 },
            { participantId: 'charlie', participantName: 'Charlie', amount: 20.00, share: 1, percent: 25 },
            { participantId: 'diana', participantName: 'Diana', amount: 20.00, share: 1, percent: 25 },
          ],
        }),
      ];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('weekend-trip');

      // Verify report content
      expect(mockLink.download).toBe('Weekend Getaway report.csv');
      expect(mockLink.href).toContain('"Hotel Room"');
      expect(mockLink.href).toContain('"Group Dinner"');
      expect(mockLink.href).toContain('"Gas"');
      expect(mockLink.href).toContain('400');
      expect(mockLink.href).toContain('120');
      expect(mockLink.href).toContain('80');
      
      // Based on the actual output, the calculation is per expense:
      // Hotel: Alice paid 400, owes 100 = +300; Others owe 100 each = -100
      // Dinner: Bob paid 120, owes 30 = +90; Others owe 30 each = -30  
      // Gas: Charlie paid 80, owes 20 = +60; Others owe 20 each = -20
      expect(mockLink.href).toContain('300.00'); // Alice for hotel
      expect(mockLink.href).toContain('90.00');  // Bob for dinner
      expect(mockLink.href).toContain('60.00');  // Charlie for gas
      expect(mockLink.href).toContain('-100.00'); // Others for hotel
      expect(mockLink.href).toContain('-30.00');  // Others for dinner
      expect(mockLink.href).toContain('-20.00');  // Others for gas
    });

    it('handles reimbursement expenses', async () => {
      const mockParty = createMockParty();
      const mockExpenses = [createMockExpense({
        title: 'Reimbursement to Bob',
        isReimbursement: true,
        amount: 50.00,
        lenderId: 'participant-1',
        borrowers: [
          { participantId: 'participant-2', participantName: 'Bob', amount: 50.00, share: 1, percent: 100 },
        ],
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.href).toContain('"Reimbursement to Bob"');
      expect(mockLink.href).toContain('50.00'); // Alice paid 50, owes 0 = +50
      expect(mockLink.href).toContain('-50.00'); // Bob paid 0, owes 50 = -50
    });
  });

  describe('Performance Considerations', () => {
    it('handles large number of expenses efficiently', async () => {
      const mockParty = createMockParty();
      
      // Generate 100 expenses
      const mockExpenses = Array.from({ length: 100 }, (_, i) =>
        createMockExpense({
          id: `expense-${i}`,
          title: `Expense ${i}`,
          amount: 10.00 + i,
        })
      );

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      const startTime = Date.now();
      await generateReport('party-123');
      const endTime = Date.now();

      // Should complete reasonably quickly (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('handles many participants efficiently', async () => {
      const participants = Array.from({ length: 50 }, (_, i) => ({
        id: `participant-${i}`,
        name: `Person ${i}`,
        canDelete: false,
      }));

      const mockParty = createMockParty({ participants });
      const mockExpenses = [createMockExpense({
        borrowers: participants.map(p => ({
          participantId: p.id,
          participantName: p.name,
          amount: 2.00,
          share: 1,
          percent: 2.00,
        })),
      })];

      mockFetcher
        .mockResolvedValueOnce(mockParty)
        .mockResolvedValueOnce(mockExpenses);

      await generateReport('party-123');

      expect(mockLink.click).toHaveBeenCalled();
      // Verify all participants are in header
      participants.forEach(p => {
        expect(mockLink.href).toContain(`"${p.name}"`);
      });
    });
  });
});