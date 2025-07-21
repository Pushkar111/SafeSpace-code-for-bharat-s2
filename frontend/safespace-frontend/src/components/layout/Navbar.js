import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon, UserCircleIcon, SunIcon, MoonIcon, BellIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationModal from "../modals/NotificationModal";
import ProfileModal from "../modals/ProfileModal";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const { user, isAuthenticated, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthPage = ["/login", "/signup"].includes(location.pathname);

    // Add scroll detection
    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Add body scroll lock when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        await logout();
        navigate("/");
        setIsProfileMenuOpen(false);
    };

    const navigation = [
        { name: "Dashboard", href: "/dashboard", auth: true },
        { name: "Map", href: "/map", auth: true },
        { name: "Threats", href: "/threats", auth: true },
        { name: "Profile", href: "/profile", auth: true },
    ];

    const publicNavigation = [
        { name: "Home", href: "/" },
        { name: "About", href: "#about" },
        { name: "Features", href: "#features" },
        { name: "Contact", href: "#contact" },
    ];

    const handleImageError = () => {
        setProfileImageError(true);
    };

    const renderProfileAvatar = () => {
        const hasProfilePic = user?.profilePic?.url && !profileImageError;

        if (hasProfilePic) {
            return (
                <motion.img
                    src={user.profilePic.url}
                    alt={`${user?.name || "User"}'s profile`}
                    className="h-8 w-8 rounded-full object-cover border border-gray-300 shadow-sm"
                    onError={handleImageError}
                    onLoad={() => setProfileImageError(false)}
                    whileHover={{ scale: 1.1 }}
                />
            );
        }

        return (
            <motion.div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                <UserCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </motion.div>
        );
    };

    // Skip rendering navbar on auth pages
    if (isAuthPage) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full">
            <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8">
                <motion.nav
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`transition-all duration-500 ease-in-out w-full ${
                        isScrolled
                            ? "mt-2 sm:mt-4 py-2 px-3 sm:px-4 max-w-6xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-primary-500/10 border border-gray-200/50 dark:border-gray-800/50 rounded-xl sm:rounded-2xl"
                            : "py-3 sm:py-5 px-3 sm:px-6 max-w-7xl bg-transparent"
                    }`}>
                    <div className="flex items-center justify-between">
                        {/* Logo and brand */}
                        <Link to="/" className="flex items-center space-x-2 group relative">
                            {/* Glowing background effect */}
                            <motion.div
                                className="absolute -inset-2 rounded-full opacity-20"
                                animate={{
                                    background: [
                                        "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
                                        "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                                        "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
                                        "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
                                    ],
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Animated icon container */}
                            <motion.div
                                className={`relative transition-all duration-500 rounded-full ${isScrolled ? "bg-primary-900/30 dark:bg-primary-900/30 p-1.5" : ""}`}
                                whileHover={{
                                    scale: 1.15,
                                    rotate: [0, -5, 5, 0],
                                }}
                                animate={{
                                    boxShadow: [
                                        "0 0 0px 0px rgba(59,130,246,0)",
                                        "0 0 15px 3px rgba(59,130,246,0.3)",
                                        "0 0 20px 5px rgba(139,92,246,0.2)",
                                        "0 0 15px 3px rgba(59,130,246,0.3)",
                                        "0 0 0px 0px rgba(59,130,246,0)",
                                    ],
                                }}
                                transition={{
                                    boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                    scale: { duration: 0.2 },
                                    rotate: { duration: 0.3 },
                                }}>
                                {/* Rotating ring effect */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-primary-400/30"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                />

                                {/* Shield icon */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}>
                                    <ShieldCheckIcon
                                        className={`transition-all duration-500 text-primary-500 dark:text-primary-400 group-hover:text-primary-400 dark:group-hover:text-primary-300 relative z-10 ${
                                            isScrolled ? "h-6 w-6" : "h-7 w-7"
                                        }`}
                                    />
                                </motion.div>

                                {/* Pulse particles */}
                                <motion.div
                                    className="absolute top-1 right-1 w-1 h-1 bg-primary-400 rounded-full"
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 0.5,
                                    }}
                                />
                                <motion.div
                                    className="absolute bottom-1 left-1 w-1 h-1 bg-purple-400 rounded-full"
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 1,
                                    }}
                                />
                            </motion.div>

                            {/* Animated text */}
                            <div className={`font-bold transition-all duration-500 ${isScrolled ? "text-lg" : "text-2xl"} flex relative`}>
                                {/* Text shadow effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-400 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent blur-sm opacity-50"
                                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}>
                                    SafeSpace
                                </motion.div>

                                {/* Main text with floating letters */}
                                {"SafeSpace".split("").map((char, i) => (
                                    <motion.span
                                        key={i}
                                        className="bg-gradient-to-r from-primary-500 to-blue-500 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent relative z-10"
                                        style={{ display: "inline-block", whiteSpace: "pre" }}
                                        animate={{
                                            y: [0, -4, 0],
                                            textShadow: ["0px 0px 0px rgba(59,130,246,0)", "0px 2px 8px rgba(59,130,246,0.4)", "0px 0px 0px rgba(59,130,246,0)"],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.1,
                                        }}
                                        whileHover={{
                                            scale: 1.2,
                                            color: "#60a5fa",
                                            transition: { duration: 0.2 },
                                        }}>
                                        {char}
                                    </motion.span>
                                ))}

                                {/* Sparkle effects */}
                                <motion.div
                                    className="absolute -top-1 -right-2 text-primary-400 text-xs"
                                    animate={{
                                        scale: [0, 1, 0],
                                        rotate: [0, 180, 360],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: 1.5,
                                    }}>
                                    ✨
                                </motion.div>
                            </div>
                        </Link>


                        {/* Desktop Navigation - Hidden on mobile */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {(isAuthenticated ? navigation : publicNavigation).map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                                        location.pathname === item.href
                                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700/50"
                                            : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                    }`}>
                                    {item.name}
                                </Link>
                            ))}

                            {!isAuthenticated && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        to="/signup"
                                        className="ml-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200 text-sm">
                                        Get Started
                                    </Link>
                                </motion.button>
                            )}
                        </div>

                        {/* Right side buttons - Responsive */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Theme toggle - Always visible */}
                            <motion.button
                                onClick={toggleTheme}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-w-touch min-h-touch flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                                {isDark ? <SunIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" /> : <MoonIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                            </motion.button>

                            {/* Desktop-only authenticated user actions */}
                            {isAuthenticated && (
                                <>
                                    {/* Notifications - Hidden on small screens */}
                                    <motion.button
                                        onClick={() => setIsNotificationModalOpen(true)}
                                        className="hidden sm:flex p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative min-w-touch min-h-touch items-center justify-center"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}>
                                        <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <motion.span
                                            className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: [0.8, 1.2, 0.8] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        />
                                    </motion.button>

                                    {/* Profile dropdown - Hidden on small screens */}
                                    <div className="relative hidden sm:block">
                                        <motion.button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center space-x-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-touch min-h-touch"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}>
                                            {renderProfileAvatar()}
                                        </motion.button>

                                        <AnimatePresence>
                                            {isProfileMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                    {/* Profile menu content */}
                                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-center space-x-3">
                                                            {user?.profilePic?.url && !profileImageError ? (
                                                                <img
                                                                    src={user.profilePic.url}
                                                                    alt={`${user?.name || "User"}'s profile`}
                                                                    className="h-8 w-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                                                                    onError={handleImageError}
                                                                />
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                                    <UserCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to="/profile"
                                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        onClick={() => setIsProfileMenuOpen(false)}>
                                                        Your Profile
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileModalOpen(true);
                                                            setIsProfileMenuOpen(false);
                                                        }}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                        Account Settings
                                                    </button>
                                                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                                    <button
                                                        onClick={handleLogout}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                        Sign out
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}

                            {/* Desktop-only Sign in button for unauthenticated users */}
                            {!isAuthenticated && (
                                <div className="hidden lg:block">
                                    <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                                        Sign in
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button - Always visible on small screens */}
                            <motion.button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-w-touch min-h-touch flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                {isMenuOpen ? <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />}
                            </motion.button>
                        </div>
                    </div>
                </motion.nav>
            </div>

            {/* Mobile Menu Overlay - Improved for all mobile devices */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
                            onClick={() => setIsMenuOpen(false)}
                        />

                        {/* Mobile Menu Panel */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed top-16 sm:top-20 inset-x-2 sm:inset-x-4 z-50 lg:hidden">
                            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 max-h-[80vh] overflow-y-auto">
                                {/* Menu Header */}
                                <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
                                    <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                                        Navigation
                                    </span>
                                </div>

                                {/* Navigation Links */}
                                <div className="p-4 space-y-2">
                                    {(isAuthenticated ? navigation : publicNavigation).map((item, index) => (
                                        <motion.div
                                            key={item.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}>
                                            <Link
                                                to={item.href}
                                                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 min-h-touch ${
                                                    location.pathname === item.href
                                                        ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/50 shadow-sm"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 active:bg-gray-200 dark:active:bg-gray-700/50"
                                                }`}
                                                onClick={() => setIsMenuOpen(false)}>
                                                <span className="font-medium">{item.name}</span>
                                            </Link>
                                        </motion.div>
                                    ))}

                                    {/* Mobile-specific authenticated user actions */}
                                    {isAuthenticated && (
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                            <motion.button
                                                onClick={() => {
                                                    setIsNotificationModalOpen(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 min-h-touch"
                                                whileTap={{ scale: 0.98 }}>
                                                <BellIcon className="h-5 w-5" />
                                                <span className="font-medium">Notifications</span>
                                                <span className="ml-auto h-2 w-2 rounded-full bg-red-500"></span>
                                            </motion.button>

                                            <motion.button
                                                onClick={() => {
                                                    setIsProfileModalOpen(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 min-h-touch"
                                                whileTap={{ scale: 0.98 }}>
                                                {renderProfileAvatar()}
                                                <span className="font-medium">Account Settings</span>
                                            </motion.button>

                                            <motion.button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 min-h-touch"
                                                whileTap={{ scale: 0.98 }}>
                                                <span className="font-medium">Sign out</span>
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Mobile-specific unauthenticated user actions */}
                                    {!isAuthenticated && (
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                            <Link
                                                to="/login"
                                                className="flex items-center justify-center p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 font-medium min-h-touch"
                                                onClick={() => setIsMenuOpen(false)}>
                                                Sign in
                                            </Link>

                                            <Link
                                                to="/signup"
                                                className="flex items-center justify-center p-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 min-h-touch"
                                                onClick={() => setIsMenuOpen(false)}>
                                                Get Started
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modals */}
            <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} />
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </header>
    );
};

export default Navbar;
