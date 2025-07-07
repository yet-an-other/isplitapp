/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import this for the matchers
import HeaderBar from './HeaderBar';
import { BrowserRouter } from 'react-router-dom';

describe('HeaderBar', () => {
  it('renders the app name', () => {
    render(
        <BrowserRouter>
            <HeaderBar />
        </BrowserRouter>
    );
    expect(screen.getByText('iSplitApp')).toBeInTheDocument();
  });
});
