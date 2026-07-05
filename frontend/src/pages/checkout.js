// CheckoutPage.js
import React, { useContext, useState } from 'react';
import './checkout.css';
import { shopContext } from '../context/shopcontext';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const { allProduct, cartItem, clearCart } = useContext(shopContext);
  const navigate = useNavigate();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    user: localStorage.getItem('user-name') || '',
    name: '',
    lname: '',
    email: localStorage.getItem('user-email') || '',
    contact: '',
    payment: '',
    address: '',
    status: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const getCartData = () => {
    return allProduct
      .filter((product) => {
        const quantity = cartItem[product.id] || 0;
        return quantity > 0;
      })
      .map((product) => ({
        id: product.id,
        name: product.name,
        quantity: cartItem[product.id],
        price: product.new_price,
        image: product.image,
      }));
  };

  const cartItems = getCartData();

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const changeHandler = (e) => {
    setOrderDetails({ ...orderDetails, [e.target.name]: e.target.value });
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setOrderDetails({ ...orderDetails, payment: method.name });
  };

  const handlePlaceOrder = async () => {
    if (!orderDetails.name.trim() || !orderDetails.lname.trim() || !orderDetails.email.trim() || !orderDetails.contact.trim() || !orderDetails.address.trim()) {
      setError('Please complete all customer details before placing the order.');
      return;
    }

    if (!selectedPaymentMethod) {
      setError('Please choose a payment method.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty. Add products before checkout.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      navigate('/payment', {
        state: {
          orderDetails,
          cartItems,
          selectedPaymentMethod,
          amount: calculateSubtotal().toFixed(2),
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to continue to payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = [
    { id: 'credit-card', name: 'Credit/Debit Card' },
    { id: 'upi', name: 'UPI Payments' },
    { id: 'bank-transfer', name: 'Bank Transfer' },
    { id: 'cash-on-delivery', name: 'Cash on Delivery' },
  ];

  return (
    <div className='checkout'>
      <div className='checkout-header-left'>
        <h1>Checkout</h1>
        <p>Complete your order and choose a payment method.</p>
      </div>

      {error && <div className='checkout-error'>{error}</div>}

      <div className='checkout-details-left'>
        <form>
          <div>
            <p>First Name</p>
            <input type='text' name='name' value={orderDetails.name} onChange={changeHandler} required />
          </div>
          <div>
            <p>Last Name</p>
            <input type='text' name='lname' value={orderDetails.lname} onChange={changeHandler} required />
          </div>
          <div>
            <p>Email</p>
            <input type='email' name='email' value={orderDetails.email} onChange={changeHandler} required />
          </div>
          <div>
            <p>Contact No</p>
            <input type='text' name='contact' value={orderDetails.contact} onChange={changeHandler} required />
          </div>
          <div>
            <p>Address</p>
            <input type='text' name='address' value={orderDetails.address} onChange={changeHandler} required />
          </div>
        </form>
      </div>

      <div className='checkout-paymentInfo-left'>
        <h1>Payment Information</h1>
        <div className='checkout-data-left'>
          <form>
            <div className='checkout-paymentoption-left'>
              {paymentMethods.map((method) => (
                <label key={method.id} className='payment-option'>
                  <input
                    type='radio'
                    name='payment-method'
                    value={method.id}
                    checked={selectedPaymentMethod?.id === method.id}
                    onChange={() => handlePaymentMethodChange(method)}
                  />
                  {method.name}
                </label>
              ))}
            </div>
          </form>
        </div>
      </div>

      <div className='checkout-amount-down'>
        <h1>Order Summary</h1>
        <div className='checkout-format-down'>
          <p>Product</p>
          <p>Title</p>
          <p>Quantity</p>
          <p>Total</p>
        </div>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          cartItems.map((product) => (
            <div key={product.id} className='cartitems-format-down'>
              <img src={product.image} alt={product.name} className='carticon-product-icon' />
              <p>{product.name}</p>
              <button className='cartitems-quantity-down'>{product.quantity}</button>
              <p>₹{(product.quantity * product.price).toFixed(2)}</p>
            </div>
          ))
        )}
        <div className='checkout-summary-row'>
          <p>Subtotal</p>
          <p>₹{calculateSubtotal().toFixed(2)}</p>
        </div>
      </div>

      <div className='checkout-downside'>
        <button
          type='button'
          className='submit-button'
          onClick={handlePlaceOrder}
          disabled={saving || cartItems.length === 0}
        >
          {saving ? 'Processing...' : `Continue to Payment ₹${calculateSubtotal().toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
