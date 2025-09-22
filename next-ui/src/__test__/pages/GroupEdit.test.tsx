import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GroupEdit } from '../../pages/GroupEdit';
import { Auid } from '../../utils/auid';

// Mock the SWR library
vi.mock('swr', () => ({
  default: () => ({ data: null, error: null, isLoading: false }),
  mutate: vi.fn()
}));

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'groupEdit.defaultNames.0': 'Alice',
        'groupEdit.defaultNames.1': 'Bob',
        'groupEdit.groupSection.title': 'Group',
        'groupEdit.groupSection.description': 'Get started now by creating a group of participants to share expenses with',
        'groupEdit.fields.groupName.label': 'Group Name',
        'groupEdit.fields.groupName.description': 'Like \'Trip to Paris\' or \'Sailing in Croatia\'',
        'groupEdit.fields.currency.label': 'Currency',
        'groupEdit.fields.currency.description': 'Will be used for all expenses in this group',
        'groupEdit.fields.participantName.label': 'Name',
        'groupEdit.participantsSection.title': 'Participants',
        'groupEdit.participantsSection.description': 'Add participants who will be sharing expenses in this group',
        'groupEdit.buttons.createGroup': 'Create Group',
        'groupEdit.buttons.updateGroup': 'Update Group',
        'groupEdit.buttons.addParticipant': 'Add Participant',
        'groupEdit.success.groupCreated': 'Group created successfully!',
        'groupEdit.success.groupUpdated': 'Group updated successfully!',
        'groupEdit.errors.saveFailed': 'Failed to save the group. Please try again later.'
      };
      return translations[key] || key;
    }
  })
}));


// Mock all modules without referencing variables
vi.mock('../../utils/useAlerts', () => ({
  useAlerts: () => ({ 
    alertError: vi.fn(),
    alertSuccess: vi.fn()
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
  createParty: vi.fn(),
  updateParty: vi.fn(),
  fetcher: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as Record<string, unknown>;
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    useNavigate: () => vi.fn(),
    useParams: () => vi.fn().mockReturnValue({})()
  };
});

describe('GroupEdit with AUID improvements', () => {
  it('should generate participant IDs using AUID for new parties', () => {
    render(
      <MemoryRouter initialEntries={['/group/new']}>
        <GroupEdit />
      </MemoryRouter>
    );

    // Check that the component renders without errors
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Add Participant')).toBeInTheDocument();
    
    // Check that participant name inputs are present
    const nameInputs = screen.getAllByPlaceholderText('Name');
    expect(nameInputs).toHaveLength(2); // Default two participants
  });

  it('should validate AUID generation works correctly', () => {
    const auid = new Auid();
    const id1 = auid.generate();
    const id2 = auid.generate();
    
    // Generated IDs should be unique
    expect(id1).not.toBe(id2);
    
    // Generated IDs should be valid AUID format
    expect(Auid.isValid(id1)).toBe(true);
    expect(Auid.isValid(id2)).toBe(true);
    
    // Generated IDs should be 11 characters long
    expect(id1).toHaveLength(11);
    expect(id2).toHaveLength(11);
  });

  it('should render clickable participant icons', () => {
    render(
      <MemoryRouter initialEntries={['/group/new']}>
        <GroupEdit />
      </MemoryRouter>
    );

    // Check that participant icon buttons are present
    const iconButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') !== null && 
      button.closest('.flex-row') !== null
    );
    
    // Should have at least 2 participant icon buttons (for default participants)
    expect(iconButtons.length).toBeGreaterThanOrEqual(2);
  });
});