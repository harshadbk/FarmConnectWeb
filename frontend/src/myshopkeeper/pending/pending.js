import React, { useEffect, useState} from 'react';
import './pending.css';

const Pending = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [showCartIndex, setShowCartIndex] = useState(null);

  const fetchInfo = async () => {

    await fetch('http://13.233.124.185/spending', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: localStorage.getItem('user-name') })
    })
      .then((resp) => resp.json())
      .then((data) => setAllOrders(data));
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };
  return (
    <div className='listpendingorders'>
      <h1>All Pending Orders</h1>
      <br />
      <div className="listpendingorders-format-main">
        <p>Order Id</p>
        <p>Name</p>
        <p>Email</p>
        <p>Contact No</p>
        <p>Payment Method</p>
        <p>Address</p>
        <p>Cart Data</p>
        <p>Date</p>
      </div>
      <div className="listpendingorders-allproduct">
        {allOrders.map((order, index) => (
          <div key={index} className='listpendingorders-format'>
            <p>{order.id}</p>
            <p>{order.name} {order.lname}</p>
            <p>{order.email}</p>
            <p>{order.contact}</p>
            <p>{order.payment}</p>
            <p>{order.address}</p>
            <div className='cart-item-list'>
              <button onClick={() => setShowCartIndex(index === showCartIndex ? null : index)}>
                {index === showCartIndex ? 'Hide Cart' : 'Show Cart'}
              </button>
              {index === showCartIndex && (
                <div className='cart-data'>
                  {order.cartdata.map((item, i) => (
                    <div key={i} className='cart-item'>
                      <span className='cart-item-title'>{item.name}</span>
                      <br />
                      <span className='cart-item-quantity'>Quantity: {item.quantity}</span>
                      <br />
                      <span className='cart-item-price'>Price: {item.price}</span>
                      <br />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p>{formatDate(order.date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pending;
