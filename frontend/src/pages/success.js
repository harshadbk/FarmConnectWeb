import { useEffect, useState } from 'react';
import './success.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const transactionId = searchParams.get('id') || location.state?.transactionId;
  const statusParam = searchParams.get('status') || 'success';
  const [amount, setAmount] = useState(() => {
    const a = location.state?.amount;
    return a ? Number(a) : null;
  });
  const paymentMethod = location.state?.paymentMethod || 'Payment';
  const [message, setMessage] = useState(
    location.state?.message || (transactionId ? 'Payment recorded. Thank you!' : 'Your order was placed successfully.')
  );
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    if (!location.state && !transactionId) {
      navigate('/');
      return;
    }

    if (transactionId) {
      paymentAPI.getPaymentStatus(transactionId)
        .then((data) => {
          const successStatus =
            data?.success === true ||
            data?.paymentStatus === 'SUCCESS';

          setVerified(successStatus ? 'success' : 'failed');
          setMessage(
            successStatus
              ? 'Payment was successfully verified with the gateway.'
              : 'Payment verification failed. Please contact support if your order was charged.'
          );

          // If the status API returns an amount (in INR), update the displayed amount
          if (data?.amount) {
            setAmount(Number(data.amount));
          }
        })
        .catch(() => {
          setVerified(statusParam);
          setMessage('Unable to verify payment status right now. Please check again later.');
        });
    }
  }, [location.state, navigate, statusParam, transactionId]);

  const displayTitle = verified === 'failed' ? 'Payment Failed' : 'Payment Successful!';

  return (
    <div className='success-page'>
      <div className='success-panel'>
        <h1>{displayTitle}</h1>
        <p>
          Thank you for shopping with <strong>Farm Connect</strong>.
          Your order has been processed.
        </p>
        <div className='success-summary'>
          <p>{message}</p>
          <p><strong>Amount Paid:</strong> ₹{amount}</p>
          <p><strong>Payment Method:</strong> {paymentMethod}</p>
          {transactionId && (
            <p><strong>Transaction ID:</strong> {transactionId}</p>
          )}
        </div>
        <button className='success-button' onClick={() => navigate('/')}>
          Continue Shopping →
        </button>
      </div>
    </div>
  );
};

export default Success;
