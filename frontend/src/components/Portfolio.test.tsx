import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Portfolio from './Portfolio';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Portfolio Component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
    // Set default client ID
    localStorage.setItem('clientId', 'TEST001');
  });

  it('should render the portfolio title', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<Portfolio />);
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
  });

  it('should display empty state when no transactions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText(/No assets in portfolio/i)).toBeInTheDocument();
    });
  });

  it('should fetch transactions on mount', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
    
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('should display portfolio metrics section', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<Portfolio />);
    expect(screen.getByText(/Cost Basis/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Value/i)).toBeInTheDocument();
  });

  it('should render filter controls when assets exist', async () => {
    const mockTransactions = [
      {
        clientId: 'TEST001',
        transactionId: '1',
        date: '2024-01-01',
        asset: 'Apple Inc.',
        isin: 'US0378331005',
        ticker: 'AAPL',
        assetType: 'Stock',
        quantity: 10,
        unitPrice: 150.0,
        totalValue: 1500.0,
        operation: 'BUY',
      },
    ];
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
    
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText(/Filter by Type/i)).toBeInTheDocument();
    });
  });

  it('should display assets when transactions are loaded', async () => {
    const mockTransactions = [
      {
        clientId: 'TEST001',
        transactionId: '1',
        date: '2024-01-01',
        asset: 'Apple Inc.',
        isin: 'US0378331005',
        ticker: 'AAPL',
        assetType: 'Stock',
        quantity: 10,
        unitPrice: 150.0,
        totalValue: 1500.0,
        operation: 'BUY',
      },
    ];
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
    
    render(<Portfolio />);
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });
  });

  it('should calculate portfolio value correctly', async () => {
    const mockTransactions = [
      {
        clientId: 'TEST001',
        transactionId: '1',
        date: '2024-01-01',
        asset: 'Apple Inc.',
        isin: 'US0378331005',
        ticker: 'AAPL',
        assetType: 'Stock',
        quantity: 10,
        unitPrice: 150.0,
        totalValue: 1500.0,
        operation: 'BUY',
      },
      {
        clientId: 'TEST001',
        transactionId: '2',
        date: '2024-01-02',
        asset: 'Microsoft Corp.',
        isin: 'US5949181045',
        ticker: 'MSFT',
        assetType: 'Stock',
        quantity: 5,
        unitPrice: 300.0,
        totalValue: 1500.0,
        operation: 'BUY',
      },
    ];
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
    
    render(<Portfolio />);
    
    // Portfolio value appears in both Cost Basis and Current Value, so use getAllByText
    await waitFor(() => {
      const matches = screen.getAllByText(/\$3,000\.00/);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(<Portfolio />);
    
    await waitFor(() => {
      // Component should still render without crashing
      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
    });
  });
});
