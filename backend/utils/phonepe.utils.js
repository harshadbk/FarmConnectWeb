/**
 * PhonePe Utility Functions
 * 
 * Provides SHA256 checksum generation, Base64 encoding,
 * transaction ID generation, and resilient HTTP requests to PhonePe APIs.
 * 
 * SECURITY: The salt key is used only server-side for checksum generation.
 * It must NEVER be sent to the frontend.
 */

const crypto = require('crypto');
const axios = require('axios');
const phonePeConfig = require('../config/phonepe.config');

/**
 * Generate a unique merchant transaction ID
 * Format: FC_<timestamp>_<random6chars>
 * @returns {string} Unique transaction ID
 */
const generateTransactionId = () => {
    const timestamp = Date.now();
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `FC_${timestamp}_${randomPart}`;
};

/**
 * Base64 encode a JSON payload
 * @param {Object} payload - The JSON object to encode
 * @returns {string} Base64 encoded string
 */
const encodePayload = (payload) => {
    const jsonString = JSON.stringify(payload);
    return Buffer.from(jsonString).toString('base64');
};

/**
 * Decode a Base64 encoded payload back to JSON
 * @param {string} base64String - The Base64 encoded string
 * @returns {Object} Decoded JSON object
 */
const decodePayload = (base64String) => {
    const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
    return JSON.parse(jsonString);
};

/**
 * Generate SHA256 checksum for PhonePe API requests
 * 
 * For PAY API:
 *   checksum = SHA256(base64EncodedPayload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
 * 
 * For STATUS API:
 *   checksum = SHA256("/pg/v1/status/{merchantId}/{merchantTransactionId}" + saltKey) + "###" + saltIndex
 * 
 * @param {string} payload - Base64 encoded payload (for pay) or API path (for status)
 * @param {string} apiPath - The API endpoint path (e.g., "/pg/v1/pay")
 * @returns {string} Complete checksum string with salt index
 */
const generateChecksum = (payload, apiPath = '') => {
    const { saltKey, saltIndex } = phonePeConfig;
    const stringToHash = `${payload}${apiPath}${saltKey}`;
    const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return `${sha256Hash}###${saltIndex}`;
};

/**
 * Generate checksum specifically for the Status API
 * The status API uses the path itself as the "payload" for checksumming
 * 
 * @param {string} merchantTransactionId - The merchant transaction ID to check
 * @returns {string} Complete checksum string
 */
const generateStatusChecksum = (merchantTransactionId) => {
    const { merchantId, saltKey, saltIndex } = phonePeConfig;
    const statusPath = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const stringToHash = `${statusPath}${saltKey}`;
    const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return `${sha256Hash}###${saltIndex}`;
};

/**
 * Make a resilient HTTP request to PhonePe APIs
 * Tries multiple base URLs in sequence for DNS/availability failover
 * 
 * @param {string} method - HTTP method (GET, POST)
 * @param {string} path - API endpoint path
 * @param {Object|null} data - Request body data
 * @param {Object} headers - Request headers
 * @returns {Object} Axios response object
 * @throws {Error} Last encountered error if all URLs fail
 */
const requestPhonePe = async (method, path, data = null, headers = {}) => {
    let lastError = null;
    const { baseUrls } = phonePeConfig;

    for (const baseUrl of baseUrls) {
        try {
            const url = `${baseUrl}${path}`;
            console.log(`[PhonePe] Requesting ${method} ${url}`);
            const response = await axios({
                method,
                url,
                headers,
                data,
                timeout: 30000, // 30 second timeout
            });
            return response;
        } catch (err) {
            lastError = err;
            // Only retry on DNS/network errors, not on API errors
            if (!['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT'].includes(err.code)) {
                throw err;
            }
            console.warn(`[PhonePe] Host unavailable: ${baseUrl} (${err.code}). Trying next...`);
        }
    }

    throw lastError;
};

/**
 * Extract payment URL from PhonePe response
 * PhonePe may return the URL in different nested locations
 * 
 * @param {Object} responseData - PhonePe API response data
 * @returns {string|null} The payment redirect URL, or null if not found
 */
const extractPaymentUrl = (responseData) => {
    // Check common locations first
    const directUrl =
        responseData?.data?.instrumentResponse?.redirectInfo?.url ||
        responseData?.data?.paymentUrl ||
        responseData?.data?.redirectUrl ||
        responseData?.paymentUrl ||
        responseData?.redirectUrl;

    if (directUrl) return directUrl;

    // Deep search fallback — recursively find any URL in the response
    const findUrl = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (typeof value === 'string' && value.startsWith('http')) {
                return value;
            }
            if (typeof value === 'object') {
                const nested = findUrl(value);
                if (nested) return nested;
            }
        }
        return null;
    };

    return findUrl(responseData);
};

module.exports = {
    generateTransactionId,
    encodePayload,
    decodePayload,
    generateChecksum,
    generateStatusChecksum,
    requestPhonePe,
    extractPaymentUrl,
};
