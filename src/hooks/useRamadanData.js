import { useEffect, useRef, useState } from "react";

const DEFAULT_COORDS = { lat: 24.8607, lon: 67.0011 };
const RAMADAN_API_URL = "https://islamicapi.com/api/v1/ramadan/";
const API_KEY = "xZaaeSeRVvFTVjojf6KQOBYT7aihHJAAnu3zdHQVTNTvjQR3";

function getCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      () => resolve(DEFAULT_COORDS),
      { timeout: 5000 }
    );
  });
}

function normalizeResponse(json) {
  return {
    ramadan_year: json.ramadan_year,
    fasting: json.data?.fasting ?? [],
    resource: json.resource ?? null,
  };
}

export function useRamadanData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    async function fetchRamadanData() {
      try {
        setLoading(true);
        setError("");

        const coords = await getCoords();
        const response = await fetch(
          `${RAMADAN_API_URL}?lat=${coords.lat}&lon=${coords.lon}&api_key=${API_KEY}`
        );
        const json = await response.json();

        if (requestId !== requestIdRef.current) return;

        if (json.status === "success") {
          setData(normalizeResponse(json));
        } else {
          setData(null);
          setError("Unable to fetch Ramadan schedule.");
        }
      } catch {
        if (requestId !== requestIdRef.current) return;
        setData(null);
        setError("Network error while loading schedule.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchRamadanData();
  }, []);

  return { data, loading, error };
}
