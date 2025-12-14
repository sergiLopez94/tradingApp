import { useState, useEffect } from 'react';

interface Transaction {
  clientId: string;
  transactionId: string;
  date: string;
  asset: string;
  isin: string;
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
  assetType: string;
}

const Portfolio = () => {
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const clientId = localStorage.getItem('clientId') || '1';
    fetch(`http://localhost:8080/api/transactions/${clientId}`)
      .then(res => res.json())
      .then((transactions: Transaction[]) => {
        const assetMap = new Map<string, { quantity: number; unitPrice: number; totalValue: number }>();
        transactions.forEach(tx => {
          const existing = assetMap.get(tx.asset) || { quantity: 0, unitPrice: tx.unitPrice, totalValue: 0 };
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
          assetType: data.assetType || 'Security',
        }));
        setAssets(assetList);
        setPortfolioValue(assetList.reduce((sum, asset) => sum + asset.totalValue, 0));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Overview</h1>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <p className="text-sm font-medium opacity-90">Total Portfolio Value</p>
            <p className="text-4xl font-bold mt-2">${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Security
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ISIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Portfolio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assets.map((asset, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {asset.isin || '-'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                        ${asset.totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        {portfolioValue > 0 ? ((asset.totalValue / portfolioValue) * 100).toFixed(1) : 0}%
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