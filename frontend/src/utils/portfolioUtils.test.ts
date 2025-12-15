import { describe, it, expect } from 'vitest';
import {
  aggregateAssets,
  calculatePortfolioValue,
  calculateCurrentPortfolioValue,
  calculatePortfolioProfitLoss,
  updateAssetsWithPrices,
  filterAssetsByType,
  getUniqueAssetTypes,
  sortAssets,
  formatCurrency,
  formatPercentage,
  type Transaction,
  type Asset,
} from './portfolioUtils';

/**
 * Unit tests for Portfolio utility functions
 * REQ-005: Test asset value aggregation and portfolio calculations
 * 
 * Coverage goals:
 * - Line coverage: >80%
 * - Branch coverage: >70%
 * - Function coverage: 100%
 */
describe('Portfolio Utilities', () => {
  describe('aggregateAssets', () => {
    it('should aggregate single transaction into asset', () => {
      const transactions: Transaction[] = [
        {
          clientId: 'TEST001',
          transactionId: 'TX001',
          date: '2024-01-15',
          asset: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
      ];

      const assets = aggregateAssets(transactions);

      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual({
        name: 'Apple Inc.',
        isin: 'US0378331005',
        ticker: 'AAPL',
        assetType: 'Aktie',
        quantity: 10,
        unitPrice: 150,
        totalValue: 1500,
      });
    });

    it('should aggregate multiple transactions of same asset', () => {
      const transactions: Transaction[] = [
        {
          clientId: 'TEST001',
          transactionId: 'TX001',
          date: '2024-01-15',
          asset: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
        {
          clientId: 'TEST001',
          transactionId: 'TX002',
          date: '2024-01-20',
          asset: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 5,
          unitPrice: 160,
          totalValue: 800,
        },
      ];

      const assets = aggregateAssets(transactions);

      expect(assets).toHaveLength(1);
      expect(assets[0].quantity).toBe(15);
      expect(assets[0].totalValue).toBe(2300);
      // Average price: (10*150 + 5*160) / 15 = 153.33
      expect(assets[0].unitPrice).toBeCloseTo(153.33, 2);
    });

    it('should handle multiple different assets', () => {
      const transactions: Transaction[] = [
        {
          clientId: 'TEST001',
          transactionId: 'TX001',
          date: '2024-01-15',
          asset: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
        {
          clientId: 'TEST001',
          transactionId: 'TX002',
          date: '2024-01-20',
          asset: 'Microsoft Corp.',
          isin: 'US5949181045',
          ticker: 'MSFT',
          assetType: 'Aktie',
          quantity: 5,
          unitPrice: 300,
          totalValue: 1500,
        },
      ];

      const assets = aggregateAssets(transactions);

      expect(assets).toHaveLength(2);
    });

    it('should handle empty transactions array', () => {
      const assets = aggregateAssets([]);
      expect(assets).toHaveLength(0);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('should calculate total value of all assets', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
        {
          name: 'Microsoft Corp.',
          isin: 'US5949181045',
          ticker: 'MSFT',
          assetType: 'Aktie',
          quantity: 5,
          unitPrice: 300,
          totalValue: 1500,
        },
      ];

      const total = calculatePortfolioValue(assets);
      expect(total).toBe(3000);
    });

    it('should return 0 for empty assets', () => {
      const total = calculatePortfolioValue([]);
      expect(total).toBe(0);
    });

    it('should handle decimal values correctly', () => {
      const assets: Asset[] = [
        {
          name: 'Stock A',
          isin: 'US1111111111',
          ticker: 'STKA',
          assetType: 'Aktie',
          quantity: 10.5,
          unitPrice: 123.45,
          totalValue: 1296.225,
        },
      ];

      const total = calculatePortfolioValue(assets);
      expect(total).toBeCloseTo(1296.225, 2);
    });
  });

  describe('calculateCurrentPortfolioValue', () => {
    it('should calculate current value with market prices', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
          currentPrice: 170,
        },
        {
          name: 'Microsoft Corp.',
          isin: 'US5949181045',
          ticker: 'MSFT',
          assetType: 'Aktie',
          quantity: 5,
          unitPrice: 300,
          totalValue: 1500,
          currentPrice: 320,
        },
      ];

      const currentValue = calculateCurrentPortfolioValue(assets);
      expect(currentValue).toBe(3300); // 10*170 + 5*320
    });

    it('should use cost basis if no current price available', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
      ];

      const currentValue = calculateCurrentPortfolioValue(assets);
      expect(currentValue).toBe(1500);
    });

    it('should handle mix of priced and unpriced assets', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
          currentPrice: 170,
        },
        {
          name: 'Microsoft Corp.',
          isin: 'US5949181045',
          ticker: 'MSFT',
          assetType: 'Aktie',
          quantity: 5,
          unitPrice: 300,
          totalValue: 1500,
        },
      ];

      const currentValue = calculateCurrentPortfolioValue(assets);
      expect(currentValue).toBe(3200); // 10*170 + 1500
    });
  });

  describe('calculatePortfolioProfitLoss', () => {
    it('should calculate profit correctly', () => {
      const result = calculatePortfolioProfitLoss(1000, 1200);
      
      expect(result.amount).toBe(200);
      expect(result.percentage).toBe(20);
    });

    it('should calculate loss correctly', () => {
      const result = calculatePortfolioProfitLoss(1000, 800);
      
      expect(result.amount).toBe(-200);
      expect(result.percentage).toBe(-20);
    });

    it('should handle zero cost basis', () => {
      const result = calculatePortfolioProfitLoss(0, 100);
      
      expect(result.amount).toBe(100);
      expect(result.percentage).toBe(0);
    });

    it('should handle no change', () => {
      const result = calculatePortfolioProfitLoss(1000, 1000);
      
      expect(result.amount).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('updateAssetsWithPrices', () => {
    it('should update assets with price data', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
      ];

      const priceData = { AAPL: 170 };
      const updated = updateAssetsWithPrices(assets, priceData);

      expect(updated[0].currentPrice).toBe(170);
      expect(updated[0].currentTotalValue).toBe(1700);
      expect(updated[0].priceChange).toBe(20);
      expect(updated[0].percentChange).toBeCloseTo(13.33, 2);
    });

    it('should not update asset without price data', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
      ];

      const priceData = { MSFT: 320 };
      const updated = updateAssetsWithPrices(assets, priceData);

      expect(updated[0].currentPrice).toBeUndefined();
    });

    it('should ignore invalid prices', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
      ];

      const priceData = { AAPL: 0 };
      const updated = updateAssetsWithPrices(assets, priceData);

      expect(updated[0].currentPrice).toBeUndefined();
    });
  });

  describe('filterAssetsByType', () => {
    const assets: Asset[] = [
      {
        name: 'Apple Inc.',
        isin: 'US0378331005',
        ticker: 'AAPL',
        assetType: 'Aktie',
        quantity: 10,
        unitPrice: 150,
        totalValue: 1500,
      },
      {
        name: 'US Bond',
        isin: 'US1234567890',
        ticker: 'BOND',
        assetType: 'Bond',
        quantity: 5,
        unitPrice: 1000,
        totalValue: 5000,
      },
    ];

    it('should filter assets by type', () => {
      const filtered = filterAssetsByType(assets, 'Aktie');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].assetType).toBe('Aktie');
    });

    it('should return all assets for "All" filter', () => {
      const filtered = filterAssetsByType(assets, 'All');
      expect(filtered).toHaveLength(2);
    });

    it('should return all assets for empty filter', () => {
      const filtered = filterAssetsByType(assets, '');
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getUniqueAssetTypes', () => {
    it('should extract unique asset types', () => {
      const assets: Asset[] = [
        {
          name: 'Apple Inc.',
          isin: 'US0378331005',
          ticker: 'AAPL',
          assetType: 'Aktie',
          quantity: 10,
          unitPrice: 150,
          totalValue: 1500,
        },
        {
          name: 'Microsoft Corp.',
          isin: 'US5949181045',
          ticker: 'MSFT',
          assetType: 'Aktie',
          quantity: 5,
          unitPrice: 300,
          totalValue: 1500,
        },
        {
          name: 'US Bond',
          isin: 'US1234567890',
          ticker: 'BOND',
          assetType: 'Bond',
          quantity: 5,
          unitPrice: 1000,
          totalValue: 5000,
        },
      ];

      const types = getUniqueAssetTypes(assets);
      expect(types).toContain('All');
      expect(types).toContain('Aktie');
      expect(types).toContain('Bond');
      expect(types).toHaveLength(3);
    });

    it('should handle empty assets', () => {
      const types = getUniqueAssetTypes([]);
      expect(types).toEqual(['All']);
    });
  });

  describe('sortAssets', () => {
    const assets: Asset[] = [
      {
        name: 'Zebra Corp',
        isin: 'US1111111111',
        ticker: 'ZBR',
        assetType: 'Aktie',
        quantity: 10,
        unitPrice: 100,
        totalValue: 1000,
      },
      {
        name: 'Apple Inc.',
        isin: 'US0378331005',
        ticker: 'AAPL',
        assetType: 'Aktie',
        quantity: 5,
        unitPrice: 200,
        totalValue: 1000,
      },
    ];

    it('should sort by string field ascending', () => {
      const sorted = sortAssets(assets, 'name', 'asc');
      expect(sorted[0].name).toBe('Apple Inc.');
      expect(sorted[1].name).toBe('Zebra Corp');
    });

    it('should sort by string field descending', () => {
      const sorted = sortAssets(assets, 'name', 'desc');
      expect(sorted[0].name).toBe('Zebra Corp');
      expect(sorted[1].name).toBe('Apple Inc.');
    });

    it('should sort by number field ascending', () => {
      const sorted = sortAssets(assets, 'quantity', 'asc');
      expect(sorted[0].quantity).toBe(5);
      expect(sorted[1].quantity).toBe(10);
    });

    it('should sort by number field descending', () => {
      const sorted = sortAssets(assets, 'quantity', 'desc');
      expect(sorted[0].quantity).toBe(10);
      expect(sorted[1].quantity).toBe(5);
    });

    it('should not mutate original array', () => {
      const original = [...assets];
      sortAssets(assets, 'name', 'asc');
      expect(assets).toEqual(original);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in EUR', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('€');
    });

    it('should handle zero', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0,00');
    });

    it('should handle negative numbers', () => {
      const formatted = formatCurrency(-123.45);
      expect(formatted).toContain('-');
      expect(formatted).toContain('123,45');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage', () => {
      const formatted = formatPercentage(12.5);
      expect(formatted).toBe('+12.50%');
    });

    it('should format negative percentage', () => {
      const formatted = formatPercentage(-5.75);
      expect(formatted).toBe('-5.75%');
    });

    it('should format zero', () => {
      const formatted = formatPercentage(0);
      expect(formatted).toBe('+0.00%');
    });
  });
});
