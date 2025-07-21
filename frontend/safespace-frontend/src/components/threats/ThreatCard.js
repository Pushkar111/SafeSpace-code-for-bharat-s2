import React from "react";
import { motion } from "framer-motion";
import { MapPinIcon, ClockIcon, ExclamationTriangleIcon, InformationCircleIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

const ThreatCard = ({ threat, onClick, onSave, isSaved = false, isRemoving = false, index = 0 }) => {
    const getThreatLevelColor = (level) => {
        switch (level) {
            case "high":
                return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700";
            case "medium":
                return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
            case "low":
                return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600";
        }
    };

    const getThreatIcon = (category) => {
        switch (category) {
            case "crime":
                return "🚨";
            case "natural":
                return "🌊";
            case "traffic":
                return "🚗";
            case "riot":
                return "👥";
            case "fire":
                return "🔥";
            case "medical":
                return "🏥";
            default:
                return "⚠️";
        }
    };

    const formatTimeAgo = (timestamp) => {
        // Handle both saved threats (timeAgo) and live threats (timestamp)
        if (threat.timeAgo) {
            return threat.timeAgo;
        }
        
        const now = new Date();
        const threatTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - threatTime) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    // Helper to get the right timestamp field
    const getTimestamp = () => {
        return threat.originalTimestamp || threat.timestamp || threat.savedAt;
    };

    // Helper to get the right description field
    const getDescription = () => {
        return threat.description || threat.summary || "";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden group"
            onClick={() => onClick?.(threat)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}>
            {/* Header with threat level indicator */}
            <div className="p-4 pb-0">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getThreatIcon(threat.category)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getThreatLevelColor(threat.level)}`}>
                            {threat.level ? threat.level.charAt(0).toUpperCase() + threat.level.slice(1) + " Risk" : "Unknown Risk"}
                        </span>
                    </div>

                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isRemoving) {
                                onSave?.(threat);
                            }
                        }}
                        className={`p-1 rounded-full transition-colors ${
                            isRemoving 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                        }`}
                        whileHover={isRemoving ? {} : { scale: 1.1 }}
                        whileTap={isRemoving ? {} : { scale: 0.9 }}
                        disabled={isRemoving}
                        title={
                            isRemoving 
                                ? 'Removing...' 
                                : isSaved 
                                    ? 'Remove from saved threats' 
                                    : 'Save threat'
                        }
                    >
                        {isRemoving ? (
                            <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 border-t-yellow-500 dark:border-t-yellow-400 rounded-full animate-spin" />
                        ) : isSaved ? (
                            <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        ) : (
                            <StarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-yellow-500" />
                        )}
                    </motion.button>
                </div>

                {/* Title */}
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{threat.title}</h4>

                {/* Location and time */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{threat.location || "Unknown Location"}</span>
                    </div>
                    <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{formatTimeAgo(getTimestamp())}</span>
                    </div>
                </div>

                {/* Summary */}
                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">{getDescription() || "No description available"}</p>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        <span>{threat.affectedPeople || 0} people affected</span>
                    </div>

                    <motion.div className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300" whileHover={{ x: 2 }}>
                        <InformationCircleIcon className="h-4 w-4 mr-1" />
                        <span>View AI Advice</span>
                    </motion.div>
                </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-primary-600 dark:bg-primary-500 opacity-0 group-hover:opacity-5 transition-opacity duration-200 pointer-events-none" />
        </motion.div>
    );
};

export default ThreatCard;
