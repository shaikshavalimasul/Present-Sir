import { useState, useCallback, useRef } from "react";

// Accuracy (meters) at which we stop early instead of waiting out the full window.
const GOOD_ENOUGH_ACCURACY = 12;
// How long to keep sampling and looking for a better fix before giving up and
// using the best reading seen so far.
const STABILIZE_WINDOW_MS = 15000;

export default function useGeoLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);
  const bestRef = useRef(null);
  const timeoutRef = useRef(null);

  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    cleanup();
    setLoading(false);
    if (bestRef.current) {
      setLocation(bestRef.current);
    } else {
      setError("Could not get a location fix. Move outdoors or near a window and try again.");
    }
  }, [cleanup]);

  const fetch = useCallback(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }

    cleanup();
    bestRef.current = null;
    setLoading(true);
    setError(null);
    setLocation(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const reading = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        // Keep the most accurate reading seen so far (lowest accuracy value = better).
        if (!bestRef.current || reading.accuracy < bestRef.current.accuracy) {
          bestRef.current = reading;
        }
        // Good enough — stop early instead of waiting out the full window.
        if (reading.accuracy <= GOOD_ENOUGH_ACCURACY) {
          finish();
        }
      },
      (err) => {
        // Only surface an error if we never got any reading at all; otherwise
        // fall back to whatever best fix we already captured.
        if (bestRef.current) { finish(); return; }
        cleanup();
        setLoading(false);
        if (err.code === 1) setError("Location permission denied. Please allow location access.");
        else if (err.code === 2) setError("Could not fetch location. Please enable location services.");
        else setError("Location request timed out. Please try again.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: STABILIZE_WINDOW_MS }
    );

    // Hard cap: after the stabilize window, stop and use whatever we have.
    timeoutRef.current = setTimeout(finish, STABILIZE_WINDOW_MS);
  }, [cleanup, finish]);

  return { location, error, loading, fetch };
}