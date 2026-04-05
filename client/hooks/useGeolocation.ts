'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  loading: boolean;
  error: string | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: '',
    loading: true,
    error: null,
  });
  
  // Use refs to prevent dependency changes causing infinite loops
  const optionsRef = useRef(options);
  const hasFetched = useRef(false);

  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    try {
      const token = process.env.NEXT_PUBLIC_LOCATIONIQ_TOKEN;
      let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      // If LocationIQ token is present, use it for better accuracy in India
      if (token && token !== 'YOUR_LOCATIONIQ_TOKEN') {
        url = `https://us1.locationiq.com/v1/reverse.php?key=${token}&lat=${lat}&lon=${lng}&format=json`;
      }


      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        // Fallback to nominatim if LocationIQ fails or is not available
        if (token) {
          const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return formatAddressData(fallbackData);
          }
        }
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      return formatAddressData(data);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Location unavailable';
    }
  }, []);

  const formatAddressData = (data: any) => {
    const address = data.address;
    if (!address) return data.display_name || 'Unknown Location';

    // India-specific address extraction
    const village = address.village || address.hamlet || address.suburb || address.neighbourhood;
    const taluka = address.county || address.subdistrict || address.town;
    const district = address.district || address.state_district || address.city;
    const state = address.state;

    // Build a more accurate address string: "Village/Locality, Taluka/City, District"
    const parts = [];
    if (village) parts.push(village);
    if (taluka && taluka !== village) parts.push(taluka);
    if (district && district !== taluka && district !== village) parts.push(district);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }

    return data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown Location';
  };


  const getLocation = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (hasFetched.current && state.loading === false) {
      return;
    }
    
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      hasFetched.current = true;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await fetchAddress(latitude, longitude);

        setState({
          latitude,
          longitude,
          address,
          loading: false,
          error: null,
        });
        hasFetched.current = true;
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        hasFetched.current = true;
      },
      {
        enableHighAccuracy: optionsRef.current.enableHighAccuracy ?? true,
        timeout: optionsRef.current.timeout ?? 10000,
        maximumAge: optionsRef.current.maximumAge ?? 0,
      }
    );
  }, [fetchAddress, state.loading]);

  useEffect(() => {
    // Only fetch on initial mount
    if (!hasFetched.current) {
      getLocation();
    }
  }, []); // Empty dependency array - only run once on mount

  return { ...state, refetch: getLocation };
}
