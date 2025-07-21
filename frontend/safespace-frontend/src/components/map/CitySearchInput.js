import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { getLocationFromIP } from '../../utils/api';

// Major Indian cities data
const indianCities = [
  { name: 'Delhi', state: 'Delhi', coordinates: [77.2090, 28.6139] },
  { name: 'Mumbai', state: 'Maharashtra', coordinates: [72.8777, 19.0760] },
  { name: 'Bangalore', state: 'Karnataka', coordinates: [77.5946, 12.9716] },
  { name: 'Chennai', state: 'Tamil Nadu', coordinates: [80.2707, 13.0827] },
  { name: 'Kolkata', state: 'West Bengal', coordinates: [88.3639, 22.5726] },
  { name: 'Hyderabad', state: 'Telangana', coordinates: [78.4867, 17.3850] },
  { name: 'Pune', state: 'Maharashtra', coordinates: [73.8567, 18.5204] },
  { name: 'Ahmedabad', state: 'Gujarat', coordinates: [72.5714, 23.0225] },
  { name: 'Jaipur', state: 'Rajasthan', coordinates: [75.7873, 26.9124] },
  { name: 'Surat', state: 'Gujarat', coordinates: [72.8311, 21.1702] },
  { name: 'Lucknow', state: 'Uttar Pradesh', coordinates: [80.9462, 26.8467] },
  { name: 'Kanpur', state: 'Uttar Pradesh', coordinates: [80.3319, 26.4499] },
  { name: 'Nagpur', state: 'Maharashtra', coordinates: [79.0882, 21.1458] },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', coordinates: [83.2185, 17.6868] },
  { name: 'Indore', state: 'Madhya Pradesh', coordinates: [75.8577, 22.7196] },
  { name: 'Thane', state: 'Maharashtra', coordinates: [72.9781, 19.2183] },
  { name: 'Bhopal', state: 'Madhya Pradesh', coordinates: [77.4126, 23.2599] },
  { name: 'Coimbatore', state: 'Tamil Nadu', coordinates: [76.9558, 11.0168] },
  { name: 'Vadodara', state: 'Gujarat', coordinates: [73.1812, 22.3072] },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', coordinates: [77.4538, 28.6692] },
];

const CitySearchInput = ({ onCitySelect, selectedCity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = indianCities.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
      setIsOpen(true);
    } else {
      setFilteredCities([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedCity) {
      setSearchTerm(selectedCity.city || selectedCity.name || '');
    }
  }, [selectedCity]);

  const handleCitySelect = (city) => {
    setSearchTerm(city.name);
    setIsOpen(false);
    onCitySelect?.({
      city: city.name,
      state: city.state,
      coordinates: city.coordinates,
    });
  };

  const detectUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getLocationFromIP();
      
      if (location.city) {
        // Find the closest match in our cities list
        const matchedCity = indianCities.find(city => 
          city.name.toLowerCase().includes(location.city.toLowerCase())
        );
        
        if (matchedCity) {
          handleCitySelect(matchedCity);
        } else {
          // Use the location from IP service
          handleCitySelect({
            name: location.city,
            state: location.region,
            coordinates: location.coordinates,
          });
        }
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const clearSelection = () => {
    setSearchTerm('');
    setIsOpen(false);
    onCitySelect?.(null);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a city..."
          className="block w-full pl-10 pr-16 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {/* Auto-detect location button */}
          <motion.button
            onClick={detectUserLocation}
            disabled={isLoadingLocation}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Detect my location"
          >
            {isLoadingLocation ? (
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin" />
            ) : (
              <GlobeAltIcon className="h-5 w-5" />
            )}
          </motion.button>
          
          {/* Clear button */}
          {searchTerm && (
            <motion.button
              onClick={clearSelection}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Clear selection"
            >
              ×
            </motion.button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && filteredCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredCities.map((city, index) => (
              <motion.button
                key={`${city.name}-${city.state}`}
                onClick={() => handleCitySelect(city)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
              >
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{city.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{city.state}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected city info */}
      {selectedCity && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-lg"
        >
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2" />
            <span className="text-sm text-primary-800 dark:text-primary-200">
              Showing threats for{' '}
              <span className="font-medium">
                {selectedCity.city || selectedCity.name}
                {selectedCity.state && `, ${selectedCity.state}`}
              </span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Quick suggestions */}
      {!searchTerm && !selectedCity && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Popular cities:</p>
          <div className="flex flex-wrap gap-2">
            {['Delhi', 'Mumbai', 'Bangalore', 'Chennai'].map((cityName) => {
              const city = indianCities.find(c => c.name === cityName);
              return (
                <motion.button
                  key={cityName}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cityName}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySearchInput;
