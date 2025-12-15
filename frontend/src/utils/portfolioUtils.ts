/**
 * Portfolio calculation utilities
 * REQ-005: Calculate portfolio value and aggregate assets
 */

export interface Asset {
  name: string;
  isin: string;
  ticker: string;
  assetType: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  currentPrice?: number;
  currentTotalValue?: number;
  priceChange?: number;
  percentChange?: number;
}

export interface Transaction {
  id?: number;
  clientId: string;
  transactionId: string;
  date: string;
  asset: string;
  isin: string;
  ticker: string;
  assetType: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

/**
 * Aggregate transactions into unique assets with total quantities
 * REQ-005: Group transactions by asset
 */
export function aggregateAssets(transactions: Transaction[]): Asset[] {
  const assetMap = new Map<string, Asset>();

  for (const transaction of transactions) {
    const key = transaction.isin || transaction.asset;
    
    if (assetMap.has(key)) {
      const existing = assetMap.get(key)!;
      const totalQuantity = existing.quantity + transaction.quantity;
      const totalCost = (existing.quantity * existing.unitPrice) + 
                       (transaction.quantity * transaction.unitPrice);
      const avgPrice = totalCost / totalQuantity;

      assetMap.set(key, {
        ...existing,
        quantity: totalQuantity,
        unitPrice: avgPrice,
        totalValue: totalCost,
      });
    } else {
      assetMap.set(key, {
        name: transaction.asset,
        isin: transaction.isin,
        ticker: transaction.ticker,
        assetType: transaction.assetType,
        quantity: transaction.quantity,
        unitPrice: transaction.unitPrice,
        totalValue: transaction.totalValue,
      });
    }
  }

  return Array.from(assetMap.values());
}

/**
 * Calculate total portfolio value (cost basis)
 * REQ-005: Sum all asset values
 */
export function calculatePortfolioValue(assets: Asset[]): number {
  return assets.reduce((total, asset) => total + asset.totalValue, 0);
}

/**
 * Calculate current portfolio value based on market prices
 * REQ-005: Calculate current value with real-time prices
 */
export function calculateCurrentPortfolioValue(assets: Asset[]): number {
  return assets.reduce((total, asset) => {
    if (asset.currentPrice && asset.currentPrice > 0) {
      return total + (asset.quantity * asset.currentPrice);
    }
    return total + asset.totalValue;
  }, 0);
}

/**
 * Calculate profit/loss for portfolio
 * REQ-005: Calculate performance metrics
 */
export function calculatePortfolioProfitLoss(
  costBasis: number,
  currentValue: number
): { amount: number; percentage: number } {
  const amount = currentValue - costBasis;
  const percentage = costBasis > 0 ? (amount / costBasis) * 100 : 0;
  
  return { amount, percentage };
}

/**
 * Update assets with current market prices
 * REQ-005: Enrich assets with real-time pricing data
 */
export function updateAssetsWithPrices(
  assets: Asset[],
  priceData: Record<string, number>
): Asset[] {
  return assets.map(asset => {
    const currentPrice = priceData[asset.ticker];
    
    if (currentPrice && currentPrice > 0) {
      const currentTotalValue = asset.quantity * currentPrice;
      const priceChange = currentPrice - asset.unitPrice;
      const percentChange = (priceChange / asset.unitPrice) * 100;

      return {
        ...asset,
        currentPrice,
        currentTotalValue,
        priceChange,
        percentChange,
      };
    }
    
    return asset;
  });
}

/**
 * Filter assets by type
 * REQ-017: Support asset type filtering
 */
export function filterAssetsByType(assets: Asset[], type: string): Asset[] {
  if (type === 'All' || !type) {
    return assets;
  }
  return assets.filter(asset => asset.assetType === type);
}

/**
 * Get unique asset types from assets list
 * REQ-017: Extract available filter options
 */
export function getUniqueAssetTypes(assets: Asset[]): string[] {
  const types = new Set<string>(['All']);
  assets.forEach(asset => {
    if (asset.assetType) {
      types.add(asset.assetType);
    }
  });
  return Array.from(types);
}

/**
 * Sort assets by a specific field
 * REQ-017: Support column sorting
 */
export function sortAssets(
  assets: Asset[],
  sortKey: keyof Asset,
  direction: 'asc' | 'desc'
): Asset[] {
  return [...assets].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue === undefined || bValue === undefined) {
      return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
