import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon, 
  KeyIcon,
  MapPinIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { uploadProfilePicture, changePassword } from '../../utils/api';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose, initialTab = 'profile' }) => {
  const { user, updateProfile, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  

  console.log("user: ", user); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    gender: '',
    bloodGroup: '',
    hobbies: [],
    bio: '',
    location: '',
    preferredCities: [],
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: null
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        age: user.age || '',
        gender: user.gender || '',
        bloodGroup: user.bloodGroup || '',
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        location: user.location || '',
        preferredCities: user.preferredCities || [],
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        avatar: user.profilePic?.url || user.avatar || null
      });
    }
  }, [user]);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Reset password fields when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(item => item) : value
    }));
  };



  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (1MB limit)
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB');
        return;
      }

      try {
        setLoading(true);
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({
            ...prev,
            avatar: e.target.result
          }));
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        console.log('Attempting upload for user:', user.id || user._id, 'User object:', user);
        const uploadResult = await uploadProfilePicture(user.id || user._id, file);
        
        console.log('Upload result:', uploadResult);
        
        if (uploadResult.success) {
          // Update form data with uploaded image URL
          setFormData(prev => ({
            ...prev,
            avatar: uploadResult.data.secure_url
          }));
          
          toast.success('Profile picture uploaded successfully!');
          
          // Refresh user data to get updated profile picture
          await checkAuthStatus();
        } else {
          console.error('Upload failed:', uploadResult.message);
          
          // Provide more specific error messages
          if (uploadResult.message?.includes('token') || uploadResult.message?.includes('Unauthorized')) {
            toast.error('Session expired. Please log in again.');
            // Force re-authentication
            await checkAuthStatus();
          } else if (uploadResult.message?.includes('Forbidden')) {
            toast.error('You can only upload your own profile picture.');
          } else if (uploadResult.message?.includes('File size')) {
            toast.error('File size must be less than 1MB.');
          } else if (uploadResult.message?.includes('file type')) {
            toast.error('Please upload a valid image file (JPEG, PNG, or GIF).');
          } else {
            toast.error(uploadResult.message || 'Failed to upload profile picture');
          }
          
          // Reset avatar on failure
          setFormData(prev => ({
            ...prev,
            avatar: user.profilePic?.url || user.avatar || null
          }));
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        
        // Handle different types of errors
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          await checkAuthStatus();
        } else if (error.response?.status === 403) {
          toast.error('You don\'t have permission to upload this file.');
        } else if (error.response?.status === 413) {
          toast.error('File too large. Please select a smaller image.');
        } else {
          toast.error('Failed to upload profile picture. Please try again.');
        }
        
        // Reset avatar on failure
        setFormData(prev => ({
          ...prev,
          avatar: user.profilePic?.url || user.avatar || null
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = {
        name: formData.name,
        mobile: formData.mobile,
        age: parseInt(formData.age) || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        hobbies: formData.hobbies,
        bio: formData.bio,
        location: formData.location,
        preferredCities: formData.preferredCities
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const result = await updateProfile(updateData);
      console.log('Profile updated result:', result);
      if (result.success) {
        toast.success('Profile updated successfully!');
        onClose();
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      
      if (result.success) {
        toast.success('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
    { id: 'preferences', label: 'Preferences', icon: MapPinIcon }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      size="xl"
      className="max-h-[95vh] overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
        {/* Sidebar - Responsive tabs */}
        <div className="w-full lg:w-64 bg-gray-50 dark:bg-gray-800/50 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
          {/* Mobile: Horizontal scroll tabs */}
          <div className="lg:hidden">
            <div className="flex overflow-x-auto scrollbar-hide p-2 space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[80px]
                      ${activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Desktop: Vertical tabs */}
          <div className="hidden lg:block p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-colors font-medium
                    ${activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-container">
          <div className="p-3 sm:p-4 lg:p-6">{/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.form 
              onSubmit={handleProfileUpdate} 
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Profile Picture */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                    {formData.avatar ? (
                      <img 
                        src={formData.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary-600 dark:bg-primary-500 rounded-full p-2 cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-lg min-w-touch min-h-touch flex items-center justify-center">
                    <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Click the camera icon to change your profile picture
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors text-sm sm:text-base"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm sm:text-base"
                    placeholder="Email cannot be changed"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter your mobile number"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="120"
                    placeholder="Enter your age"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
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

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hobbies
                  </label>
                  <input
                    type="text"
                    name="hobbies"
                    value={Array.isArray(formData.hobbies) ? formData.hobbies.join(', ') : formData.hobbies}
                    onChange={(e) => handleArrayInputChange('hobbies', e.target.value)}
                    placeholder="Enter hobbies separated by commas"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Separate multiple hobbies with commas
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Cities
                  </label>
                  <input
                    type="text"
                    name="preferredCities"
                    value={Array.isArray(formData.preferredCities) ? formData.preferredCities.join(', ') : formData.preferredCities}
                    onChange={(e) => handleArrayInputChange('preferredCities', e.target.value)}
                    placeholder="Enter preferred cities separated by commas"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Separate multiple cities with commas
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter your city or location"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-touch"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium bg-primary-600 dark:bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </motion.form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.form 
              onSubmit={handlePasswordChange} 
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                        placeholder="Enter your current password"
                        required
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 min-w-touch min-h-touch flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showCurrentPassword ? <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                        placeholder="Enter your new password"
                        required
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 min-w-touch min-h-touch flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showNewPassword ? <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-touch"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium bg-primary-600 dark:bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div 
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                Preferences
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <CogIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Preference settings are coming soon...
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm mt-2">
                    This section will include notification preferences, privacy settings, and more.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </Modal>
  );
};

export default ProfileModal;
