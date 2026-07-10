import { useState, useEffect } from 'react';
import './rworkers.css';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

const Rworkers = () => {
  const [rworkers, setRworkers] = useState([]); // Worker data from the backend
  const [lat, setLat] = useState([]); // User's location data from backend
  const [nearbyWorkers, setNearbyWorkers] = useState([]); // Nearby workers

  // Fetch worker information from the backend
  const fetchWorkersInfo = async () => {
    try {
      const response = await fetch('http://13.233.124.185/rworkers');
      const workersData = await response.json();
      setRworkers(workersData);
    } catch (error) {
      console.error('Error fetching worker data:', error);
    }
  };

  // Fetch user location data
  const fetchUserLocation = async () => {
    try {
      const response = await fetch('http://13.233.124.185/workersuser');
      const userData = await response.json();
      setLat(userData);
    } catch (error) {
      console.error('Error fetching user location data:', error);
    }
  };

  // Filter workers based on user's location
  const findNearbyWorkers = (userLat, userLon) => {
    const maxDistance = 200; // Maximum distance in kilometers
    const nearby = lat.filter((worker) => {
      const distance = getDistance(userLat, userLon, worker.latitude, worker.longitude);
      return distance <= maxDistance;
    });
    setNearbyWorkers(nearby.slice(0, 20)); // Limit to 20 nearby workers
  };

  // Get user's geolocation and find nearby workers
  useEffect(() => {
    if (lat.length > 0) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLatitude = position.coords.latitude;
        const userLongitude = position.coords.longitude;
        findNearbyWorkers(userLatitude, userLongitude);
      });
    }
  }, [lat]);

  // Fetch workers and user location data on mount
  useEffect(() => {
    fetchUserLocation();
    fetchWorkersInfo();
  }, []);

  const matchWorkers = () => {
    return rworkers.filter((worker) =>
      nearbyWorkers.some((nearbyWorker) => nearbyWorker.email === worker.email)
    );
  };

  return (
    <div>
      <h1>Nearby Workers</h1>
      <div className="Rworkers-content-format-main">
        <p>Email</p>
        <p>Address</p>
        <p>Phone</p>
        <p>Birth</p>
        <p>Availability</p>
        <p>Skillset</p>
        <p>Salary</p>
      </div>
      <div className="Rworkers-content-data">
        {matchWorkers().length > 0 ? (
          matchWorkers().map((worker, index) => (
            <div key={index} className="Rworkers-content-item">
              <p>{worker.email}</p>
              <p>{worker.address}</p>
              <p>{worker.phone}</p>
              <p>{worker.birth}</p>
              <p>{worker.time}</p>
              <p>{worker.skills}</p>
              <p>{worker.salary}</p>
            </div>
          ))
        ) : (
          <p>No matching workers found nearby.</p>
        )}
      </div>
    </div>
  );
};

export default Rworkers;
