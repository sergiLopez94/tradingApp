import { useState, useEffect } from 'react';

interface Transaction {
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

interface Asset {
  name: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  isin: string;
  ticker: string;
  assetType: string;
  currentPrice?: number;
  currentTotalValue?: number;
  priceChange?: number;
  percentChange?: number;
}

const Portfolio = () => {
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [currentPortfolioValue, setCurrentPortfolioValue] = useState(0);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'totalValue', direction: 'desc' });

  useEffect(() => {
    const clientId = localStorage.getItem('clientId') || '1';
    fetch(`http://localhost:8080/api/transactions/${clientId}`)
      .then(res => res.json())
      .then((transactions: Transaction[]) => {
        const assetMap = new Map<string, { quantity: number; unitPrice: number; totalValue: number; isin: string; ticker: string; assetType: string }>();
        transactions.forEach(tx => {
          const existing = assetMap.get(tx.asset) || { quantity: 0, unitPrice: tx.unitPrice, totalValue: 0, isin: tx.isin, ticker: tx.ticker, assetType: tx.assetType };
          existing.quantity += tx.quantity;
          existing.totalValue += tx.totalValue;
          assetMap.set(tx.asset, existing);
        });
        const assetList: Asset[] = Array.from(assetMap.entries()).map(([name, data]) => ({
          name,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalValue: data.totalValue,
          isin: data.isin || '',
          ticker: data.ticker || '',
          assetType: data.assetType || 'Security',
        }));
        setAssets(assetList);
        setPortfolioValue(assetList.reduce((sum, asset) => sum + asset.totalValue, 0));
        
        // Fetch real-time prices for each asset using ISIN
        fetchCurrentPrices(assetList);
      })
      .catch(console.error);
  }, []);

  const getUniqueAssetTypes = (): string[] => {
    const types = new Set(assets.map(asset => asset.assetType));
    return ['All', ...Array.from(types).sort()];
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedAssets = (): Asset[] => {
    let filtered = filterType === 'All' 
      ? assets 
      : assets.filter(asset => asset.assetType === filterType);
    
    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Asset] || 0;
      const bValue = b[sortConfig.key as keyof Asset] || 0;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      return sortConfig.direction === 'desc' 
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });
  };

  const fetchCurrentPrices = async (assetList: Asset[]) => {
    setIsLoadingPrices(true);
    try {
      // Get API key from environment variable
      const MARKETSTACK_API_KEY = import.meta.env.VITE_MARKETSTACK_API_KEY;
      
      if (!MARKETSTACK_API_KEY) {
        console.error('Marketstack API key not configured. Please set VITE_MARKETSTACK_API_KEY in .env.local');
        setIsLoadingPrices(false);
        return;
      }
      
      // Build comma-separated list of all tickers for single API call
      const tickers = assetList
        .filter(asset => asset.ticker && asset.ticker.trim() !== '')
        .map(asset => asset.ticker.trim())
        .join(',');
      
      if (!tickers) {
        console.warn('No tickers found for any assets');
        setIsLoadingPrices(false);
        return;
      }
      
      console.log(`Fetching prices for tickers: ${tickers}`);
      
      // Single API call for all symbols (Marketstack supports comma-separated symbols)
      const response = await fetch(
        `https://api.marketstack.com/v1/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${tickers}`
      );
      
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        setIsLoadingPrices(false);
        return;
      }
      
      const data = await response.json();
      console.log('Marketstack response:', data);
      
      // Create a map of ticker -> price data
      const priceMap = new Map<string, any>();
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          if (item.symbol) {
            priceMap.set(item.symbol, item);
          }
        });
      }
      
      // Update assets with current prices
      const updatedAssets = assetList.map(asset => {
        const priceData = priceMap.get(asset.ticker);
        
        if (priceData && priceData.close && priceData.close > 0) {
          const currentPrice = priceData.close;
          const currentTotalValue = asset.quantity * currentPrice;
          const priceChange = currentPrice - asset.unitPrice;
          const percentChange = (priceChange / asset.unitPrice) * 100;
          
          console.log(`✓ ${asset.name} (${asset.ticker}): €${currentPrice}`);
          
          return {
            ...asset,
            currentPrice,
            currentTotalValue,
            priceChange,
            percentChange,
          };
        } else {
          console.warn(`No price data for ${asset.ticker}`);
          return asset;
        }
      });
      
      setAssets(updatedAssets);
      const newTotalValue = updatedAssets.reduce(
        (sum, asset) => sum + (asset.currentTotalValue || asset.totalValue),
        0
      );
      setCurrentPortfolioValue(newTotalValue);
    } catch (error) {
      console.error('Failed to fetch real-time prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Overview</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cost Basis */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <p className="text-sm font-medium opacity-90">Cost Basis</p>
              <p className="text-4xl font-bold mt-2">${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs mt-2 opacity-75">Original investment value</p>
            </div>
            
            {/* Current Value */}
            <div className={`rounded-lg shadow-sm p-6 text-white bg-gradient-to-r ${
              currentPortfolioValue >= portfolioValue 
                ? 'from-green-500 to-green-600' 
                : 'from-red-500 to-red-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Current Value</p>
                  <p className="text-4xl font-bold mt-2">${currentPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                {isLoadingPrices && (
                  <div className="text-right">
                    <p className="text-xs opacity-75">Updating...</p>
                  </div>
                )}
              </div>
              {portfolioValue > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold">
                    {currentPortfolioValue >= portfolioValue ? '+' : ''}{((currentPortfolioValue - portfolioValue) / portfolioValue * 100).toFixed(2)}%
                  </p>
                  <p className="text-xs opacity-75">
                    ${(currentPortfolioValue - portfolioValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {assets.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {getUniqueAssetTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Security {sortConfig.key === 'name' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ISIN
                    </th>
                    <th 
                      onClick={() => handleSort('ticker')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Symbol {sortConfig.key === 'ticker' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      onClick={() => handleSort('assetType')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Type {sortConfig.key === 'assetType' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      onClick={() => handleSort('quantity')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Quantity {sortConfig.key === 'quantity' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      onClick={() => handleSort('unitPrice')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Cost Price {sortConfig.key === 'unitPrice' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      onClick={() => handleSort('currentPrice')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Current Price {sortConfig.key === 'currentPrice' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      onClick={() => handleSort('currentTotalValue')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Current Value {sortConfig.key === 'currentTotalValue' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                    <th 
                      onClick={() => handleSort('percentChange')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Change {sortConfig.key === 'percentChange' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredAndSortedAssets().map((asset, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {asset.isin || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {asset.ticker || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {asset.assetType || 'Security'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        {asset.quantity.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        ${asset.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {asset.currentPrice ? (
                          <span className="font-semibold text-blue-600">
                            ${asset.currentPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                        {asset.currentTotalValue ? (
                          <span className={asset.currentTotalValue >= asset.totalValue ? 'text-green-600' : 'text-red-600'}>
                            ${asset.currentTotalValue.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {asset.percentChange !== undefined ? (
                          <span className={asset.percentChange >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                            {asset.percentChange >= 0 ? '+' : ''}{asset.percentChange.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets in portfolio</h3>
              <p className="text-gray-500">Upload transaction data in the Profile section to populate your portfolio.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;