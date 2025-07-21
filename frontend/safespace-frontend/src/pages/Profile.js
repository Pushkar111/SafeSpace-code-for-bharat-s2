import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCircleIcon, BellIcon, StarIcon, CogIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { getSavedThreats, updateNotificationSettings, removeSavedThreat } from "../utils/api";
import ThreatCard from "../components/threats/ThreatCard";
import toast from "react-hot-toast";
import ThreatModal from "../components/threats/ThreatModal";
import ProfileModal from "../components/modals/ProfileModal";

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [savedThreats, setSavedThreats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRemovingThreat, setIsRemovingThreat] = useState(null); // Track which threat is being removed
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedThreat, setSelectedThreat] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileModalActiveTab, setProfileModalActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        age: user.age || "",
        gender: user.gender || "",
        bloodGroup: user.bloodGroup || "",
        hobbies: user.hobbies || [],
        bio: user.bio || "",
        location: user.location || "",
        preferredCities: user.preferredCities || [],
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        avatar: user.profilePic?.url || user.avatar || null,
    });
    const [notificationSettings, setNotificationSettings] = useState({
        emailAlerts: true,
        pushNotifications: true,
        highRiskOnly: false,
        weeklyDigest: true,
    });

    useEffect(() => {
        loadSavedThreats();
        loadNotificationSettings();
    }, []);

    const loadSavedThreats = async () => {
        try {
            const threats = await getSavedThreats();
            console.log("Saved threats loaded:", threats);
            setSavedThreats(threats.data);
        } catch (error) {
            console.error("Failed to load saved threats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadNotificationSettings = () => {
        // In a real app, this would come from the API
        const savedSettings = localStorage.getItem("notificationSettings");
        if (savedSettings) {
            setNotificationSettings(JSON.parse(savedSettings));
        }
    };

    const handleThreatClick = (threat) => {
        setSelectedThreat(threat);
        setIsModalOpen(true);
    };

    const handleRemoveSavedThreat = async (threatId) => {
        // Show confirmation dialog
        const confirmed = window.confirm("Are you sure you want to remove this threat from your saved list?");

        if (!confirmed) {
            return;
        }

        // Set loading state for this specific threat
        setIsRemovingThreat(threatId);

        try {
            console.log("Removing threat:", threatId);
            const response = await removeSavedThreat(threatId);

            if (response.success) {
                // Remove the threat from local state
                setSavedThreats((prev) => prev.filter((threat) => threat.threatId !== threatId && threat.id !== threatId));
                toast.success("Threat removed from saved list");
            } else {
                toast.error(response.message || "Failed to remove threat");
            }
        } catch (error) {
            console.error("Error removing saved threat:", error);
            toast.error("Failed to remove threat. Please try again.");
        } finally {
            // Clear loading state
            setIsRemovingThreat(null);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(formData);
            setIsEditing(false);
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleNotificationUpdate = async (setting, value) => {
        const newSettings = { ...notificationSettings, [setting]: value };
        setNotificationSettings(newSettings);

        try {
            await updateNotificationSettings(newSettings);
            localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
            toast.success("Notification settings updated");
        } catch (error) {
            toast.error("Failed to update notification settings");
        }
    };

    const handleOpenPasswordChange = () => {
        setProfileModalActiveTab('security');
        setIsProfileModalOpen(true);
    };

    const getUserStats = () => ({
        threatsViewed: 47,
        threatsSaved: savedThreats?.length,
        accountAge: "2 months",
        lastActive: "Today",
    });

    const stats = getUserStats();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 scroll-mt-16" id="profile-page">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Manage your account settings and preferences</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Profile Info */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                    <UserCircleIcon className="h-5 w-5 mr-2" />
                                    Profile Information
                                </h2>
                                <motion.button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}>
                                    {isEditing ? "Cancel" : "Edit"}
                                </motion.button>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                            <input
                                                type="tel"
                                                value={formData.mobile}
                                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                                            <input
                                                type="number"
                                                value={formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                min="1"
                                                max="120"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                                            <select
                                                value={formData.bloodGroup}
                                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select Blood Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="Enter your city or location"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Cities</label>
                                            <input
                                                type="text"
                                                value={Array.isArray(formData.preferredCities) ? formData.preferredCities.join(", ") : formData.preferredCities}
                                                onChange={(e) => setFormData({ 
                                                    ...formData, 
                                                    preferredCities: e.target.value.split(',').map(city => city.trim()).filter(city => city) 
                                                })}
                                                placeholder="e.g., Delhi, Mumbai, Bangalore"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Separate multiple cities with commas
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hobbies</label>
                                            <input
                                                type="text"
                                                value={Array.isArray(formData.hobbies) ? formData.hobbies.join(", ") : formData.hobbies}
                                                onChange={(e) => setFormData({ 
                                                    ...formData, 
                                                    hobbies: e.target.value.split(',').map(hobby => hobby.trim()).filter(hobby => hobby) 
                                                })}
                                                placeholder="e.g., Reading, Sports, Music"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Separate multiple hobbies with commas
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows="3"
                                            placeholder="Tell us about yourself..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                        <motion.button
                                            type="submit"
                                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}>
                                            Save Changes
                                        </motion.button>
                                        <motion.button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}>
                                            Cancel
                                        </motion.button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                                        <p className="text-gray-900 dark:text-white">{user?.name || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                        <p className="text-gray-900 dark:text-white">{user?.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mobile Number</label>
                                        <p className="text-gray-900 dark:text-white">{user?.mobile || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Age</label>
                                        <p className="text-gray-900 dark:text-white">{user?.age || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Gender</label>
                                        <p className="text-gray-900 dark:text-white">
                                            {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "Not specified"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Blood Group</label>
                                        <p className="text-gray-900 dark:text-white">{user?.bloodGroup || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</label>
                                        <p className="text-gray-900 dark:text-white">{user?.location || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Preferred Cities</label>
                                        <p className="text-gray-900 dark:text-white">
                                            {user?.preferredCities && Array.isArray(user.preferredCities) && user.preferredCities.length > 0 
                                                ? user.preferredCities.join(", ") 
                                                : "Not specified"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Hobbies</label>
                                        <p className="text-gray-900 dark:text-white">
                                            {user?.hobbies && Array.isArray(user.hobbies) && user.hobbies?.length > 0 
                                                ? user.hobbies.join(", ") 
                                                : "Not specified"}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                                        <p className="text-gray-900 dark:text-white">{user?.bio || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member Since</label>
                                        <p className="text-gray-900 dark:text-white">{stats.accountAge}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                <BellIcon className="h-5 w-5 mr-2" />
                                Notification Preferences
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Alerts</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive threat notifications via email</p>
                                    </div>
                                    <motion.button
                                        onClick={() => handleNotificationUpdate("emailAlerts", !notificationSettings.emailAlerts)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.emailAlerts ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                        whileTap={{ scale: 0.95 }}>
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.emailAlerts ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </motion.button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive instant push notifications</p>
                                    </div>
                                    <motion.button
                                        onClick={() => handleNotificationUpdate("pushNotifications", !notificationSettings.pushNotifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.pushNotifications ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                        whileTap={{ scale: 0.95 }}>
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.pushNotifications ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </motion.button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">High Risk Only</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Only receive high-risk threat alerts</p>
                                    </div>
                                    <motion.button
                                        onClick={() => handleNotificationUpdate("highRiskOnly", !notificationSettings.highRiskOnly)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.highRiskOnly ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                        whileTap={{ scale: 0.95 }}>
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.highRiskOnly ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </motion.button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Weekly Digest</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly safety summary</p>
                                    </div>
                                    <motion.button
                                        onClick={() => handleNotificationUpdate("weeklyDigest", !notificationSettings.weeklyDigest)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.weeklyDigest ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                        whileTap={{ scale: 0.95 }}>
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.weeklyDigest ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-6">
                        {/* Stats Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                Your Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Threats Viewed</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats.threatsViewed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Threats Saved</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats.threatsSaved}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Account Age</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats.accountAge}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Last Active</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{stats.lastActive}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <CogIcon className="h-5 w-5 mr-2" />
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <motion.button
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}>
                                    Export Data
                                </motion.button>
                                <motion.button
                                    onClick={handleOpenPasswordChange}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}>
                                    Change Password
                                </motion.button>
                                <motion.button
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}>
                                    Delete Account
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Saved Threats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-6 lg:mt-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                            <StarIcon className="h-5 w-5 mr-2" />
                            Saved Threats ({savedThreats?.length})
                        </h2>

                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading saved threats...</p>
                            </div>
                        ) : savedThreats?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                                {savedThreats.map((threat, index) => (
                                    <ThreatCard
                                        key={threat.id || threat.threatId}
                                        threat={threat}
                                        index={index}
                                        isSaved={true}
                                        onClick={handleThreatClick}
                                        onSave={() => handleRemoveSavedThreat(threat.threatId || threat.id)}
                                        isRemoving={isRemovingThreat === (threat.threatId || threat.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <StarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved threats</h3>
                                <p className="text-gray-600 dark:text-gray-400">Star threats from the dashboard to save them here for quick access.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Threat details modal */}
            <ThreatModal threat={selectedThreat} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isSaved={true} />
            
            {/* Profile modal */}
            <ProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)}
                initialTab={profileModalActiveTab}
            />
        </div>
    );
};

export default Profile;
