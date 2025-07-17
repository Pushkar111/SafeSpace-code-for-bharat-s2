import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const FASTAPI_BASE_URL = process.env.REACT_APP_FASTAPI_URL || 'http://localhost:8001';

// Create axios instances
export const nodeAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For HttpOnly cookies
  timeout: 10000, // 10 second timeout
});

export const fastAPI = axios.create({
  baseURL: FASTAPI_BASE_URL,
  timeout: 15000, // Increased to 15 second timeout for AI processing
});

// Add response interceptor for error handling
nodeAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for auth check endpoints
    const isAuthCheck = error.config?.url?.includes('/auth/me');
    
    if (error.response?.status === 401 && !isAuthCheck) {
      // Only redirect to login if not already on login/register page
      const currentPath = window.location.pathname;
      const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      
      if (!authPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Location service using IPInfo API
export const getLocationFromIP = async () => {
  try {
    const response = await axios.get('https://ipinfo.io/json');
    return {
      city: response.data.city,
      region: response.data.region,
      country: response.data.country,
      coordinates: response.data.loc ? response.data.loc.split(',').map(Number) : null,
    };
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    return {
      city: 'Delhi', // Default fallback
      region: 'Delhi',
      country: 'IN',
      coordinates: [28.6139, 77.2090], // Delhi coordinates
    };
  }
};

// Request tracking to prevent duplicates
const activeRequests = new Map();

// Get threats data from FastAPI with ML analysis
export const getThreats = async (location = null) => {
  try {
    let url = '/api/threats';
    const params = {};
    
    const requestKey = location || 'default';
    
    // Check if there's already an active request for this location
    if (activeRequests.has(requestKey)) {
      console.log(`⏭️ Request already in progress for: ${requestKey}`);
      return await activeRequests.get(requestKey);
    }
    
    console.log(`🔍 Fetching AI-powered threats for: ${location || 'user location'}`);
    
    if (location) {
      // If location is provided, add it as parameter
      if (typeof location === 'string') {
        params.city = location;
      } else if (location.city) {
        params.city = location.city;
      }
    } else {
      // Get user's current location if not provided
      try {
        const userLocation = await getLocationFromIP();
        params.city = userLocation.city;
        console.log(`📍 Using user location: ${userLocation.city}`);
      } catch (error) {
        console.warn('Could not get user location, using Delhi as default');
        params.city = 'Delhi';
      }
    }
    
    // Create the request promise
    const requestPromise = (async () => {
      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout for ML processing
      
      try {
        const response = await fastAPI.get(url, { 
          params,
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        // Transform the response to match frontend expectations
        const threatsData = response.data;
        
        if (threatsData && threatsData.threats) {
          console.log(`✅ Successfully fetched ${threatsData.threats.length} AI-analyzed threats`);
          console.log(`🧠 ML Models Status: ${threatsData.ml_available ? 'Active' : 'Fallback mode'}`);
          
          // Transform threats to match frontend format
          const transformedThreats = threatsData.threats.map((threat, index) => ({
            id: threat.id || index + 1,
            title: threat.title,
            summary: threat.description?.substring(0, 150) + '...' || threat.title,
            category: threat.category,
            level: threat.level,
            location: threatsData.city,
            timestamp: threat.publishedAt || new Date().toISOString(),
            description: threat.description || '',
            aiAdvice: threat.safety_advice || [],
            coordinates: [28.6139, 77.2090], // Default coordinates - you can enhance this
            affectedPeople: Math.floor(Math.random() * 10000) + 1000, // Estimated
            source: threat.source || 'AI Analysis',
            url: threat.url || '',
            mlConfidence: threat.confidence || 0,
            mlDetected: threat.ml_detected || false,
            mlAnalysis: threat.ml_analysis || null
          }));
          
          return transformedThreats;
        }
        
        return [];
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle cancellation gracefully
        if (fetchError.name === 'CanceledError' || fetchError.code === 'ERR_CANCELED') {
          console.log('⏰ Request was canceled (timeout or abort)');
          throw fetchError;
        }
        
        throw fetchError;
      } finally {
        // Remove from active requests when done
        activeRequests.delete(requestKey);
      }
    })();
    
    // Store the promise to prevent duplicates
    activeRequests.set(requestKey, requestPromise);
    
    return await requestPromise;
    
  } catch (error) {
    console.error('❌ Failed to fetch threats:', error.message);
    
    // For cancellation errors, re-throw without fallback
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      throw error;
    }
    
    // Determine the location for fallback data
    const fallbackLocation = location || "Delhi";
    
    console.log(`🔄 Returning fallback data for ${fallbackLocation}`);
    
    // Return enhanced fallback mock data
    return [
      {
        id: 1,
        title: "Traffic Congestion Alert",
        summary: "Heavy traffic reported on main highway due to ongoing construction",
        category: "traffic",
        level: "medium",
        location: fallbackLocation,
        timestamp: new Date().toISOString(),
        description: "Expect delays of 30-45 minutes on the main highway due to construction work",
        aiAdvice: [
          "Consider alternate routes or delay your travel",
          "Allow extra 45 minutes for your journey",
          "Use public transport if available"
        ],
        coordinates: [28.6139, 77.2090],
        affectedPeople: 5000,
        source: "Traffic Control (Fallback)",
        mlConfidence: 0.0,
        mlDetected: false
      },
      {
        id: 2,
        title: "Weather Advisory",
        summary: "Heavy rainfall expected in the evening hours",
        category: "natural",
        level: "high",
        location: fallbackLocation,
        timestamp: new Date().toISOString(),
        description: "Meteorological department forecasts heavy rainfall with possible waterlogging",
        aiAdvice: [
          "Carry umbrella and avoid waterlogged areas",
          "Check transportation schedules before traveling",
          "Stay indoors during heavy rain if possible"
        ],
        coordinates: [28.6139, 77.2090],
        affectedPeople: 15000,
        source: "Weather Department (Fallback)",
        mlConfidence: 0.0,
        mlDetected: false
      }
    ];
  }
};

// Get threat details with AI advice
export const getThreatDetails = async (threatId) => {
  try {
    const response = await fastAPI.get(`/api/threats/${threatId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch threat details:', error);
    throw error;
  }
};

// Authentication APIs (Node.js backend)
export const loginUser = async (email, password) => {
  try {
    const response = await nodeAPI.post('/auth/login/email-password', { email, password });
    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await nodeAPI.post('/auth/register', userData);
    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed'
    };
  }
};

export const loginUserWithMobile = async (mobile, password) => {
  try {
    const response = await nodeAPI.post('/auth/login/mobile-password', { mobile, password });
    return {
      success: true,
      user: response.data.user,
      tokens: response.data.tokens,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Mobile login failed'
    };
  }
};

export const loginUserWithEmailOTP = async (email) => {
  try {
    const response = await nodeAPI.post('/auth/login/email-otp/send', { email });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP'
    };
  }
};

export const verifyEmailOTP = async (email, otp) => {
  try {
    const response = await nodeAPI.post('/auth/login/email-otp/verify', { email, otp });
    return {
      success: true,
      user: response.data.user,
      tokens: response.data.tokens,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'OTP verification failed'
    };
  }
};

export const loginUserWithMobileOTP = async (mobile) => {
  try {
    const response = await nodeAPI.post('/auth/login/mobile-otp/send', { mobile });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send SMS OTP'
    };
  }
};

export const verifyMobileOTP = async (mobile, otp) => {
  try {
    const response = await nodeAPI.post('/auth/login/mobile-otp/verify', { mobile, otp });
    return {
      success: true,
      user: response.data.user,
      tokens: response.data.tokens,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'SMS OTP verification failed'
    };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await nodeAPI.post('/auth/forgot-password', { email });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send reset email'
    };
  }
};

export const resetPassword = async (email, newPassword, token) => {
  try {
    const response = await nodeAPI.post(`/auth/reset-password?email=${email}`, { 
      newPassword,
      token 
    });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Password reset failed'
    };
  }
};

export const logoutUser = async () => {
  try {
    const response = await nodeAPI.post('/auth/logout');
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Logout failed'
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await nodeAPI.get('/auth/me');
    return {
      success: true,
      user: response.data.user
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get user info'
    };
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await nodeAPI.put('/auth/profile', userData);
    console.log('Profile update response:', response.data);
    return {
      success: true,
      user: response.data.user,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Profile update failed'
    };
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await nodeAPI.post('/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Password change failed'
    };
  }
};

// Saved threats APIs
export const getSavedThreats = async () => {
  try {
    const response = await nodeAPI.get('/auth/saved-threats');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get saved threats'
    };
  }
};

export const saveThreat = async (threatData) => {
  try {
    // Ensure we have all required fields
    const completeData = {
      threatId: threatData.id,
      title: threatData.title || "Unknown Threat",
      description: threatData.description || threatData.summary || "",
      category: threatData.category || "general",
      level: threatData.level || "medium",
      location: threatData.location || "",
      source: threatData.source || "Unknown",
      confidence: threatData.confidence || threatData.mlConfidence || 0,
      affectedPeople: threatData.affectedPeople || 0,
      coordinates: threatData.coordinates || [0, 0],
      aiAdvice: threatData.aiAdvice || threatData.safety_advice || [],
      originalTimestamp: threatData.timestamp || threatData.publishedAt || new Date().toISOString()
    };

    const response = await nodeAPI.post('/auth/saved-threats', completeData);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to save threat'
    };
  }
};

export const removeSavedThreat = async (threatId) => {
  try {
    const response = await nodeAPI.delete(`/auth/saved-threats/${threatId}`);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to remove saved threat'
    };
  }
};

// Notification settings
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await nodeAPI.put('/auth/notifications/settings', { settings });
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update notification settings'
    };
  }
};

// ML-powered threat analysis APIs
export const analyzeText = async (text, city = null) => {
  try {
    const payload = { text };
    if (city) payload.city = city;
    
    const response = await fastAPI.post('/api/threats/analyze', payload);
    return {
      success: true,
      analysis: response.data
    };
  } catch (error) {
    console.error('Failed to analyze text:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Text analysis failed'
    };
  }
};

export const getMLModelsStatus = async () => {
  try {
    const response = await fastAPI.get('/api/models/status');
    return {
      success: true,
      status: response.data
    };
  } catch (error) {
    console.error('Failed to get ML models status:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to get models status'
    };
  }
};

export const testMLModels = async () => {
  try {
    const response = await fastAPI.post('/api/models/test');
    return {
      success: true,
      results: response.data
    };
  } catch (error) {
    console.error('Failed to test ML models:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'ML models test failed'
    };
  }
};

export const getDemoThreats = async () => {
  try {
    const response = await fastAPI.get('/api/threats/demo');
    return {
      success: true,
      demo: response.data
    };
  } catch (error) {
    console.error('Failed to get demo threats:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Demo threats failed'
    };
  }
};

export const analyzeBatchCities = async (cities) => {
  try {
    const citiesParam = Array.isArray(cities) ? cities.join(',') : cities;
    const response = await fastAPI.get('/api/threats/batch', {
      params: { cities: citiesParam }
    });
    return {
      success: true,
      results: response.data
    };
  } catch (error) {
    console.error('Failed to analyze batch cities:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Batch analysis failed'
    };
  }
};

// Enhanced threat search with ML
export const searchThreats = async (query, filters = {}) => {
  try {
    const params = { q: query, ...filters };
    const response = await fastAPI.get('/api/threats/search', { params });
    return {
      success: true,
      threats: response.data.threats || [],
      total: response.data.total || 0
    };
  } catch (error) {
    console.error('Failed to search threats:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Threat search failed'
    };
  }
};

// AI-powered safety advice generation
export const generateSafetyAdvice = async (text, description = "", useAI = true, city = null) => {
  try {
    const params = {
      text,
      description,
      use_ai: useAI
    };
    
    if (city) {
      params.city = city;
    }
    
    const response = await fastAPI.post('/api/threats/advice', null, { params });
    return {
      success: true,
      advice: response.data
    };
  } catch (error) {
    console.error('Failed to generate safety advice:', error);
    return {
      success: false,
      message: error.response?.data?.detail || 'Safety advice generation failed'
    };
  }
};

// Upload profile picture
export const uploadProfilePicture = async (userId, file) => {
  try {
    console.log('=== UPLOAD DEBUG INFO ===');
    console.log('User ID:', userId);
    console.log('File details:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      lastModified: file.lastModified 
    });
    
    const formData = new FormData();
    formData.append('profilePic', file);

    console.log('Making request to:', `/upload/profile/${userId}`);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value instanceof File ? `File: ${value.name}` : value);
    }

    const response = await nodeAPI.post(`/upload/profile/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response status:', response.status);
    console.log('Upload response data:', response.data);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('=== UPLOAD ERROR DEBUG ===');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    return {
      success: false,
      message: error.response?.data?.error || error.response?.data?.message || 'Profile picture upload failed'
    };
  }
};
