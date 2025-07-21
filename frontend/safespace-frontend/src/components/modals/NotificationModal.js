import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon, 
  EnvelopeIcon, 
  DevicePhoneMobileIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import { updateNotificationSettings } from '../../utils/api';
import toast from 'react-hot-toast';

const NotificationModal = ({ isOpen, onClose, currentSettings = {} }) => {
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    sms: false,
    location: true,
    emergency: true,
    digest: false,
    ...currentSettings
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateNotificationSettings(settings);
      toast.success('Notification settings updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <motion.button
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        ${enabled ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}
        touch-manipulation min-w-touch
      `}
      whileTap={{ scale: 0.95 }}
      aria-label={enabled ? 'Disable' : 'Enable'}
    >
      <motion.span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
          transition-transform duration-200 ease-in-out
        `}
        animate={{ x: enabled ? 28 : 4 }}
      />
    </motion.button>
  );

  const settingsConfig = [
    {
      key: 'emergency',
      title: 'Emergency Alerts',
      description: 'Critical safety alerts in your area',
      icon: BellIcon,
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      required: true
    },
    {
      key: 'location',
      title: 'Location-based Alerts',
      description: 'Threats near your current location',
      icon: MapPinIcon,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      key: 'email',
      title: 'Email Notifications',
      description: 'Receive updates via email',
      icon: EnvelopeIcon,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      key: 'push',
      title: 'Push Notifications',
      description: 'Browser push notifications',
      icon: DevicePhoneMobileIcon,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      key: 'sms',
      title: 'SMS Alerts',
      description: 'Text message notifications',
      icon: DevicePhoneMobileIcon,
      color: 'text-orange-500 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      key: 'digest',
      title: 'Daily Digest',
      description: 'Summary of daily safety updates',
      icon: ClockIcon,
      color: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Settings"
      size="lg"
      className="max-h-[90vh] overflow-hidden"
    >
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-h-[80vh] overflow-y-auto scroll-container">
        <div className="space-y-3 sm:space-y-4">
          {settingsConfig.map((config) => {
            const Icon = config.icon;
            return (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.color} flex-shrink-0`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        {config.title}
                      </h3>
                      {config.required && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 rounded-full flex-shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <ToggleSwitch
                    enabled={settings[config.key]}
                    onChange={() => !config.required && handleToggle(config.key)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info box */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                Privacy Note
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                We respect your privacy. You can change these settings anytime. 
                Emergency alerts cannot be disabled for your safety.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base min-h-touch focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base min-h-touch focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Settings'
            )}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;
