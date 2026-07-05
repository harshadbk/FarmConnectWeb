import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './payment.css';
import { paymentAPI, orderAPI } from '../services/api';
import { shopContext } from '../context/shopcontext';

const Payment = () => {
  const { clearCart } = useContext(shopContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const orderDetails = location.state?.orderDetails;
  const cartItems = location.state?.cartItems || [];
  const selectedPaymentMethod = location.state?.selectedPaymentMethod;
  const amount = location.state?.amount || 0;
  const paymentMethod = selectedPaymentMethod?.name || 'Selected Payment Method';

  useEffect(() => {
    if (!orderDetails || !selectedPaymentMethod || cartItems.length === 0) {
      navigate('/checkout');
    }
  }, [orderDetails, selectedPaymentMethod, cartItems.length, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const orderPayload = {
        ...orderDetails,
        payment: paymentMethod,
        cartdata: cartItems,
        status: false,
      };

      if (selectedPaymentMethod?.id !== 'cash-on-delivery') {
        const transactionId = `txn_${Date.now()}`;
        const paymentResponse = await paymentAPI.createPhonePeOrder({
          MUID: orderDetails.email,
          transactionId,
          amount: Number(amount),
          name: `${orderDetails.name} ${orderDetails.lname}`,
          mobile: orderDetails.contact,
        });

        orderPayload.transactionId = transactionId;
        const paymentData = paymentResponse?.data || paymentResponse || {};
        const paymentUrl = paymentData.paymentUrl || paymentData.redirectUrl || paymentData.data?.paymentUrl || paymentData.data?.redirectUrl;

        if (paymentUrl) {
          await orderAPI.createOrder(orderPayload);
          window.location.assign(paymentUrl);
          return;
        }

        if (paymentData.success === false) {
          throw new Error(paymentData.error || paymentData.message || 'Payment initiation failed');
        }
      }

      const response = await orderAPI.createOrder(orderPayload);
      if (!response.success) {
        throw new Error(response.error || 'Order save failed');
      }

      if (selectedPaymentMethod?.id === 'cash-on-delivery') {
        clearCart();
      }

      navigate('/success', {
        state: {
          amount: amount.toString(),
          paymentMethod,
          transactionId: orderPayload.transactionId || null,
          message: selectedPaymentMethod?.id === 'cash-on-delivery' ? 'Order placed with Cash on Delivery' : 'Payment initiated successfully',
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

        {error && <div className='payment-error'>{error}</div>}

        <form onSubmit={handleSubmit}>
          <button type='submit' className='payment-button' disabled={saving}>
            {saving ? 'Processing...' : 'Confirm Payment'}
          </button>
        </form>

        <button className='payment-back' onClick={() => navigate('/checkout')}>
          Back to Checkout
        </button>
      </div>
    </div>
  );
};

export default Payment;
