import React, { useState, useEffect } from 'react';
import './rfarmers.css';

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

const Rfarmers = () => {
  const [rfarmers, setRfarmers] = useState([]);
  const [lat, setLat] = useState([]);
  const [nearbyFarmers, setNearbyFarmers] = useState([]);


  const fetchinfo = async () => {
    await fetch('http://13.233.124.185:5000/rfarmers')
      .then((resp) => resp.json())
      .then((data) => {
        setRfarmers(data);
      });
  };

  const fetchinfo2 = async () => {
    await fetch('http://13.233.124.185:5000/farmeruser')
      .then((resp) => resp.json())
      .then((data) => {
        setLat(data);
      });
  };

  const findNearbyFarmers = (userLat, userLon) => {
    const maxDistance = 20;
    const nearby = lat.filter((farmer) => {
      const distance = getDistance(userLat, userLon, farmer.latitude, farmer.longitude);
      return distance <= maxDistance;
    });
    setNearbyFarmers(nearby.slice(0, 20));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const userLatitude = position.coords.latitude;
      const userLongitude = position.coords.longitude;
      findNearbyFarmers(userLatitude, userLongitude);
    });
  }, [lat]);

  useEffect(() => {
    fetchinfo2();
    fetchinfo();
  }, []);

  const matchFarmers = () => {
    return rfarmers.filter(nearbyFarmer =>
      nearbyFarmers.some(rfarmer => rfarmer.email === nearbyFarmer.email)
    );
  };

  return (
    <div className="Rfarmers-content">
      <h1>Nearby Farmers</h1>
      <br />
      <div className="Rfarmers-content-format-main">
        <p>Email</p>
        <p>Address</p>
        <p>Phone</p>
        <p>Area In Acre</p>
        <p>Farm Type</p>
        <p>Soil Type</p>
        <p>Crop Grown</p>
        <p>Fertilizers</p>
      </div>
      <div className="Rfarmers-content-data">
        {matchFarmers().length > 0 ? (
          matchFarmers().map((farmer, index) => (
            <div key={index} className="Rfarmers-content-item">
              <p>{farmer.email}</p>
              <p>{farmer.address}</p>
              <p>{farmer.phone}</p>
              <p>{farmer.area}</p>
              <p>{farmer.farm_type}</p>
              <p>{farmer.soil_type}</p>
              <p>{farmer.crop_grown}</p>
              <p>{farmer.fertilizers}</p>
            </div>
          ))
        ) : (
          <p>No matching farmers found nearby.</p>
        )}
      </div>
    </div>
  );
};

export default Rfarmers;
