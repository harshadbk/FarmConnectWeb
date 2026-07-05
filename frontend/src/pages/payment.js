import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './payment.css';
import { paymentAPI, orderAPI } from '../services/api';
import { shopContext } from '../context/shopcontext';

/**
 * Payment Page Component
 * 
 * This page handles the payment flow:
 * 1. Displays order summary (amount, payment method)
 * 2. For PhonePe/UPI: Calls backend to initiate PhonePe payment, then redirects to PhonePe
 * 3. For Credit Card: Validates card number, saves order, navigates to success
 * 4. For COD: Saves order directly, navigates to success
 * 
 * The PhonePe flow:
 *   Frontend → POST /api/payment/initiate → Backend generates checksum → PhonePe API
 *   → User redirected to PhonePe payment page → After payment → PhonePe calls callback
 *   → Backend verifies with Status API → Redirects to frontend /payment-callback
 */
const Payment = () => {
  const { clearCart } = useContext(shopContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  // Get data passed from checkout page
  const orderDetails = location.state?.orderDetails;
  const cartItems = location.state?.cartItems || [];
  const selectedPaymentMethod = location.state?.selectedPaymentMethod;
  const amount = location.state?.amount || 0;
  const paymentMethod = selectedPaymentMethod?.name || 'Selected Payment Method';

  // Redirect to checkout if data is missing
  useEffect(() => {
    if (!orderDetails || !selectedPaymentMethod || cartItems.length === 0) {
      navigate('/checkout');
    }
  }, [orderDetails, selectedPaymentMethod, cartItems.length, navigate]);

  /**
   * Handle PhonePe/UPI Payment
   * 
   * Steps:
   * 1. Call backend POST /api/payment/initiate with amount and customer details
   * 2. Backend generates checksum, sends to PhonePe, returns payment URL
   * 3. Save the order to MongoDB with merchantTransactionId and status PENDING
   * 4. Redirect user to PhonePe payment page
   * 5. After payment, PhonePe redirects back to our callback URL
   */
  const handlePhonePePayment = async () => {
    try {
      // Step 1: Call backend to initiate PhonePe payment
      const paymentResult = await paymentAPI.initiatePayment({
        amount: Number(amount),
        userId: orderDetails.email,
        name: `${orderDetails.name} ${orderDetails.lname}`,
        mobile: String(orderDetails.contact),
      });

      if (!paymentResult.success || !paymentResult.paymentUrl) {
        throw new Error(paymentResult.error || 'Failed to get payment URL from PhonePe');
      }

      // Step 2: Save order to MongoDB with PENDING status and merchantTransactionId
      const orderPayload = {
        ...orderDetails,
        payment: paymentMethod,
        cartdata: cartItems,
        status: false, // Payment not yet confirmed
        merchantTransactionId: paymentResult.merchantTransactionId,
        paymentStatus: 'PENDING',
        paymentMethod: 'PhonePe',
        amount: Number(amount),
      };

      await orderAPI.createOrder(orderPayload);

      // Step 3: Redirect to PhonePe payment page
      // PhonePe will handle the actual payment and redirect back to our callback
      window.location.assign(paymentResult.paymentUrl);

    } catch (err) {
      console.error('PhonePe payment error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setSaving(false);
    }
  };

  /**
   * Handle form submission for all payment methods
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Handle Credit/Debit Card payment
      if (selectedPaymentMethod?.id === 'credit-card') {
        const rawCard = cardNumber.replace(/\s+/g, '');
        if (!rawCard || rawCard.length < 12 || rawCard.length > 19 || !/^\d+$/.test(rawCard)) {
          setError('Please enter a valid debit/credit card number before proceeding.');
          setSaving(false);
          return;
        }

        const orderPayload = {
          ...orderDetails,
          payment: paymentMethod,
          cartdata: cartItems,
          status: true,
          paymentStatus: 'SUCCESS',
          paymentMethod: 'Credit/Debit Card',
          amount: Number(amount),
        };

        const response = await orderAPI.createOrder(orderPayload);
        if (!response.success) {
          throw new Error(response.error || 'Order save failed');
        }

        clearCart();
        navigate('/success', {
          state: {
            amount: amount.toString(),
            paymentMethod,
            paymentStatus: 'SUCCESS',
            message: 'Payment successful via Credit/Debit Card',
          },
        });
        return;
      }

      // Handle PhonePe / UPI payment
      if (selectedPaymentMethod?.id === 'phonepe' || selectedPaymentMethod?.id === 'upi') {
        await handlePhonePePayment();
        return;
      }

      // Handle Cash on Delivery
      if (selectedPaymentMethod?.id === 'cash-on-delivery') {
        const orderPayload = {
          ...orderDetails,
          payment: paymentMethod,
          cartdata: cartItems,
          status: false,
          paymentStatus: 'PENDING',
          paymentMethod: 'Cash on Delivery',
          amount: Number(amount),
        };

        const response = await orderAPI.createOrder(orderPayload);
        if (!response.success) {
          throw new Error(response.error || 'Order save failed');
        }

        clearCart();
        navigate('/success', {
          state: {
            amount: amount.toString(),
            paymentMethod,
            paymentStatus: 'SUCCESS',
            message: 'Order placed successfully with Cash on Delivery',
          },
        });
        return;
      }

      // Handle Bank Transfer
      const orderPayload = {
        ...orderDetails,
        payment: paymentMethod,
        cartdata: cartItems,
        status: false,
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod,
        amount: Number(amount),
      };

      const response = await orderAPI.createOrder(orderPayload);
      if (!response.success) {
        throw new Error(response.error || 'Order save failed');
      }

      navigate('/success', {
        state: {
          amount: amount.toString(),
          paymentMethod,
          paymentStatus: 'PENDING',
          message: 'Order placed. Please complete the bank transfer.',
        },
      });

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='payment-page'>
      <div className='payment-panel'>
        <h2>Confirm Your Payment</h2>
        <p className='payment-label'>Amount</p>
        <p className='payment-value'>₹{amount}</p>
        <p className='payment-label'>Method</p>
        <p className='payment-value'>{paymentMethod}</p>

        {/* Credit/Debit Card input */}
        {selectedPaymentMethod?.id === 'credit-card' && (
          <div className='payment-field'>
            <label className='payment-label' htmlFor='cardNumber'>Debit/Credit Card Number</label>
            <input
              id='cardNumber'
              type='text'
              inputMode='numeric'
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              placeholder='Enter your card number'
              className='payment-input'
            />
          </div>
        )}

        {/* PhonePe / UPI info box */}
        {(selectedPaymentMethod?.id === 'phonepe' || selectedPaymentMethod?.id === 'upi') && (
          <div className='payment-phonepe-box'>
            <div className='phonepe-icon-wrap'>
              <span className='phonepe-icon'>📱</span>
            </div>
            <p className='payment-label' style={{ textTransform: 'none', marginTop: '12px' }}>
              You will be redirected to <strong>PhonePe</strong> to complete your payment securely.
            </p>
            <div className='phonepe-features'>
              <span>✅ UPI</span>
              <span>✅ Debit Card</span>
              <span>✅ Credit Card</span>
              <span>✅ Net Banking</span>
            </div>
            <p className='payment-note'>
              Powered by <strong>PhonePe Payment Gateway</strong>
            </p>
          </div>
        )}

        {/* Error message */}
        {error && <div className='payment-error'>{error}</div>}

        {/* Submit button */}
        <form onSubmit={handleSubmit}>
          <button type='submit' className='payment-button' disabled={saving}>
            {saving
              ? 'Processing...'
              : selectedPaymentMethod?.id === 'phonepe' || selectedPaymentMethod?.id === 'upi'
                ? `Pay ₹${amount} with PhonePe`
                : 'Confirm Payment'
            }
          </button>
        </form>

        {/* Back button */}
        <button className='payment-back' onClick={() => navigate('/checkout')}>
          Back to Checkout
        </button>
      </div>
    </div>
  );
};

export default Payment;
