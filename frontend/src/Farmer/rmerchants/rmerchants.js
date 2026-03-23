import React, { useState, useEffect } from 'react';
import './rmerchants.css';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Rmerchants = () => {
  const [merchants, setMerchants] = useState([]);
  const [userLocation, setUserLocation] = useState([]);
  const [nearbyMerchants, setNearbyMerchants] = useState([]);

  const fetchMerchants = async () => {
    try {
      const merchantResponse = await fetch('http://127.0.0.1:5000/rmerchants');
      const merchantData = await merchantResponse.json();
      setMerchants(merchantData);
    } catch (error) {
      console.error('Error fetching merchants:', error);
    }
  };

  const fetchUserLocation = async () => {
    try {
      const locationResponse = await fetch('http://localhost:5000/merchantuser');
      const locationData = await locationResponse.json();
      setUserLocation(locationData);
    } catch (error) {
      console.error('Error fetching user location:', error);
    }
  };

  const findNearbyMerchants = (userLat, userLon) => {
    const maxDistance = 200;
    const nearby = userLocation.filter((merchant) => {
      const distance = getDistance(userLat, userLon, merchant.latitude, merchant.longitude);
      return distance <= maxDistance;
    });
    setNearbyMerchants(nearby.slice(0, 20));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const userLatitude = position.coords.latitude;
      const userLongitude = position.coords.longitude;
      findNearbyMerchants(userLatitude, userLongitude);
    });
  }, [userLocation]);

  useEffect(() => {
    fetchMerchants();
    fetchUserLocation();
  }, []);

  const matchMerchants = () => {
    return merchants.filter((merchant) =>
      nearbyMerchants.some((nearby) => nearby.email === merchant.email)
    );
  };

  return (
    <div className="rmerchants-container">
      <h1>Nearby Merchants</h1>
      <div className="rmerchants-header">
        <p>Email</p>
        <p>Address</p>
        <p>Phone</p>
        <p>Business</p>
        <p>Area</p>
        <p>Payments</p>
        <p>Goods</p>
      </div>
      <div className="rmerchants-data">
        {matchMerchants().length > 0 ? (
          matchMerchants().map((merchant, index) => (
            <div key={index} className="rmerchants-item">
              <p>{merchant.email}</p>
              <p>{merchant.address}</p>
              <p>{merchant.phone}</p>
              <p>{merchant.business}</p>
              <p>{merchant.area}</p>
              <p>{merchant.payment}</p>
              <p>{merchant.goods}</p>
            </div>
          ))
        ) : (
          <p>No matching merchants found nearby.</p>
        )}
      </div>
    </div>
  );
};

export default Rmerchants;
