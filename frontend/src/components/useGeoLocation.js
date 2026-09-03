import { useState, useCallback } from "react";

export default function useGeoLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      (err) => {
        if (err.code === 1) setError("Location permission denied. Please allow location access.");
        else if (err.code === 2) setError("Could not fetch location. Please enable location services.");
        else setError("Location request timed out. Please try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }, []);

  return { location, error, loading, fetch };
}
