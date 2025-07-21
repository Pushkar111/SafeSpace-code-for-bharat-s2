import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ThreatHeatmap from '../components/map/ThreatHeatmap';
import ThreatFeed from '../components/threats/ThreatFeed';
import CitySearchInput from '../components/map/CitySearchInput';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MapIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const stats = [
    {
      title: 'Active Threats',
      value: '23',
      change: '+3 from yesterday',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'Cities Monitored',
      value: '150+',
      change: 'Across India',
      icon: MapIcon,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Safety Score',
      value: '87%',
      change: '+2% this week',
      icon: ShieldCheckIcon,
      color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Alerts Sent',
      value: '1.2K',
      change: 'Last 24 hours',
      icon: BellIcon,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar spacer to prevent content overlap */}
      <div className="h-20 sm:h-24 flex-shrink-0" />
      
      {/* Header */}
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SafeSpace Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Real-time threat intelligence and AI-powered safety recommendations for Indian cities
          </p>
        </motion.div>
      </div>
    </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
            whileHover={{ 
              y: -2, 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
              transition: { duration: 0.2 }
            }}
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.change}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* City Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6 sm:mb-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search for City Threats
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CitySearchInput
                onCitySelect={setSelectedCity}
                selectedCity={selectedCity}
              />
            </div>
            <div className="w-full">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search threats..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 order-2 lg:order-1"
          >
            <ThreatHeatmap
              onCitySelect={setSelectedCity}
              selectedCity={selectedCity}
            />
          </motion.div>

          {/* Quick Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-4 sm:space-y-6 order-1 lg:order-2"
          >
            {/* Current Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Data Feed</span>
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">Online</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Analysis</span>
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">Active</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alert System</span>
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">Operational</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="text-sm border-l-2 border-red-500 dark:border-red-400 pl-3">
                  <p className="text-gray-900 dark:text-white font-medium">New high-risk alert</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Delhi - Air pollution</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 minutes ago</p>
                </div>
                <div className="text-sm border-l-2 border-yellow-500 dark:border-yellow-400 pl-3">
                  <p className="text-gray-900 dark:text-white font-medium">Traffic disruption</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Mumbai - Highway blocked</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">15 minutes ago</p>
                </div>
                <div className="text-sm border-l-2 border-blue-500 dark:border-blue-400 pl-3">
                  <p className="text-gray-900 dark:text-white font-medium">Safety advisory</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Bangalore - Weather alert</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Threat Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <ThreatFeed
            selectedCity={selectedCity}
            searchFilter={searchFilter}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
