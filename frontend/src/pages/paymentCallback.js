import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './success.css';

const PaymentCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get('status');
  const transactionId = searchParams.get('id');

  useEffect(() => {
    if (status) {
      navigate(`/success?status=${status}&id=${encodeURIComponent(transactionId)}`);
    } else {
      navigate('/success');
    }
  }, [navigate, status, transactionId]);

  return (
    <div className='success-page'>
      <div className='success-panel'>
        <h1>Processing Payment...</h1>
        <p>Please wait while we verify your payment status.</p>
      </div>
    </div>
  );
};

export default PaymentCallback;
