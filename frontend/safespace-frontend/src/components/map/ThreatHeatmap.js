import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import { ArrowPathIcon, MapIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { getLocationFromIP, getThreatHeatmap } from "../../utils/api";
import toast from "react-hot-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ThreatHeatmap.css";

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom India-focused map styles
const mapStyles = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
};

const mapZoomLimits = {
    light: { min: 4, max: 18 },
    dark: { min: 4, max: 18 },
    satellite: { min: 4, max: 15 }, // Lower max zoom for satellite to prevent crashes
    terrain: { min: 4, max: 16 },
};

// India geographical bounds for better map focus
const INDIA_BOUNDS = [
    [6.4627, 68.1097], // Southwest corner
    [37.6, 97.4], // Northeast corner
];

// Major Indian cities with enhanced data
const MAJOR_INDIAN_CITIES = {
    Delhi: { coords: [28.6139, 77.209], state: "Delhi", region: "North" },
    Mumbai: { coords: [19.076, 72.8777], state: "Maharashtra", region: "West" },
    Bangalore: { coords: [12.9716, 77.5946], state: "Karnataka", region: "South" },
    Kolkata: { coords: [22.5726, 88.3639], state: "West Bengal", region: "East" },
    Chennai: { coords: [13.0827, 80.2707], state: "Tamil Nadu", region: "South" },
    Hyderabad: { coords: [17.385, 78.4867], state: "Telangana", region: "South" },
    Pune: { coords: [18.5204, 73.8567], state: "Maharashtra", region: "West" },
    Ahmedabad: { coords: [23.0225, 72.5714], state: "Gujarat", region: "West" },
    Jaipur: { coords: [26.9124, 75.7873], state: "Rajasthan", region: "North" },
    Surat: { coords: [21.1702, 72.8311], state: "Gujarat", region: "West" },
    Lucknow: { coords: [26.8467, 80.9462], state: "Uttar Pradesh", region: "North" },
    Kanpur: { coords: [26.4499, 80.3319], state: "Uttar Pradesh", region: "North" },
    Nagpur: { coords: [21.1458, 79.0882], state: "Maharashtra", region: "Central" },
    Indore: { coords: [22.7196, 75.8577], state: "Madhya Pradesh", region: "Central" },
    Bhopal: { coords: [23.2599, 77.4126], state: "Madhya Pradesh", region: "Central" },
    Visakhapatnam: { coords: [17.6868, 83.2185], state: "Andhra Pradesh", region: "South" },
    Patna: { coords: [25.5941, 85.1376], state: "Bihar", region: "East" },
    Vadodara: { coords: [22.3072, 73.1812], state: "Gujarat", region: "West" },
    Ghaziabad: { coords: [28.6692, 77.4538], state: "Uttar Pradesh", region: "North" },
    Ludhiana: { coords: [30.901, 75.8573], state: "Punjab", region: "North" },
};

// Custom threat level icons with improved hover stability
const createThreatIcon = (level, size = "medium") => {
    const colors = {
        high: "#DC2626",
        medium: "#F59E0B",
        low: "#10B981",
    };

    const sizes = {
        small: 20,
        medium: 30,
        large: 40,
    };

    const iconSize = sizes[size];

    return L.divIcon({
        html: `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        background: ${colors[level]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${iconSize / 3}px;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
        transform-origin: center center;
      " 
      onmouseover="this.style.transform='scale(1.1)'"
      onmouseout="this.style.transform='scale(1)'">
        ⚠
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: white;
          color: ${colors[level]};
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid ${colors[level]};
          pointer-events: none;
        ">
          !
        </div>
      </div>
    `,
        className: "custom-threat-marker",
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2], // Center the icon properly
        popupAnchor: [0, -iconSize / 2],
    });
};

// Safe component to re-enable map controls after proper initialization
const SafeControlsEnabler = () => {
    const map = useMap();

    useEffect(() => {
        const enableControls = async () => {
            try {
                // Wait for complete initialization
                await new Promise((resolve) => setTimeout(resolve, 1000));

                if (map && typeof map.getContainer === "function") {
                    const container = map.getContainer();
                    const panes = map.getPanes();

                    // Only enable controls if DOM is fully ready
                    if (container && panes && panes.mapPane && panes.mapPane._leaflet_pos !== undefined) {
                        // Safely re-enable controls
                        if (typeof map.attributionControl !== "undefined") {
                            map.attributionControl.addTo(map);
                        }

                        if (typeof map.doubleClickZoom !== "undefined") {
                            map.doubleClickZoom.enable();
                        }

                        if (typeof map.keyboard !== "undefined") {
                            map.keyboard.enable();
                        }

                        console.log("✅ Map controls safely enabled");
                    }
                }
            } catch (error) {
                console.warn("Could not enable some map controls:", error);
            }
        };

        enableControls();
    }, [map]);

    return null;
};

// Enhanced Map bounds controller with robust DOM validation
const MapBoundsController = ({ threats }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !threats || threats.length === 0) return;

        const handleMapBounds = async () => {
            try {
                // Extended wait for complete DOM initialization
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Comprehensive map state validation
                if (map && typeof map.getContainer === "function") {
                    const container = map.getContainer();

                    // Validate container exists and has dimensions
                    if (container && container.offsetWidth > 0 && container.offsetHeight > 0 && typeof map.getPanes === "function") {
                        const panes = map.getPanes();

                        // Ensure all required panes exist and have _leaflet_pos
                        if (panes && panes.mapPane && panes.mapPane._leaflet_pos !== undefined && typeof map.fitBounds === "function") {
                            // Force map size recalculation before bounds operation
                            map.invalidateSize({ animate: false });

                            // Small delay after invalidateSize
                            await new Promise((resolve) => setTimeout(resolve, 100));

                            // Safe bounds operation with error catching
                            map.fitBounds(INDIA_BOUNDS, {
                                padding: [30, 30],
                                maxZoom: 6,
                                animate: false,
                                duration: 0,
                            });

                            console.log("✅ Map bounds set successfully");
                        } else {
                            console.warn("Map panes not fully initialized, using fallback view");
                            map.setView([20.5937, 78.9629], 5);
                        }
                    } else {
                        console.warn("Map container not ready, using fallback view");
                        map.setView([20.5937, 78.9629], 5);
                    }
                }
            } catch (error) {
                console.warn("Map bounds adjustment failed:", error);
                // Safe fallback with error handling
                try {
                    if (map && typeof map.setView === "function") {
                        map.setView([20.5937, 78.9629], 5);
                    }
                } catch (fallbackError) {
                    console.warn("Fallback map view failed:", fallbackError);
                }
            }
        };

        // Delay initial execution to ensure DOM is ready
        const timeoutId = setTimeout(handleMapBounds, 100);

        return () => clearTimeout(timeoutId);
    }, [map, threats]);

    return null;
};

const ThreatHeatmap = ({ onCitySelect, selectedCity }) => {
    const [threats, setThreats] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [mapStyle, setMapStyle] = useState("light");
    const [showHeatCircles, setShowHeatCircles] = useState(true);
    const [selectedThreatLevel, setSelectedThreatLevel] = useState("all");
    const mapRef = useRef(null);

    // Enhanced threat data refresh with better error handling
    const refreshThreatData = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log("🗺️ Fetching real-time heatmap data...");

            // Fetch real-time heatmap data from FastAPI
            const heatmapResponse = await getThreatHeatmap();

            if (heatmapResponse.success && heatmapResponse.data && Array.isArray(heatmapResponse.data)) {
                // Enhance data with geographic information
                const enhancedData = heatmapResponse.data.map((threat) => ({
                    ...threat,
                    // Ensure proper coordinates format [lat, lng]
                    coordinates: threat.coordinates ? [threat.coordinates[1], threat.coordinates[0]] : [20, 77],
                    // Add geographic context
                    cityInfo: MAJOR_INDIAN_CITIES[threat.city] || {
                        coords: [20, 77],
                        state: "Unknown",
                        region: "Unknown",
                    },
                    // Ensure threat counts are valid
                    threatCount: threat.threatCount || threat.highRiskCount + threat.mediumRiskCount + threat.lowRiskCount || 0,
                    highRiskCount: threat.highRiskCount || 0,
                    mediumRiskCount: threat.mediumRiskCount || 0,
                    lowRiskCount: threat.lowRiskCount || 0,
                    recentThreats: threat.recentThreats || [],
                }));

                setThreats(enhancedData);
                setLastUpdated(new Date().toISOString());

                if (!heatmapResponse.isFallback) {
                    console.log(`✅ Loaded real-time heatmap data for ${heatmapResponse.totalCities} cities`);
                    toast.success(`🇮🇳 Updated threat data for ${heatmapResponse.totalCities} Indian cities`, {
                        duration: 4000,
                        icon: "🗺️",
                    });
                } else {
                    console.log("📋 Using enhanced fallback heatmap data");
                    toast("📊 Using demo data - API connection limited", {
                        duration: 3000,
                        icon: "⚡",
                    });
                }
            } else {
                throw new Error("No valid heatmap data received");
            }
        } catch (error) {
            console.error("Failed to refresh heatmap data:", error);
            toast.error("🔄 Using demo data - API connection failed");

            // Enhanced fallback data with proper coordinates [lat, lng]
            const enhancedFallbackData = [
                {
                    id: 1,
                    city: "Delhi",
                    coordinates: [28.6139, 77.209],
                    threatLevel: "high",
                    threatCount: 15,
                    recentThreats: ["Air pollution alert", "Traffic congestion", "Construction hazard"],
                    highRiskCount: 5,
                    mediumRiskCount: 7,
                    lowRiskCount: 3,
                    cityInfo: MAJOR_INDIAN_CITIES["Delhi"],
                },
                {
                    id: 2,
                    city: "Mumbai",
                    coordinates: [19.076, 72.8777],
                    threatLevel: "medium",
                    threatCount: 8,
                    recentThreats: ["Heavy rainfall warning", "Local flooding"],
                    highRiskCount: 2,
                    mediumRiskCount: 4,
                    lowRiskCount: 2,
                    cityInfo: MAJOR_INDIAN_CITIES["Mumbai"],
                },
                {
                    id: 3,
                    city: "Bangalore",
                    coordinates: [12.9716, 77.5946],
                    threatLevel: "low",
                    threatCount: 3,
                    recentThreats: ["Minor road closure"],
                    highRiskCount: 0,
                    mediumRiskCount: 1,
                    lowRiskCount: 2,
                    cityInfo: MAJOR_INDIAN_CITIES["Bangalore"],
                },
                {
                    id: 4,
                    city: "Chennai",
                    coordinates: [13.0827, 80.2707],
                    threatLevel: "medium",
                    threatCount: 6,
                    recentThreats: ["Cyclone watch", "Power outage"],
                    highRiskCount: 1,
                    mediumRiskCount: 3,
                    lowRiskCount: 2,
                    cityInfo: MAJOR_INDIAN_CITIES["Chennai"],
                },
                {
                    id: 5,
                    city: "Kolkata",
                    coordinates: [22.5726, 88.3639],
                    threatLevel: "high",
                    threatCount: 12,
                    recentThreats: ["Festival crowd alert", "Traffic diversions"],
                    highRiskCount: 4,
                    mediumRiskCount: 5,
                    lowRiskCount: 3,
                    cityInfo: MAJOR_INDIAN_CITIES["Kolkata"],
                },
                {
                    id: 6,
                    city: "Hyderabad",
                    coordinates: [17.385, 78.4867],
                    threatLevel: "medium",
                    threatCount: 7,
                    recentThreats: ["IT corridor traffic", "Construction work"],
                    highRiskCount: 1,
                    mediumRiskCount: 4,
                    lowRiskCount: 2,
                    cityInfo: MAJOR_INDIAN_CITIES["Hyderabad"],
                },
                {
                    id: 7,
                    city: "Pune",
                    coordinates: [18.5204, 73.8567],
                    threatLevel: "low",
                    threatCount: 4,
                    recentThreats: ["Minor waterlogging"],
                    highRiskCount: 0,
                    mediumRiskCount: 2,
                    lowRiskCount: 2,
                    cityInfo: MAJOR_INDIAN_CITIES["Pune"],
                },
                {
                    id: 8,
                    city: "Ahmedabad",
                    coordinates: [23.0225, 72.5714],
                    threatLevel: "medium",
                    threatCount: 5,
                    recentThreats: ["Heat wave warning", "Water shortage"],
                    highRiskCount: 1,
                    mediumRiskCount: 2,
                    lowRiskCount: 2,
                    cityInfo: MAJOR_INDIAN_CITIES["Ahmedabad"],
                },
            ];

            setThreats(enhancedFallbackData);
            setLastUpdated(new Date().toISOString());
        } finally {
            setIsLoading(false);
        }
    }, []); // End useCallback

    useEffect(() => {
        const initializeMap = async () => {
            try {
                setIsLoading(true);

                // Get user's location for context
                try {
                    const location = await getLocationFromIP();
                    setUserLocation(location);
                } catch (locError) {
                    console.warn("Could not get user location:", locError);
                }

                // Fetch threat data
                await refreshThreatData();
            } catch (error) {
                console.error("Failed to initialize map:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeMap();
    }, [refreshThreatData]);

    useEffect(() => {
        // Auto-refresh every 30 seconds for live data
        const interval = setInterval(() => {
            refreshThreatData();
        }, 30000);

        return () => clearInterval(interval);
    }, [refreshThreatData]);

    // Filter threats based on selected level
    const filteredThreats = useMemo(() => {
        if (selectedThreatLevel === "all") return threats;
        return threats.filter((threat) => threat.threatLevel === selectedThreatLevel);
    }, [threats, selectedThreatLevel]);

    // Calculate statistics
    const threatStats = useMemo(() => {
        const stats = {
            total: threats.length,
            high: threats.filter((t) => t.threatLevel === "high").length,
            medium: threats.filter((t) => t.threatLevel === "medium").length,
            low: threats.filter((t) => t.threatLevel === "low").length,
            totalThreats: threats.reduce((sum, t) => sum + (t.threatCount || 0), 0),
        };
        return stats;
    }, [threats]);

    const handleCityClick = (threat) => {
        if (onCitySelect) {
            onCitySelect(threat);
        }
        toast.success(`📍 Selected ${threat.city}, ${threat.cityInfo?.state || "India"}`, {
            duration: 2000,
            icon: "🎯",
        });
    };

    const handleMapStyleChange = (style) => {
        setMapStyle(style);
        toast.success(`🗺️ Map style changed to ${style}`, { duration: 1500 });
    };

    if (isLoading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/40 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        className="w-12 h-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.p className="text-blue-800 dark:text-blue-200 font-medium text-lg" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                        🇮🇳 Loading India Threat Map...
                    </motion.p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">Fetching real-time threat data</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg backdrop-blur-sm">
                            <MapIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold flex items-center">🇮🇳 India Real-Time Threat Map</h3>
                            <p className="text-blue-100 dark:text-blue-200 text-sm">
                                Live monitoring of {threatStats.total} cities • {threatStats.totalThreats} active threats
                            </p>
                        </div>
                    </div>

                    {/* Map Controls */}
                    <div className="flex items-center space-x-3">
                        <motion.button
                            onClick={() => setShowHeatCircles(!showHeatCircles)}
                            className="p-2 bg-white/20 dark:bg-white/10 rounded-lg hover:bg-white/30 dark:hover:bg-white/20 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Toggle Heat Circles">
                            {showHeatCircles ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                        </motion.button>

                        <motion.button
                            onClick={refreshThreatData}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/20 dark:bg-white/10 rounded-lg hover:bg-white/30 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                            whileHover={isLoading ? {} : { scale: 1.05 }}
                            whileTap={isLoading ? {} : { scale: 0.95 }}>
                            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            <span className="text-sm font-medium">{isLoading ? "Updating..." : "Refresh"}</span>
                        </motion.button>
                    </div>
                </div>

                {/* Threat Statistics */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{threatStats.high}</div>
                        <div className="text-red-200 dark:text-red-300 text-sm">🔴 High Risk</div>
                    </div>
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{threatStats.medium}</div>
                        <div className="text-yellow-200 dark:text-yellow-300 text-sm">🟡 Medium Risk</div>
                    </div>
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{threatStats.low}</div>
                        <div className="text-green-200 dark:text-green-300 text-sm">🟢 Low Risk</div>
                    </div>
                    <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{threatStats.total}</div>
                        <div className="text-blue-200 dark:text-blue-300 text-sm">🏙️ Cities</div>
                    </div>
                </div>
            </div>

            {/* Map Controls Panel */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Map Style:</span>
                            <select
                                value={mapStyle}
                                onChange={(e) => handleMapStyleChange(e.target.value)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="light">🌞 Light</option>
                                <option value="dark">🌙 Dark</option>
                                <option value="satellite">🛰️ Satellite</option>
                                <option value="terrain">🏔️ Terrain</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                            <select
                                value={selectedThreatLevel}
                                onChange={(e) => setSelectedThreatLevel(e.target.value)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="all">All Threats ({threatStats.total})</option>
                                <option value="high">🔴 High Risk ({threatStats.high})</option>
                                <option value="medium">🟡 Medium Risk ({threatStats.medium})</option>
                                <option value="low">🟢 Low Risk ({threatStats.low})</option>
                            </select>
                        </div>
                    </div>

                    {lastUpdated && <div className="text-sm text-gray-600 dark:text-gray-400">Last updated: {new Date(lastUpdated).toLocaleTimeString("en-IN")}</div>}
                </div>
            </div>

            {/* Enhanced Leaflet Map with DOM safety */}
            <div className="h-[500px] relative">
                {filteredThreats.length > 0 ? (
                    <MapContainer
                        center={[20.5937, 78.9629]} // Center of India
                        zoom={5}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={true}
                        scrollWheelZoom={true}
                        className="z-0"
                        maxBounds={INDIA_BOUNDS}
                        maxBoundsViscosity={1.0}
                        ref={mapRef}
                        whenCreated={(mapInstance) => {
                            // Enhanced map initialization with DOM safety
                            const initializeMapSafely = async () => {
                                try {
                                    // Wait for DOM to be completely ready
                                    await new Promise((resolve) => setTimeout(resolve, 300));

                                    if (mapInstance && typeof mapInstance.getContainer === "function") {
                                        const container = mapInstance.getContainer();

                                        if (container && container.offsetWidth > 0) {
                                            // Force size recalculation
                                            mapInstance.invalidateSize({ animate: false });

                                            // Additional delay for pane initialization
                                            await new Promise((resolve) => setTimeout(resolve, 200));

                                            // Verify panes are initialized before any operations
                                            const panes = mapInstance.getPanes();
                                            if (panes && panes.mapPane && panes.mapPane._leaflet_pos !== undefined) {
                                                console.log("✅ Map fully initialized with proper DOM structure");
                                                // Add error handling for zoom events to prevent crashes
                                                mapInstance.on('zoomend', () => {
                                                    try {
                                                        const currentZoom = mapInstance.getZoom();
                                                        const maxAllowedZoom = mapZoomLimits[mapStyle].max;
                                                        if (currentZoom > maxAllowedZoom) {
                                                            mapInstance.setZoom(maxAllowedZoom);
                                                        }
                                                    } catch (error) {
                                                        console.warn('Error handling zoom:', error);
                                                    }
                                                });
                                                // Add error handling for tile loading errors
                                                mapInstance.on('tileerror', (error) => {
                                                    console.warn('Tile loading error, limiting zoom');
                                                    try {
                                                        const currentZoom = mapInstance.getZoom();
                                                        if (currentZoom > 12) {
                                                            mapInstance.setZoom(12);
                                                        }
                                                    } catch (e) {
                                                        console.warn('Error handling tile error:', e);
                                                    }
                                                });
                                            } else {
                                                console.warn("⚠️ Map panes not fully ready, waiting longer...");
                                                await new Promise((resolve) => setTimeout(resolve, 500));
                                                mapInstance.invalidateSize({ animate: false });
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.warn("Map initialization warning:", error);
                                }
                            };

                            initializeMapSafely();
                        }}
                        // Prevent map operations during initialization
                        attributionControl={false}
                        doubleClickZoom={false}
                        keyboard={false}
                        dragging={true}>
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url={mapStyles[mapStyle]}
                            maxZoom={mapZoomLimits[mapStyle].max}
                            minZoom={mapZoomLimits[mapStyle].min}
                            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                        />

                        <MapBoundsController threats={filteredThreats} />

                        {/* Safe component to re-enable controls after initialization */}
                        <SafeControlsEnabler />

                        {/* Threat Markers */}
                        <AnimatePresence>
                            {filteredThreats.map((threat) => (
                                <Marker
                                    key={threat.id}
                                    position={threat.coordinates}
                                    icon={createThreatIcon(threat.threatLevel, "medium")}
                                    eventHandlers={{
                                        click: () => handleCityClick(threat),
                                    }}>
                                    <Popup className="custom-popup">
                                        <div className="p-3 max-w-xs">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-lg text-gray-900">{threat.city}</h4>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        threat.threatLevel === "high"
                                                            ? "bg-red-100 text-red-800"
                                                            : threat.threatLevel === "medium"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {threat.threatLevel.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="text-sm text-gray-600 mb-3">
                                                📍 {threat.cityInfo?.state || "India"} • {threat.cityInfo?.region || "Unknown"} Region
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Total Threats:</span>
                                                    <span className="font-bold text-blue-600">{threat.threatCount || 0}</span>
                                                </div>

                                                {(threat.highRiskCount || 0) > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>🔴 High Risk:</span>
                                                        <span className="font-bold">{threat.highRiskCount}</span>
                                                    </div>
                                                )}

                                                {(threat.mediumRiskCount || 0) > 0 && (
                                                    <div className="flex justify-between text-yellow-600">
                                                        <span>🟡 Medium Risk:</span>
                                                        <span className="font-bold">{threat.mediumRiskCount}</span>
                                                    </div>
                                                )}

                                                {(threat.lowRiskCount || 0) > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span>🟢 Low Risk:</span>
                                                        <span className="font-bold">{threat.lowRiskCount}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {threat.recentThreats && threat.recentThreats.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <div className="font-medium text-gray-900 mb-1">Latest Threats:</div>
                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                        {threat.recentThreats.slice(0, 2).map((recentThreat, index) => (
                                                            <li key={index} className="flex items-start">
                                                                <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                                                <span>{recentThreat}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <motion.button
                                                onClick={() => handleCityClick(threat)}
                                                className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}>
                                                🎯 View Details
                                            </motion.button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </AnimatePresence>

                        {/* Heat Circles */}
                        {showHeatCircles &&
                            filteredThreats.map((threat) => (
                                <Circle
                                    key={`circle-${threat.id}`}
                                    center={threat.coordinates}
                                    radius={Math.max(50000, (threat.threatCount || 1) * 20000)} // Dynamic radius based on threat count
                                    pathOptions={{
                                        color: threat.threatLevel === "high" ? "#DC2626" : threat.threatLevel === "medium" ? "#F59E0B" : "#10B981",
                                        fillColor: threat.threatLevel === "high" ? "#DC2626" : threat.threatLevel === "medium" ? "#F59E0B" : "#10B981",
                                        fillOpacity: 0.1,
                                        weight: 2,
                                        opacity: 0.4,
                                    }}
                                />
                            ))}

                        {/* User Location Marker */}
                        {userLocation && userLocation.coordinates && (
                            <Marker
                                position={[userLocation.coordinates[1], userLocation.coordinates[0]]}
                                icon={L.divIcon({
                                    html: `
                    <div style="
                      width: 20px;
                      height: 20px;
                      background: #3B82F6;
                      border: 3px solid white;
                      border-radius: 50%;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      position: relative;
                    ">
                      <div style="
                        position: absolute;
                        width: 40px;
                        height: 40px;
                        background: #3B82F6;
                        border-radius: 50%;
                        opacity: 0.3;
                        top: -10px;
                        left: -10px;
                        animation: pulse 2s infinite;
                      "></div>
                    </div>
                  `,
                                    className: "user-location-marker",
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10],
                                })}>
                                <Popup>
                                    <div className="text-center">
                                        <div className="font-bold text-blue-600">📍 Your Location</div>
                                        <div className="text-sm text-gray-600">
                                            {userLocation.city}, {userLocation.region}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                            <div className="text-gray-500 text-lg mb-2">🗺️ No threats to display</div>
                            <div className="text-gray-400 text-sm">Adjust filters or check back later</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with real-time status */}
            <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">🇮🇳 Monitoring {threatStats.total} major Indian cities</span>
                        <span className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Live Data
                        </span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-gray-500">Powered by AI & Real-time News</span>
                        <motion.div
                            className="w-4 h-4 bg-blue-500 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ThreatHeatmap;
