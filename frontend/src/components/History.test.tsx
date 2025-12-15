import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import History from './History';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('History Component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
    localStorage.setItem('clientId', 'TEST001');
  });

  it('should render the transaction history title', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<History />);
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
  });

  it('should display empty state when no transactions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<History />);
    
    await waitFor(() => {
      expect(screen.getByText(/No transactions yet/i)).toBeInTheDocument();
    });
  });

  it('should fetch transactions on mount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<History />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('should display transactions when loaded', async () => {
    const mockTransactions = [
      {
        clientId: 'TEST001',
        transactionId: '1',
        date: '2024-01-01',
        asset: 'Apple Inc.',
        isin: 'US0378331005',
        assetType: 'Stock',
        quantity: 10,
        unitPrice: 150.0,
        totalValue: 1500.0,
      },
    ];
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTransactions,
    });
    
    render(<History />);
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });
  });

  it('should handle sort by clicking column headers', async () => {
    const mockTransactions = [
      {
        clientId: 'TEST001',
        transactionId: '1',
        date: '2024-01-01',
        asset: 'Apple Inc.',
        isin: 'US0378331005',
        assetType: 'Stock',
        quantity: 10,
        unitPrice: 150.0,
        totalValue: 1500.0,
      },
      {
        clientId: 'TEST001',
        transactionId: '2',
        date: '2024-01-02',
        asset: 'Microsoft Corp.',
        isin: 'US5949181045',
        assetType: 'Stock',
        quantity: 5,
        unitPrice: 300.0,
        totalValue: 1500.0,
      },
    ];
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTransactions,
    });
    
    render(<History />);
    
    await waitFor(() => {
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });
    
    // Click on Asset column to sort
    const assetHeader = screen.getByText('Asset');
    fireEvent.click(assetHeader);
    
    // Should still show both transactions
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corp.')).toBeInTheDocument();
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(<History />);
    
    await waitFor(() => {
      // Component should still render without crashing
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
    });
  });
});
