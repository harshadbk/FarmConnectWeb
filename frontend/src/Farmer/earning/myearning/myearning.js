import React, { useState, useEffect } from 'react';
import './myearning.css';

const Myearning = () => {
  const [allInvest, setAllInvest] = useState([]);
  const [allEarn, setAllEarn] = useState([]);

  const fetchInvestInfo = async () => {
    try {
      const response = await fetch('http://13.233.124.185:5000/finvest');
      const data = await response.json();
      setAllInvest(data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };


  const fetchEarnInfo = async () => {
    try {
      const response = await fetch('http://13.233.124.185:5000/fearning');
      const data = await response.json();
      setAllEarn(data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  useEffect(() => {
    fetchInvestInfo();
    fetchEarnInfo(); 
  }, []);


  const totalEarnings = allEarn.reduce((acc, earning) => acc + earning.amount, 0);
  const totalInvestments = allInvest.reduce((acc, investment) => acc + investment.amount, 0);
  const totalProfit = totalEarnings - totalInvestments;

  return (
    <div className='my-earning-container'>
      <h2>Your Current Earnings</h2>
      <h3>Total Profit: ₹{totalProfit}</h3>

      <div className='earning-list'>
        <h4>Earnings:</h4>
        {allEarn.length > 0 ? (
          allEarn.map((earning) => (
            <p key={earning.id}>Earning {earning.reason}: ₹{earning.amount}</p>
          ))
        ) : (
          <p>No earnings recorded.</p>
        )}

        <h4>Investments:</h4>
        {allInvest.length > 0 ? (
          allInvest.map((investment) => (
            <p key={investment.id}>Investment {investment.reason}: ₹{investment.amount}</p>
          ))
        ) : (
          <p>No investments recorded.</p>
        )}
      </div>
    </div>
  );
};

export default Myearning;
