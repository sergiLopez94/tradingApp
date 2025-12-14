import { Link } from 'react-router-dom';
import { ChartBarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col h-20">
          <div className="flex items-center px-0 h-12">
            <h1 className="text-3xl font-bold text-green-600">TradeApp</h1>
          </div>
          <nav className="flex justify-between items-center flex-1">
            <Link
              to="/"
              className="flex items-center px-6 py-3 bg-gray-100 hover:bg-green-600 text-gray-900 hover:text-white font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChartBarIcon className="w-6 h-6 mr-2" />
              <span className="text-base">Portfolio</span>
            </Link>
            <Link
              to="/history"
              className="flex items-center px-6 py-3 bg-gray-100 hover:bg-green-600 text-gray-900 hover:text-white font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ClockIcon className="w-6 h-6 mr-2" />
              <span className="text-base">History</span>
            </Link>
            <Link
              to="/client"
              className="flex items-center px-6 py-3 bg-gray-100 hover:bg-green-600 text-gray-900 hover:text-white font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <UserIcon className="w-6 h-6 mr-2" />
              <span className="text-base">Profile</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;