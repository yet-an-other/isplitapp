import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Use vi.hoisted to avoid hoisting issues
const { mockCreateParty, mockUpdateParty, mockNavigate, mockAlertSuccess, mockAlertError } = vi.hoisted(() => ({
  mockCreateParty: vi.fn(),
  mockUpdateParty: vi.fn(),
  mockNavigate: vi.fn(),
  mockAlertSuccess: vi.fn(),
  mockAlertError: vi.fn()
}));

// Mock modules
vi.mock('swr', () => ({
  default: () => ({ data: null, error: null, isLoading: false }),
  mutate: vi.fn()
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'groupEdit.defaultNames.0': 'Alice',
        'groupEdit.defaultNames.1': 'Bob',
        'groupEdit.groupSection.title': 'Group',
        'groupEdit.fields.groupName.label': 'Group Name',
        'groupEdit.fields.currency.label': 'Currency',
        'groupEdit.fields.participantName.label': 'Name',
        'groupEdit.participantsSection.title': 'Participants',
        'groupEdit.buttons.createGroup': 'Create Group',
        'groupEdit.buttons.updateGroup': 'Update Group',
        'groupEdit.success.groupCreated': 'Group created successfully!',
        'groupEdit.success.groupUpdated': 'Group updated successfully!',
        'groupEdit.errors.saveFailed': 'Failed to save the group. Please try again later.'
      };
      return translations[key] || key;
    }
  })
}));

vi.mock('../../utils/useAlerts', () => ({
  useAlerts: () => ({ 
    alertError: mockAlertError,
    alertSuccess: mockAlertSuccess 
  })
}));

vi.mock('../../utils/deviceSetting', () => ({
  useDeviceSetting: () => ({ defaultUserName: 'TestUser' })
}));

vi.mock('../../utils/partySetting', () => ({
  usePartySetting: () => ({
    primaryParticipantId: null,
    setPrimaryParticipantId: vi.fn()
  })
}));

vi.mock('../../api/expenseApi', () => ({
  createParty: mockCreateParty,
  updateParty: mockUpdateParty,
  fetcher: vi.fn()
}));

// Store for mocking useParams
let mockGroupId = '';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ groupId: mockGroupId })
  };
});

// Import the component after mocks are set up
import { GroupEdit } from '../../pages/GroupEdit';

describe('GroupEdit Alert Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGroupId = '';
    mockCreateParty.mockResolvedValue(undefined);
    mockUpdateParty.mockResolvedValue(undefined);
  });

  it('should show success alert when creating a new group', async () => {
    render(
      <MemoryRouter initialEntries={['/group/new']}>
        <GroupEdit />
      </MemoryRouter>
    );

    // Fill in required fields
    const groupNameInput = screen.getByLabelText('Group Name');
    const currencyInput = screen.getByLabelText('Currency');
    
    fireEvent.change(groupNameInput, { target: { value: 'Trip to Paris' } });
    fireEvent.change(currencyInput, { target: { value: 'EUR' } });

    // Fill in participant names
    const participantInputs = screen.getAllByLabelText('Name');
    fireEvent.change(participantInputs[0], { target: { value: 'Alice' } });
    fireEvent.change(participantInputs[1], { target: { value: 'Bob' } });

    // Click save button
    const saveButton = screen.getByText('Create Group');
    fireEvent.click(saveButton);

    // Wait for async operations
    await waitFor(() => {
      expect(mockCreateParty).toHaveBeenCalledTimes(1);
    });

    expect(mockAlertSuccess).toHaveBeenCalledWith('Group created successfully!');
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should show success alert when updating an existing group', async () => {
    // Set up for editing existing group
    mockGroupId = 'existing123';
    
    render(
      <MemoryRouter initialEntries={['/group/existing123']}>
        <GroupEdit />
      </MemoryRouter>
    );

    // Fill in required fields
    const groupNameInput = screen.getByLabelText('Group Name');
    const currencyInput = screen.getByLabelText('Currency');
    
    fireEvent.change(groupNameInput, { target: { value: 'Updated Trip' } });
    fireEvent.change(currencyInput, { target: { value: 'USD' } });

    // Fill in participant names
    const participantInputs = screen.getAllByLabelText('Name');
    fireEvent.change(participantInputs[0], { target: { value: 'Alice' } });
    fireEvent.change(participantInputs[1], { target: { value: 'Bob' } });

    // Click save button
    const saveButton = screen.getByText('Update Group');
    fireEvent.click(saveButton);

    // Wait for async operations
    await waitFor(() => {
      expect(mockUpdateParty).toHaveBeenCalledTimes(1);
    });

    expect(mockAlertSuccess).toHaveBeenCalledWith('Group updated successfully!');
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should show error alert when save fails', async () => {
    // Make the API call fail
    mockCreateParty.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <MemoryRouter initialEntries={['/group/new']}>
        <GroupEdit />
      </MemoryRouter>
    );

    // Fill in required fields
    const groupNameInput = screen.getByLabelText('Group Name');
    const currencyInput = screen.getByLabelText('Currency');
    
    fireEvent.change(groupNameInput, { target: { value: 'Trip to Paris' } });
    fireEvent.change(currencyInput, { target: { value: 'EUR' } });

    // Fill in participant names
    const participantInputs = screen.getAllByLabelText('Name');
    fireEvent.change(participantInputs[0], { target: { value: 'Alice' } });
    fireEvent.change(participantInputs[1], { target: { value: 'Bob' } });

    // Click save button
    const saveButton = screen.getByText('Create Group');
    fireEvent.click(saveButton);

    // Wait for async operations
    await waitFor(() => {
      expect(mockCreateParty).toHaveBeenCalledTimes(1);
    });

    expect(mockAlertError).toHaveBeenCalledWith('Failed to save the group. Please try again later.');
    expect(mockAlertSuccess).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not show any alert when validation fails', async () => {
    render(
      <MemoryRouter initialEntries={['/group/new']}>
        <GroupEdit />
      </MemoryRouter>
    );

    // Leave fields empty to trigger validation error
    const saveButton = screen.getByText('Create Group');
    fireEvent.click(saveButton);

    // Wait a bit to ensure no async operations happen
    await waitFor(() => {
      expect(mockCreateParty).not.toHaveBeenCalled();
    }, { timeout: 500 });

    expect(mockAlertSuccess).not.toHaveBeenCalled();
    expect(mockAlertError).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});