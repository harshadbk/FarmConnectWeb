import React, { useState } from 'react';
import './addearning.css';

const AddMyEarning = () => {
  const [message, setMessage] = useState('');
    const [earning, setEarning] = useState({
        email: localStorage.getItem('user-name'),
        type: "Earn",
        reason: "",
        amount: 0,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEarning({ ...earning, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(earning);
        await fetch('http://13.233.124.185:5000/income', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(earning),
        })
        .then((resp) => resp.json())
        .then((data) => {
            console.log(data);
            if (data.success) {
                setMessage('Earning added successfully!');

                setEarning({
                    email: localStorage.getItem('user-name'),
                    type: "Invest",
                    reason: "",
                    amount: 0,
                });
            } else {
                alert("Failed");
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("An error occurred while adding the investment.");
        });
    };


  return (
    <div className="add-earning-container">
      <h2>Add Your Earning</h2>
      <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="reason"
                    placeholder='Reason Of earning'
                    value={earning.reason}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="number"
                    name="amount"
                    value={earning.amount}
                    onChange={handleInputChange}
                    placeholder="Enter your Investing amount"
                    required
                />
                <button type="submit">Add Earning</button>
            </form>
            {message && <p className="success-message">{message}</p>}
    </div>
  );
};

export default AddMyEarning;
