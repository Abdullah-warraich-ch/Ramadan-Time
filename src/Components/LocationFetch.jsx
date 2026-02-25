import { useEffect, useState } from "react";

function LocationComponent() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    });
  }, []);

  return (
    <div>
      {location
        ? `Lat: ${location.lat}, Lon: ${location.lon}`
        : "Getting location..."}
    </div>
  );
}

export default LocationComponent;