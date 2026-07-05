import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const transactionId = searchParams.get('id') || location.state?.transactionId;
  const amount = location.state?.amount || '0.00';
  const paymentMethod = location.state?.paymentMethod || 'Payment';
  const message = location.state?.message || (transactionId ? 'Payment recorded. Thank you!' : 'Your order was placed successfully.');

  useEffect(() => {
    if (!location.state && !transactionId) {
      navigate('/');
    }
  }, [location.state, navigate, transactionId]);

  return (
    <div className='success-page'>
      <div className='success-panel'>
        <h1>Payment Successful!</h1>
        <p>Your order was placed successfully.</p>
        <div className='success-summary'>
          <p>{message}</p>
          <p><strong>Amount Paid:</strong> ₹{amount}</p>
          <p><strong>Payment Method:</strong> {paymentMethod}</p>
          {transactionId && <p><strong>Transaction ID:</strong> {transactionId}</p>}
        </div>
        <button className='success-button' onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default Success;
