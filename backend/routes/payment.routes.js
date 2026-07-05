/**
 * Payment Routes
 * 
 * Express router for all PhonePe payment endpoints.
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Initiate a new PhonePe payment
router.post('/initiate', paymentController.initiatePayment);

// PhonePe callback — handles both GET (redirect) and POST (server-to-server)
router.get('/callback', paymentController.handleCallback);
router.post('/callback', paymentController.handleCallback);

// Check payment status
router.get('/status/:merchantTransactionId', paymentController.checkStatus);

module.exports = router;
