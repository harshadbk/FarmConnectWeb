/**
 * Payment Controller
 * 
 * Handles HTTP request/response for PhonePe payment operations.
 * Delegates business logic to payment.service.js
 * Updates MongoDB Order records with payment status.
 */

const paymentService = require('../services/payment.service');
const phonePeConfig = require('../config/phonepe.config');

/**
 * POST /api/payment/initiate
 * 
 * Initiates a PhonePe payment and returns the redirect URL.
 * The frontend should redirect the user to this URL to complete payment.
 * 
 * Request Body:
 *   - amount: number (in INR)
 *   - userId: string (customer email/identifier)
 *   - name: string (customer name)
 *   - mobile: string (customer mobile number)
 *   - orderId: string (optional, for reference)
 * 
 * Response:
 *   - success: boolean
 *   - merchantTransactionId: string
 *   - paymentUrl: string (PhonePe redirect URL)
 */
const initiatePayment = async (req, res) => {
    try {
        const { amount, userId, name, mobile, orderId } = req.body;

        // Validate required fields
        if (!amount || !userId || !name || !mobile) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, userId, name, and mobile are required.',
            });
        }

        // Validate amount is a positive number
        if (isNaN(Number(amount)) || Number(amount) < 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount. Must be at least ₹1.',
            });
        }

        // Initiate the payment through the service
        const result = await paymentService.initiatePayment({
            amount: Number(amount),
            userId,
            name,
            mobile: String(mobile),
            orderId,
        });

        return res.json({
            success: true,
            merchantTransactionId: result.merchantTransactionId,
            paymentUrl: result.paymentUrl,
        });

    } catch (error) {
        console.error('[PaymentController] Initiate payment error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message || 'Payment initiation failed.',
        });
    }
};

/**
 * GET/POST /api/payment/callback
 * 
 * Handles the callback from PhonePe after payment completion.
 * This endpoint is called by PhonePe's servers (server-to-server callback)
 * AND used as the redirect URL when customer returns from PhonePe.
 * 
 * Steps:
 * 1. Extract transaction ID from callback
 * 2. Verify payment status via PhonePe Status API
 * 3. Update order in MongoDB
 * 4. Redirect user to frontend success/failure page
 */
const handleCallback = async (req, res) => {
    try {
        // Process and verify the callback with PhonePe
        const { merchantTransactionId, isSuccess, statusData } = await paymentService.processCallback(req);

        // Dynamically require mongoose to get the Orders model
        // This avoids circular dependency issues
        const mongoose = require('mongoose');
        const Orders = mongoose.model('Orders');

        // Update the order in MongoDB with payment result
        const updateData = {
            paymentStatus: isSuccess ? 'SUCCESS' : 'FAILED',
            transactionId: statusData.transactionId || null,
            merchantTransactionId: merchantTransactionId,
            paymentResponse: JSON.stringify(statusData.phonePeResponse),
            paymentMethod: statusData.paymentMethod || 'PhonePe',
            paymentDate: new Date(),
            status: isSuccess, // true = paid, false = unpaid
        };

        const updatedOrder = await Orders.findOneAndUpdate(
            { merchantTransactionId: merchantTransactionId },
            updateData,
            { new: true }
        );

        if (updatedOrder) {
            console.log(`[PaymentController] Order updated: ${merchantTransactionId} -> ${updateData.paymentStatus}`);
        } else {
            console.warn(`[PaymentController] No order found with merchantTransactionId: ${merchantTransactionId}`);
        }

        // Redirect user to a backend-served callback page which then
        // displays the result and offers a link to the frontend success route.
        // This prevents "connection refused" errors when the frontend dev
        // server is not running on the client machine.
        const statusParam = isSuccess ? 'success' : 'failed';
        const redirectUrl = `${phonePeConfig.backendUrl}/payment-callback?status=${statusParam}&id=${encodeURIComponent(merchantTransactionId)}`;

        return res.redirect(redirectUrl);

    } catch (error) {
        console.error('[PaymentController] Callback error:', error.response?.data || error.message);

        // Even on error, redirect user to frontend with failure status
        const transactionId = req.query?.id || req.body?.merchantTransactionId || 'unknown';
        const redirectUrl = `${phonePeConfig.backendUrl}/payment-callback?status=failed&id=${encodeURIComponent(transactionId)}`;

        return res.redirect(redirectUrl);
    }
};

/**
 * GET /api/payment/status/:merchantTransactionId
 * 
 * Check the current status of a payment.
 * Called by the frontend to verify payment after redirect.
 * 
 * Response:
 *   - success: boolean
 *   - paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING'
 *   - transactionId: string (PhonePe transaction ID)
 *   - merchantTransactionId: string
 *   - amount: number (in INR)
 *   - paymentMethod: string
 */
const checkStatus = async (req, res) => {
    try {
        const { merchantTransactionId } = req.params;

        if (!merchantTransactionId) {
            return res.status(400).json({
                success: false,
                error: 'merchantTransactionId is required.',
            });
        }

        // Check status with PhonePe
        const statusData = await paymentService.checkPaymentStatus(merchantTransactionId);

        // Also update the order in MongoDB if status has changed
        try {
            const mongoose = require('mongoose');
            const Orders = mongoose.model('Orders');

            await Orders.findOneAndUpdate(
                { merchantTransactionId: merchantTransactionId },
                {
                    paymentStatus: statusData.paymentStatus,
                    transactionId: statusData.transactionId || null,
                    paymentResponse: JSON.stringify(statusData.phonePeResponse),
                    paymentMethod: statusData.paymentMethod || 'PhonePe',
                    paymentDate: new Date(),
                    status: statusData.success,
                },
                { new: true }
            );
        } catch (dbError) {
            console.warn('[PaymentController] Order update on status check failed:', dbError.message);
        }

        return res.json({
            success: statusData.success,
            paymentStatus: statusData.paymentStatus,
            transactionId: statusData.transactionId,
            merchantTransactionId: statusData.merchantTransactionId,
            amount: statusData.amount,
            paymentMethod: statusData.paymentMethod,
        });

    } catch (error) {
        console.error('[PaymentController] Status check error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to check payment status.',
        });
    }
};

module.exports = {
    initiatePayment,
    handleCallback,
    checkStatus,
};
