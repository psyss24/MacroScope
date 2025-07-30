/**
 * API service for interacting with the MacroScope backend
 */

// Determine API base URL based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? '/api' 
  : 'https://YOUR_RAILWAY_APP.up.railway.app/api'; // REPLACE WITH YOUR ACTUAL RAILWAY URL

// TODO: Replace 'YOUR_RAILWAY_APP' with your actual Railway app name
// Example: 'macroscope-backend-production.up.railway.app'

/**
 * Fetch data from the API with error handling
 * @param {string} endpoint - API endpoint to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data
 */
const fetchFromAPI = async (endpoint, options = {}) => {
  try {
    // Add a default timeout if no signal is provided
    const signal = options.signal || AbortSignal.timeout(10000); // 10 second timeout

    // Fetch directly from the API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from API ${endpoint}:`, error);
    throw error;
  }
};

/**
 * API service object with methods for each endpoint
 */
const apiService = {
  /**
   * Get market data (indices, currencies, commodities, crypto)
   * @param {string} category - Optional category filter
   * @param {boolean} forDashboard - Whether to fetch only dashboard data
   * @returns {Promise<Object>} - Market data
   */
  getMarketData: (category = null, forDashboard = false, options = {}) => {
    let endpoint = category ? `/market?category=${category}` : '/market';
    if (forDashboard) {
      endpoint += category ? '&dashboard=true' : '?dashboard=true';
    }
    return fetchFromAPI(endpoint, options);
  },
  
  /**
   * Get macroeconomic data
   * @param {string} country - Optional country filter
   * @param {boolean} forDashboard - Whether to fetch only dashboard data
   * @returns {Promise<Object>} - Macro data
   */
  getMacroData: (country = null, forDashboard = false, options = {}) => {
    let endpoint = country ? `/macro?country=${country}` : '/macro';
    if (forDashboard) {
      endpoint += country ? '&dashboard=true' : '?dashboard=true';
    }
    return fetchFromAPI(endpoint, options);
  },
  
  /**
   * Get sentiment and risk metrics
   * @returns {Promise<Object>} - Sentiment data
   */
  getSentimentData: (options = {}) => {
    return fetchFromAPI('/sentiment', options);
  },
  
  /**
   * Get market breadth data
   * @returns {Promise<Object>} - Breadth data
   */
  getBreadthData: (options = {}) => {
    return fetchFromAPI('/breadth', options);
  },
  
  /**
   * Get overview data with key market statistics
   * @returns {Promise<Object>} - Overview data
   */
  getOverviewData: (options = {}) => {
    return fetchFromAPI('/overview', options);
  },
  
  /**
   * Get optimized dashboard data with only specific metrics needed for overview cards
   * @returns {Promise<Object>} - Dashboard data
   */
  getDashboardData: (options = {}) => {
    return fetchFromAPI('/dashboard', options);
  },
  
  /**
   * Get top stocks data
   * @param {Array<string>} symbols - Optional list of stock symbols to fetch
   * @returns {Promise<Object>} - Stocks data
   */
  getStocksData: (symbols = null, options = {}) => {
    let endpoint = '/stocks';
    if (symbols && symbols.length > 0) {
      endpoint += `?symbols=${symbols.join(',')}`;
    }
    return fetchFromAPI(endpoint, options);
  },
  
  /**
   * Get all data types in a single response
   * @returns {Promise<Object>} - All data
   */
  getAllData: (options = {}) => {
    return fetchFromAPI('/all', options);
  },
  
  /**
   * Search for stock tickers
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - Search results
   */
  search: (query, limit = 10, options = {}) => {
    return fetchFromAPI(`/search?query=${encodeURIComponent(query)}&limit=${limit}`, options);
  },
  
  /**
   * Start a stateful stock search
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<{search_id: string}>}
   */
  startStockSearch: (query, limit = 10) => {
    return fetchFromAPI(`/search/start?query=${encodeURIComponent(query)}&limit=${limit}`);
  },

  /**
   * Poll for stateful stock search results
   * @param {string} searchId - The search session ID
   * @returns {Promise<{results: Array, complete: boolean}>}
   */
  pollStockSearchResults: (searchId) => {
    return fetchFromAPI(`/search/results?search_id=${encodeURIComponent(searchId)}`);
  },
  
  /**
   * Get detailed information for a specific ticker
   * @param {string} symbol - Ticker symbol
   * @returns {Promise<Object>} - Ticker details
   */
  getTickerDetails: (symbol, options = {}) => {
    return fetchFromAPI(`/ticker/${encodeURIComponent(symbol)}`, options);
  },
  
  /**
   * Update all data files by fetching fresh data
   * @returns {Promise<Object>} - Update status
   */
  updateAllData: (options = {}) => {
    return fetchFromAPI('/update', { method: 'POST', ...options });
  },
  
  /**
   * Check API health
   * @returns {Promise<Object>} - Health status
   */
  checkHealth: (options = {}) => {
    return fetchFromAPI('/health', options);
  }
};

export default apiService;