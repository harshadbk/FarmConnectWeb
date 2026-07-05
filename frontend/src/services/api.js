// API Service Layer for FarmConnect
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

export const paymentAPI = {
  createPhonePeOrder: async (payload) => {
    const response = await fetch('http://localhost:7000/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment initialization failed');
    }
    return data;
  },

  getPaymentStatus: async (transactionId) => {
    const response = await fetch(`http://localhost:7000/status?id=${transactionId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment status lookup failed');
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

export default fetchAPI;
