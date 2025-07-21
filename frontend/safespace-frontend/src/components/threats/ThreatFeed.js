import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon, ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import ThreatCard from './ThreatCard';
import ThreatModal from './ThreatModal';
import { getThreats, saveThreat, getSavedThreats } from '../../utils/api';
import toast from 'react-hot-toast';

const ThreatFeed = ({ selectedCity, searchFilter }) => {
  const [threats, setThreats] = useState([]);
  const [filteredThreats, setFilteredThreats] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedThreats, setSavedThreats] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Ref to track the latest request and prevent race conditions
  const loadingRef = useRef(false);
  const lastLocationRef = useRef(null);

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📋' },
    { value: 'crime', label: 'Crime', icon: '🚨' },
    { value: 'natural', label: 'Natural', icon: '🌊' },
    { value: 'traffic', label: 'Traffic', icon: '🚗' },
    { value: 'riot', label: 'Riots', icon: '👥' },
    { value: 'fire', label: 'Fire', icon: '🔥' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
  ];

  const riskLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'high', label: 'High Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'low', label: 'Low Risk' },
  ];

  const loadSavedThreats = useCallback(async () => {
    try {
      const response = await getSavedThreats();
      if (response.success && Array.isArray(response.data)) {
        setSavedThreats(new Set(response.data.map(t => t.id)));
      } else {
        setSavedThreats(new Set());
      }
    } catch (error) {
      console.error('Failed to load saved threats:', error);
      setSavedThreats(new Set());
      // Use localStorage as fallback
      try {
        const localSaved = localStorage.getItem('savedThreats');
        if (localSaved) {
          setSavedThreats(new Set(JSON.parse(localSaved)));
        }
      } catch (e) {
        console.error('Failed to parse local saved threats:', e);
      }
    }
  }, []);

const loadThreats = useCallback(async (page = 1, append = false) => {
  const location = selectedCity?.city || selectedCity?.name || 'Delhi';
  
  if (loadingRef.current) {
    console.log(`⏭️ Skipping request - already loading for: ${location} (page ${page})`);
    return;
  }
  
  if (page === 1 && !append && lastLocationRef.current === location && threats.length > 0) {
    console.log(`✅ Already have data for: ${location}`);
    return;
  }
  
  loadingRef.current = true;
  if (page === 1 && !append) {
    setIsLoading(true);
  } else {
    setIsLoadingMore(true);
  }
  
  try {
    console.log(`🔄 Loading threats for: ${location} (page ${page})`);
    
    const threatsResponse = await getThreats(location, page, 20);
    
    // Handle cancellation gracefully
    if (threatsResponse && (threatsResponse.isCanceled || threatsResponse.isTimeout)) {
      console.log('Request was canceled or timed out, skipping update');
      return;
    }
    
    let threatsData = [];
    let paginationData = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasMore: false
    };
    
    if (threatsResponse && threatsResponse.threats) {
      threatsData = threatsResponse.threats;
      paginationData = threatsResponse.pagination;
      console.log(`✅ Loaded ${threatsData.length} threats for ${location} (page ${page}/${paginationData.totalPages}, total: ${paginationData.total})`);
    } else if (Array.isArray(threatsResponse)) {
      threatsData = threatsResponse;
      console.log(`✅ Loaded ${threatsData.length} threats for ${location} (fallback format)`);
    } else if (threatsResponse && Array.isArray(threatsResponse.threats)) {
      threatsData = threatsResponse.threats;
    } else if (threatsResponse && Array.isArray(threatsResponse.data)) {
      threatsData = threatsResponse.data;
    }
    
    if (page === 1 || !append) {
      setThreats(threatsData);
      lastLocationRef.current = location;
    } else {
      setThreats(prevThreats => {
        const existingIds = new Set(prevThreats.map(t => t.id));
        const newThreats = threatsData.filter(t => !existingIds.has(t.id));
        return [...prevThreats, ...newThreats];
      });
    }
    
    setPagination(paginationData);
    
  } catch (error) {
    // Handle cancellation errors gracefully - don't show error to user
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      console.log('Request was canceled (timeout or component unmount)');
      return;
    }
    
    console.error('Failed to fetch threats:', error);
    toast.error('Failed to load threats');
    if (page === 1 || !append) {
      setThreats([]);
    }
  } finally {
    setIsLoading(false);
    setIsLoadingMore(false);
    loadingRef.current = false;
  }
}, [selectedCity, threats.length]);

  // Initial load effect
  useEffect(() => {
    loadSavedThreats();
  }, [loadSavedThreats]);

  // City change effect
  useEffect(() => {
    const location = selectedCity?.city || selectedCity?.name || 'Delhi';
    
    // Reset location tracking when city actually changes
    if (lastLocationRef.current !== location) {
      lastLocationRef.current = null; // Force reload for new location
      loadThreats();
    }
  }, [selectedCity, loadThreats]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      loadingRef.current = false;
      lastLocationRef.current = null;
    };
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      // Ensure threats is always an array
      if (!Array.isArray(threats)) {
        setFilteredThreats([]);
        return;
      }

      let filtered = [...threats];

      // Filter by category
      if (filterCategory !== 'all') {
        filtered = filtered.filter(threat => threat.category === filterCategory);
      }

      // Filter by level
      if (filterLevel !== 'all') {
        filtered = filtered.filter(threat => threat.level === filterLevel);
      }

      // Filter by city
      if (selectedCity) {
        filtered = filtered.filter(threat => 
          threat.location?.toLowerCase().includes(selectedCity.city?.toLowerCase() || selectedCity.name?.toLowerCase() || '')
        );
      }

      // Filter by search term
      if (searchFilter) {
        filtered = filtered.filter(threat =>
          threat.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
          threat.summary?.toLowerCase().includes(searchFilter.toLowerCase()) ||
          threat.location?.toLowerCase().includes(searchFilter.toLowerCase())
        );
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setFilteredThreats(filtered);
    };

    applyFilters();
  }, [threats, filterCategory, filterLevel, selectedCity, searchFilter]);

  const handleThreatClick = (threat) => {
    setSelectedThreat(threat);
    setIsModalOpen(true);
  };

  const handleSaveThreat = async (threat) => {
    try {
      if (savedThreats.has(threat.id)) {
        // Remove from saved (this would need a delete API)
        setSavedThreats(prev => {
          const newSet = new Set(prev);
          newSet.delete(threat.id);
          return newSet;
        });
        toast.success('Removed from saved threats');
        
        // Update localStorage
        const savedArray = Array.from(savedThreats);
        const index = savedArray.indexOf(threat.id);
        if (index > -1) {
          savedArray.splice(index, 1);
          localStorage.setItem('savedThreats', JSON.stringify(savedArray));
        }
      } else {
        // Add to saved - pass complete threat data
        await saveThreat(threat);
        setSavedThreats(prev => new Set([...prev, threat.id]));
        toast.success('Threat saved successfully');
        
        // Update localStorage
        const savedArray = Array.from(savedThreats);
        savedArray.push(threat.id);
        localStorage.setItem('savedThreats', JSON.stringify(savedArray));
      }
    } catch (error) {
      toast.error('Failed to save threat');
      console.error('Error saving threat:', error);
    }
  };

  const refreshThreats = async () => {
    try {
      // Reset location tracking to force refresh
      lastLocationRef.current = null;
      loadingRef.current = true;
      setIsLoading(true);
      
      const location = selectedCity?.city || selectedCity?.name || 'Delhi';
      console.log(`🔄 Refreshing threats for: ${location}`);
      
      const threatsResponse = await getThreats(location);
      
      // Handle different response structures
      let threatsData = [];
      if (Array.isArray(threatsResponse)) {
        threatsData = threatsResponse;
      } else if (threatsResponse && Array.isArray(threatsResponse.threats)) {
        threatsData = threatsResponse.threats;
      } else if (threatsResponse && Array.isArray(threatsResponse.data)) {
        threatsData = threatsResponse.data;
      }
      
      setThreats(threatsData);
      toast.success('Threats updated successfully');
      console.log(`✅ Refreshed ${threatsData.length} threats for ${location}`);
      lastLocationRef.current = location; // Update after successful refresh
    } catch (error) {
      // Handle cancellation errors gracefully
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Refresh request was canceled');
        return;
      }
      
      console.error('Failed to refresh threats:', error);
      toast.error('Failed to refresh threats');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Threat Intelligence Feed</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time safety alerts and AI-powered recommendations
            </p>
          </div>
          
          <motion.button
            onClick={refreshThreats}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Risk Level
            </label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {riskLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Threat count and load more */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {filteredThreats.length} of {pagination.total > 0 ? pagination.total : threats.length} threats
          {selectedCity && ` in ${selectedCity.city || selectedCity.name}`}
          {pagination.total > threats.length && (
            <span className="text-primary-600 dark:text-primary-400 ml-2">
              ({threats.length} loaded, {pagination.total - threats.length} more available)
            </span>
          )}
        </p>
        
        {/* Load More Button */}
        {pagination.hasMore && !isLoading && (
          <motion.button
            onClick={() => loadThreats(pagination.page + 1, true)}
            disabled={isLoadingMore}
            className="flex items-center space-x-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load More</span>
                <ChevronDownIcon className="h-4 w-4" />
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && threats.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading threats...</p>
          </div>
        </div>
      )}

      {/* Threat cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredThreats.map((threat, index) => (
            <ThreatCard
              key={threat.id}
              threat={threat}
              index={index}
              onClick={handleThreatClick}
              onSave={handleSaveThreat}
              isSaved={savedThreats.has(threat.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {!isLoading && filteredThreats.length === 0 && threats.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No threats found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or check back later for updates.
          </p>
        </motion.div>
      )}

      {/* No data state */}
      {!isLoading && threats.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📡</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No threat data available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to fetch threat data at the moment. Please try again later.
          </p>
        </motion.div>
      )}

      {/* Threat details modal */}
      <ThreatModal
        threat={selectedThreat}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveThreat}
        isSaved={selectedThreat ? savedThreats.has(selectedThreat.id) : false}
      />
    </div>
  );
};

export default ThreatFeed;
