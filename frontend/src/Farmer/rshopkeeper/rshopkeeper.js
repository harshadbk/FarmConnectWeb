import { useState, useEffect } from 'react';
import './rshopkeepers.css';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Rshopkeeper = () => {
  const [shopkeepers, setShopkeepers] = useState([]);
  const [allShopkeepers, setAllShopkeepers] = useState([]);
  const [nearbyShopkeepers, setNearbyShopkeepers] = useState([]);

  const fetchShopkeepers = async () => {
    try {
      const shopkeeperData = await fetch('http://127.0.0.1:5000/rshopkeepers');
      const shopkeepersJson = await shopkeeperData.json();
      setAllShopkeepers(shopkeepersJson);

      const userData = await fetch('http://localhost:5000/shopkeeperuser');
      const userJson = await userData.json();
      setShopkeepers(userJson);
    } catch (error) {
      console.error('Error fetching shopkeeper data:', error);
    }
  };

  const findNearbyShopkeepers = (userLat, userLon) => {
    const maxDistance = 200;
    const nearby = shopkeepers.filter((shopkeeper) => {
      const distance = getDistance(userLat, userLon, shopkeeper.latitude, shopkeeper.longitude);
      return distance <= maxDistance;
    });
    setNearbyShopkeepers(nearby.slice(0, 20));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatitude = position.coords.latitude;
        const userLongitude = position.coords.longitude;
        findNearbyShopkeepers(userLatitude, userLongitude);
      },
      (error) => console.error('Geolocation error:', error)
    );
  }, [shopkeepers]);

  useEffect(() => {
    fetchShopkeepers();
  }, []);

  const matchedShopkeepers = () => {
    return allShopkeepers.filter((shopkeeper) =>
      nearbyShopkeepers.some((nearby) => nearby.email === shopkeeper.email)
    );
  };

  return (
    <div>
      <h1>Nearby Shopkeepers</h1>
      <div className="shopkeeper-content-format">
        <p>Email</p>
        <p>Owner Address</p>
        <p>shop Address</p>
        <p>Phone</p>
        <p>shop name</p>
        <p>Shop Type</p>
        <p>Operation Hours</p>
        <p>Payment Methods</p>
      </div>
      <div className="shopkeeper-content-data">
        {matchedShopkeepers().length > 0 ? (
          matchedShopkeepers().map((shopkeeper, index) => (
            <div key={index} className="shopkeeper-content-item">
              <p>{shopkeeper.email}</p>
              <p>{shopkeeper.ownaddress}</p>
              <p>{shopkeeper.shaddress}</p>
              <p>{shopkeeper.phoneno}</p>
              <p>{shopkeeper.shname}</p>
              <p>{shopkeeper.shtype}</p>
              <p>{shopkeeper.ophours}</p>
              <p>{shopkeeper.payment}</p>
            </div>
          ))
        ) : (
          <p>No matching shopkeeper found nearby.</p>
        )}
      </div>
    </div>
  );
};

export default Rshopkeeper;
