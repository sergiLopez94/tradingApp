import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface Transaction {
  clientId: string;
  transactionId: string;
  date: string;
  asset: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

const History = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const clientId = localStorage.getItem('clientId') || '1';
    fetch(`http://localhost:8080/api/transactions/${clientId}`)
      .then(res => res.json())
      .then(setTransactions)
      .catch(console.error);
  }, []);

  const handleSort = (field: keyof Transaction) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: keyof Transaction }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpIcon className="w-4 h-4 inline ml-1" /> : <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">View all your investment transactions with detailed information</p>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'date', label: 'Date' },
                      { key: 'asset', label: 'Asset' },
                      { key: 'quantity', label: 'Quantity' },
                      { key: 'unitPrice', label: 'Unit Price' },
                      { key: 'totalValue', label: 'Total Value' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort(key as keyof Transaction)}
                      >
                        <div className="flex items-center justify-between group">
                          <span>{label}</span>
                          <SortIcon field={key as keyof Transaction} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedTransactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tx.asset}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        {tx.quantity.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        ${tx.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                        ${tx.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600">Upload your transaction data in the Profile section to see your history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;