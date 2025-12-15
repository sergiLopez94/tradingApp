import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('App Component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
    localStorage.setItem('clientId', 'TEST001');
    // Mock default empty response for all fetch calls
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it('should render the Header component', () => {
    render(<App />);
    expect(screen.getByText('TradeApp')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<App />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should render Portfolio component by default', () => {
    render(<App />);
    // Portfolio component renders "Portfolio Overview" title
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
  });
});
