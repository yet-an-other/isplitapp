/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import this for the matchers
import HeaderBar from './HeaderBar';
import { BrowserRouter } from 'react-router-dom';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.appName': 'groups'
      };
      return translations[key] || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

describe('HeaderBar', () => {
  it('renders the app name', () => {
    render(
        <BrowserRouter>
            <HeaderBar />
        </BrowserRouter>
    );
    expect(screen.getByText('groups')).toBeInTheDocument();
  });
});
