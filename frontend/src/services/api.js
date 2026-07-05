// API Service Layer for FarmConnect
// All backend API calls are centralized here

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create an API client with default headers
const apiClient = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function for API calls
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth-token');
  
  const headers = {
    ...apiClient.headers,
    ...options.headers,
  };

  if (token) {
    headers['auth-token'] = token;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors || data.error || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    return fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (userData) => {
    return fetchAPI('/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getUser: async () => {
    return fetchAPI('/peruser', {
      method: 'GET',
    });
  },
};

// Product APIs
export const productAPI = {
  getAllProducts: async () => {
    return fetchAPI('/allproducts');
  },

  getNewCollections: async () => {
    return fetchAPI('/newcollection');
  },

  getPopularProducts: async () => {
    return fetchAPI('/popularinonion');
  },

  addProduct: async (productData) => {
    return fetchAPI('/addproduct', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  removeProduct: async (id) => {
    return fetchAPI('/removeproduct', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('product', file);

    return fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
};

// Cart APIs
export const cartAPI = {
  addToCart: async (itemId) => {
    return fetchAPI('/addtocart', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  removeFromCart: async (itemId) => {
    return fetchAPI('/removefromcart', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  getCart: async () => {
    return fetchAPI('/getcart', {
      method: 'POST',
    });
  },
};

// Order APIs
export const orderAPI = {
  createOrder: async (orderData) => {
    return fetchAPI('/addorder', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getPendingOrders: async () => {
    return fetchAPI('/pending');
  },

  getCompletedOrders: async () => {
    return fetchAPI('/complete');
  },

  getShopkeeperPendingOrders: async (email) => {
    return fetchAPI('/spending', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getShopkeeperCompletedOrders: async (email) => {
    return fetchAPI('/scomplete', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

/**
 * PhonePe Payment APIs
 * 
 * All payment operations go through the main backend (port 5000)
 * under the /api/payment/* route prefix.
 * 
 * The salt key and checksum generation happen ONLY on the backend.
 * The frontend never touches sensitive credentials.
 */
export const paymentAPI = {
  /**
   * Initiate a PhonePe payment
   * Calls: POST /api/payment/initiate
   * 
   * @param {Object} payload
   * @param {number} payload.amount - Amount in INR
   * @param {string} payload.userId - Customer email/ID
   * @param {string} payload.name - Customer full name
   * @param {string} payload.mobile - Customer mobile number
   * @returns {Object} { success, merchantTransactionId, paymentUrl }
   */
  initiatePayment: async (payload) => {
    const response = await fetch(`${API_URL}/api/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment initiation failed');
    }
    return data;
  },

  /**
   * Check payment status
   * Calls: GET /api/payment/status/:merchantTransactionId
   * 
   * @param {string} merchantTransactionId
   * @returns {Object} { success, paymentStatus, transactionId, amount, paymentMethod }
   */
  getPaymentStatus: async (merchantTransactionId) => {
    const response = await fetch(
      `${API_URL}/api/payment/status/${encodeURIComponent(merchantTransactionId)}`
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment status check failed');
    }
    return data;
  },
};

// Subscription APIs
export const subscriptionAPI = {
  subscribe: async (user, email) => {
    return fetchAPI('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ user, email }),
    });
  },

  unsubscribe: async (email) => {
    return fetchAPI('/unsub', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

// Farmer AI Assistant API
export const aiAPI = {
  getConversations: async () => {
    return fetchAPI('/api/ai/conversations');
  },

  getConversation: async (conversationId) => {
    return fetchAPI(`/api/ai/conversations/${conversationId}`);
  },

  createConversation: async (title) => {
    return fetchAPI('/api/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  askFarmerAssistant: async (question, conversationId) => {
    return fetchAPI('/api/ai/farmer-assistant', {
      method: 'POST',
      body: JSON.stringify({ question, conversationId }),
    });
  },
};

export default fetchAPI;
