/**
 * PhonePe Payment Gateway Configuration
 * 
 * Loads all PhonePe-related settings from environment variables.
 * Never expose salt_key or sensitive credentials to the frontend.
 */

require('dotenv').config();

const phonePeConfig = {
    // Merchant credentials — loaded from environment variables
    merchantId: process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT86',
    saltKey: process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',

    // PhonePe API Base URLs (with fallback hosts for resilience)
    // Production: https://api.phonepe.com/apis/hermes
    // Sandbox:    https://api-preprod.phonepe.com/apis/pg-sandbox
    baseUrls: [
        process.env.PHONEPE_BASE_URL,
        'https://api-preprod.phonepe.com/apis/pg-sandbox',
        'https://api3-preprod.phonepe.com/apis/pg-sandbox',
    ].filter(Boolean),

    // Application URLs
    backendUrl: process.env.BACKEND_URL || 'http://13.233.124.185',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Simulator/testing support (optional)
    // When `useSimulator` is true, the backend will return `simulatorUrl`
    // as the payment redirect so you can test flows without hitting the
    // real PhonePe production/sandbox endpoints.
    simulatorUrl: process.env.PHONEPE_SIMULATOR_URL || 'https://mercury-uat.phonepe.com/transact/simulator?token=n7P',
    useSimulator: process.env.PHONEPE_USE_SIMULATOR === 'true' || false,

    // PhonePe API endpoints
    endpoints: {
        pay: '/pg/v1/pay',
        status: '/pg/v1/status',
    },

    // Derived URLs
    get callbackUrl() {
        return `${this.backendUrl}/api/payment/callback`;
    },
    get redirectUrl() {
        return `${this.frontendUrl}/payment-callback`;
    },
};

module.exports = phonePeConfig;
