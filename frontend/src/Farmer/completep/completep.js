import { useState, useEffect } from 'react';
import './completep.css'; 

const Completep = () => {
    const [completedOrders, setCompletedOrders] = useState([]);

    const fetchCompletedOrders = async () => {
        try {
            const response = await fetch('http://13.233.124.185/fcompletep', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: localStorage.getItem('user-name') }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setCompletedOrders(data);
        } catch (error) {
            console.error('Error fetching completed orders:', error);
        }
    };

    useEffect(() => {
        fetchCompletedOrders();
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
        <div className="complete-orders-container">
            <h1>All Completed Sold Products</h1>
            <div className="orders-header">
                <p>Name</p>
                <p>Email</p>
                <p>Fertilizers Used</p>
                <p>Image</p>
                <p>Quantity</p>
                <p>Quality</p>
                <p>Location</p>
                <p>Price</p>
                <p>Harvest Date</p>
                <p>Expire Date</p>
            </div>
            <div className="orders-list">
                {completedOrders.map((order, index) => (
                    <div key={index} className='order-item'>
                        <p>{order.name}</p>
                        <p>{order.email}</p>
                        <p>{order.fertilizersused}</p>
                        <img src={order.image} alt={order.name} className="order-image" />
                        <p>{order.quantity}</p>
                        <p>{order.quality}</p>
                        <p>{order.location}</p>
                        <p>{order.price}</p>
                        <p>{formatDate(order.harverstD)}</p>
                        <p>{formatDate(order.expireD)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Completep;
