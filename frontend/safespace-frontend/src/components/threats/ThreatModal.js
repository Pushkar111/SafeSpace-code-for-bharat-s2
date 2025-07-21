import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ShareIcon,
  LightBulbIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { generateSafetyAdvice } from '../../utils/api';
import toast from 'react-hot-toast';

const ThreatModal = ({ threat, isOpen, onClose, onSave, isSaved = false }) => {
  const [aiAdvice, setAiAdvice] = useState([]);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState(null);

  // Fetch AI advice when modal opens or threat changes
  const fetchAIAdvice = useCallback(async () => {
    if (!threat || !threat.title) return;
    
    try {
      setIsLoadingAdvice(true);
      setAdviceError(null);
      
      console.log('🤖 Fetching AI advice for:', threat.title);
      
      const response = await generateSafetyAdvice(
        threat.title,
        threat.description || threat.summary || "",
        true, // useAI
        threat.location
      );

      if (response.success && response.advice && response.advice.safety_advice) {
        setAiAdvice(response.advice.safety_advice);
        console.log('✅ AI advice received:', response.advice.safety_advice);
      } else {
        console.warn('⚠️ No AI advice in response:', response);
        // Fallback to existing advice if available
        setAiAdvice(threat.aiAdvice || []);
      }
    } catch (error) {
      console.error('❌ Error fetching AI advice:', error);
      setAdviceError('Unable to generate AI recommendations');
      // Fallback to existing advice if available
      setAiAdvice(threat.aiAdvice || []);
      toast.error('Failed to generate AI recommendations');
    } finally {
      setIsLoadingAdvice(false);
    }
  }, [threat]);

  useEffect(() => {
    if (isOpen && threat && threat.title) {
      fetchAIAdvice();
    }
  }, [isOpen, threat, fetchAIAdvice]);

  if (!threat) return null;

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800/50';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800/50';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/50';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getThreatIcon = (category) => {
    switch (category) {
      case 'crime':
        return '🚨';
      case 'natural':
        return '🌊';
      case 'traffic':
        return '🚗';
      case 'riot':
        return '👥';
      case 'fire':
        return '🔥';
      case 'medical':
        return '🏥';
      default:
        return '⚠️';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const threatTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - threatTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: threat.title,
        text: threat.summary,
        url: window.location.href,
      });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(
        `${threat.title}\n\n${threat.summary}\n\nStay safe with SafeSpace`
      );
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onSave?.(threat);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          open={isOpen}
          onClose={onClose}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm dark:bg-black/50"
          />

          {/* Modal */}
          <div className="fixed inset-0 overflow-y-auto p-2 sm:p-4">
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
              >
                {/* Header */}
                <div className="relative p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl lg:text-3xl flex-shrink-0">{getThreatIcon(threat.category)}</span>
                      <div className="min-w-0">
                        <span
                          className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getThreatLevelColor(
                            threat.level
                          )}`}
                        >
                          {threat.level.charAt(0).toUpperCase() + threat.level.slice(1)} Risk
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <motion.button
                        onClick={handleSave}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-touch min-h-touch flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isSaved ? (
                          <StarIconSolid className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={handleShare}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-touch min-h-touch flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ShareIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                      </motion.button>
                      
                      <motion.button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-touch min-h-touch flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                      </motion.button>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-3 sm:mt-4 pr-4">
                    {threat.title}
                  </h2>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center min-w-0">
                      <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{threat.location}</span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span>{formatTimeAgo(threat.timestamp)}</span>
                    </div>
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span>{threat.affectedPeople || 0} people affected</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 scroll-container">
                  {/* Threat Summary */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">Threat Details</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{threat.summary}</p>
                  </div>

                  {/* AI-Generated Safety Advice */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800/50"
                  >
                    <div className="flex items-center mb-2 sm:mb-3">
                      <LightBulbIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                      <h4 className="text-sm sm:text-lg font-semibold text-blue-900 dark:text-blue-100 min-w-0">
                        AI-Powered Safety Recommendations
                      </h4>
                      {isLoadingAdvice && (
                        <div className="ml-auto flex-shrink-0">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-300 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {isLoadingAdvice ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center">
                            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 mr-3 flex-shrink-0 animate-pulse"></div>
                            <div className={`h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse ${i === 1 ? 'w-3/4' : i === 2 ? 'w-2/3' : 'w-3/5'}`}></div>
                          </div>
                        ))}
                      </div>
                    ) : adviceError ? (
                      <div className="text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center flex-wrap">
                        <ExclamationTriangleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        <span className="flex-1 min-w-0">{adviceError}</span>
                        <button 
                          onClick={fetchAIAdvice}
                          className="ml-2 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0 min-h-touch"
                        >
                          Retry
                        </button>
                      </div>
                    ) : aiAdvice && aiAdvice.length > 0 ? (
                      <div className="space-y-2">
                        {aiAdvice.map((advice, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="flex items-start"
                          >
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm leading-relaxed">{advice}</p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm flex items-center flex-wrap">
                        <LightBulbIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        <span className="flex-1 min-w-0">No AI recommendations available for this threat.</span>
                        <button 
                          onClick={fetchAIAdvice}
                          className="ml-2 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0 min-h-touch"
                        >
                          Generate AI Advice
                        </button>
                      </div>
                    )}
                  </motion.div>

                  {/* Mini Trend Chart Placeholder */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center mb-2 sm:mb-3">
                      <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400 mr-2 flex-shrink-0" />
                      <h4 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">7-Day Trend</h4>
                    </div>
                    
                    <div className="h-16 sm:h-20 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-green-900/20 rounded flex items-end justify-center space-x-1 p-2">
                      {[3, 5, 4, 7, 6, 4, 2].map((height, index) => (
                        <motion.div
                          key={index}
                          initial={{ height: 0 }}
                          animate={{ height: `${height * 6}px` }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="bg-primary-600 dark:bg-primary-500 rounded-t w-3 sm:w-4"
                        />
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      Threat activity over the past week
                    </p>
                  </motion.div>

                  {/* Emergency Contacts */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 border border-red-200 dark:border-red-800/50">
                    <h4 className="text-sm sm:text-lg font-semibold text-red-900 dark:text-red-200 mb-2 sm:mb-3">Emergency Contacts</h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="space-y-1">
                        <p className="text-red-800 dark:text-red-300 font-medium">Police: 100</p>
                        <p className="text-red-800 dark:text-red-300 font-medium">Fire: 101</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-red-800 dark:text-red-300 font-medium">Ambulance: 102</p>
                        <p className="text-red-800 dark:text-red-300 font-medium">Disaster: 108</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Powered by SafeSpace AI</span>
                    <span className="hidden sm:inline">Last updated: {new Date().toLocaleTimeString()}</span>
                    <span className="sm:hidden">Updated: {new Date().toLocaleTimeString([], { timeStyle: 'short' })}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ThreatModal;
