/**
 * Payment Service
 * 
 * Business logic for PhonePe payment operations.
 * Handles payment initiation, status checking, and callback processing.
 * Interacts with PhonePe APIs through utility functions and updates MongoDB orders.
 */

const phonePeConfig = require('../config/phonepe.config');
const {
    generateTransactionId,
    encodePayload,
    decodePayload,
    generateChecksum,
    generateStatusChecksum,
    requestPhonePe,
    extractPaymentUrl,
} = require('../utils/phonepe.utils');

/**
 * Initiate a PhonePe payment
 * 
 * Steps:
 * 1. Validate input amount and fields
 * 2. Generate a unique merchant transaction ID
 * 3. Build the payment payload per PhonePe spec
 * 4. Base64 encode the payload
 * 5. Generate SHA256 checksum: SHA256(base64Payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
 * 6. Send the request to PhonePe Pay API
 * 7. Extract and return the redirect URL
 * 
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in INR (will be converted to paise)
 * @param {string} params.userId - Merchant user ID (e.g., email)
 * @param {string} params.name - Customer name
 * @param {string} params.mobile - Customer mobile number
 * @param {string} [params.orderId] - Optional order reference ID
 * @returns {Object} { success, merchantTransactionId, paymentUrl, phonePeResponse }
 */
const initiatePayment = async ({ amount, userId, name, mobile, orderId }) => {
    // Validate amount (must be positive number, at least ₹1)
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
        throw new Error('Invalid amount. Minimum payment is ₹1.');
    }

    // Validate required fields
    if (!userId || !name || !mobile) {
        throw new Error('Missing required fields: userId, name, and mobile are required.');
    }

    // Generate unique transaction ID
    const merchantTransactionId = generateTransactionId();

    // Build the PhonePe payment payload
    // Amount must be in paise (multiply by 100)
    const payload = {
        merchantId: phonePeConfig.merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: Math.round(numericAmount * 100), // Convert to paise
        redirectUrl: `${phonePeConfig.callbackUrl}?id=${merchantTransactionId}`,
        redirectMode: 'REDIRECT',
        callbackUrl: `${phonePeConfig.callbackUrl}?id=${merchantTransactionId}`,
        mobileNumber: String(mobile),
        paymentInstrument: {
            type: 'PAY_PAGE',
        },
    };

    // Base64 encode the payload
    const base64Payload = encodePayload(payload);

    // Generate checksum: SHA256(base64Payload + apiPath + saltKey) + "###" + saltIndex
    const apiPath = phonePeConfig.endpoints.pay;
    const checksum = generateChecksum(base64Payload, apiPath);

    console.log(`[PaymentService] Initiating payment:`, {
        merchantTransactionId,
        amount: numericAmount,
        amountInPaise: Math.round(numericAmount * 100),
        userId,
    });

    // Make the API request to PhonePe
    const response = await requestPhonePe('POST', apiPath, { request: base64Payload }, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
    });

    const responseData = response.data;

    // Extract payment URL from the response (if any)
    let paymentUrl = extractPaymentUrl(responseData);

    // If simulator mode is enabled, prefer building a simulator redirect URL
    if (phonePeConfig.useSimulator && phonePeConfig.simulatorUrl) {
        // Ensure callback contains the merchantTransactionId so our callback can verify
        const cb = encodeURIComponent(`${phonePeConfig.callbackUrl}?id=${merchantTransactionId}`);
        paymentUrl = phonePeConfig.simulatorUrl.includes('?')
            ? `${phonePeConfig.simulatorUrl}&callback=${cb}`
            : `${phonePeConfig.simulatorUrl}?callback=${cb}`;
        console.log('[PaymentService] Using simulator payment URL for testing:', paymentUrl);
    }

    if (!paymentUrl) {
        console.error('[PaymentService] No payment URL in response:', JSON.stringify(responseData, null, 2));
        throw new Error('PhonePe did not return a payment URL. Please try again.');
    }

    console.log(`[PaymentService] Payment initiated successfully:`, {
        merchantTransactionId,
        paymentUrl: paymentUrl.substring(0, 60) + '...',
    });

    return {
        success: true,
        merchantTransactionId,
        paymentUrl,
        phonePeResponse: responseData,
    };
};

/**
 * Check the status of a PhonePe payment
 * 
 * Steps:
 * 1. Build the status API path: /pg/v1/status/{merchantId}/{merchantTransactionId}
 * 2. Generate checksum: SHA256(statusPath + saltKey) + "###" + saltIndex
 * 3. Make GET request to PhonePe Status API
 * 4. Parse and return the status
 * 
 * @param {string} merchantTransactionId - The transaction ID to check
 * @returns {Object} { success, code, paymentStatus, transactionId, amount, paymentMethod, phonePeResponse }
 */
const checkPaymentStatus = async (merchantTransactionId) => {
    if (!merchantTransactionId) {
        throw new Error('Transaction ID is required to check payment status.');
    }

    const { merchantId } = phonePeConfig;
    const statusPath = `${phonePeConfig.endpoints.status}/${merchantId}/${merchantTransactionId}`;

    // Generate checksum for status API
    const checksum = generateStatusChecksum(merchantTransactionId);

    console.log(`[PaymentService] Checking status for: ${merchantTransactionId}`);

    const response = await requestPhonePe('GET', statusPath, null, {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
    });

    const responseData = response.data;

    // Determine payment status from the response
    const isSuccess =
        responseData?.success === true &&
        (responseData?.code === 'PAYMENT_SUCCESS' ||
         responseData?.data?.state === 'COMPLETED' ||
         responseData?.data?.responseCode === 'SUCCESS');

    const isPending =
        responseData?.code === 'PAYMENT_PENDING' ||
        responseData?.data?.state === 'PENDING';

    let paymentStatus = 'FAILED';
    if (isSuccess) paymentStatus = 'SUCCESS';
    else if (isPending) paymentStatus = 'PENDING';

    console.log(`[PaymentService] Status result for ${merchantTransactionId}: ${paymentStatus}`);

    return {
        success: isSuccess,
        code: responseData?.code || 'UNKNOWN',
        paymentStatus,
        transactionId: responseData?.data?.transactionId || null,
        merchantTransactionId,
        amount: responseData?.data?.amount ? responseData.data.amount / 100 : null, // Convert paise to INR
        paymentMethod: responseData?.data?.paymentInstrument?.type || 'PhonePe',
        phonePeResponse: responseData,
    };
};

/**
 * Process the payment callback from PhonePe
 * 
 * Steps:
 * 1. Extract merchantTransactionId from callback data
 * 2. Verify the payment status using PhonePe Status API (prevents fake callbacks)
 * 3. Return the verified status
 * 
 * @param {Object} req - Express request object (contains body and query)
 * @returns {Object} { merchantTransactionId, isSuccess, statusData }
 */
const processCallback = async (req) => {
    let merchantTransactionId = null;

    // Extract transaction ID from various callback formats
    if (req.body?.response) {
        // PhonePe sends Base64 encoded response in POST callbacks
        try {
            const decodedResponse = decodePayload(req.body.response);
            merchantTransactionId = decodedResponse?.data?.merchantTransactionId;
        } catch (decodeError) {
            console.error('[PaymentService] Failed to decode callback response:', decodeError.message);
        }
    }

    // Fallback: check query params and body directly
    if (!merchantTransactionId) {
        merchantTransactionId =
            req.query?.id ||
            req.body?.merchantTransactionId ||
            req.query?.transactionId;
    }

    if (!merchantTransactionId) {
        throw new Error('Could not extract transaction ID from callback.');
    }

    console.log(`[PaymentService] Processing callback for: ${merchantTransactionId}`);

    // CRITICAL: Always verify with PhonePe Status API
    // Never trust the callback data alone — this prevents fake payment attacks
    const statusData = await checkPaymentStatus(merchantTransactionId);

    return {
        merchantTransactionId,
        isSuccess: statusData.success,
        statusData,
    };
};

module.exports = {
    initiatePayment,
    checkPaymentStatus,
    processCallback,
};
