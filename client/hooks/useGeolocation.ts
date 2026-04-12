'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface AddressComponents {
  village?: string;
  subDistrict?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  fullAddress?: string;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  addressComponents: AddressComponents;
  loading: boolean;
  error: string | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface GoogleGeocodeResult {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
  status: string;
  error_message?: string;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: '',
    addressComponents: {},
    loading: true,
    error: null,
  });
  
  // Use refs to prevent dependency changes causing infinite loops
  const optionsRef = useRef(options);
  const hasFetched = useRef(false);

  /**
   * Extract address components from Google Geocoding API response
   * Prioritizes Indian address format: Village/Locality, Taluka/Subdistrict, District, State
   * Improved for better Indian rural address detection
   */
  const formatGoogleAddress = (data: GoogleGeocodeResult): { display: string; components: any } => {
    if (!data.results || data.results.length === 0) {
      return { display: 'Unknown Location', components: {} };
    }

    // Try to find the most specific result (locality level)
    let result = data.results[0];
    
    // Look for a result that contains locality or sublocality for more precise location
    const preciseResult = data.results.find(r => 
      r.address_components.some(c => 
        c.types.includes('locality') || c.types.includes('sublocality')
      )
    );
    if (preciseResult) {
      result = preciseResult;
    }

    const components = result.address_components;
    
    // Extract components by type
    const getComponent = (types: string[]) => {
      const component = components.find(c => types.some(type => c.types.includes(type)));
      return component?.long_name || '';
    };

    // For Indian addresses, extract all possible components
    // Village/Locality can be at multiple levels
    const village = getComponent(['locality']) || 
                   getComponent(['sublocality', 'sublocality_level_1']) || 
                   getComponent(['neighborhood', 'colloquial_area']);
    
    // Try to get taluka/tehsil from various possible fields
    const subDistrict = getComponent(['administrative_area_level_3']) || 
                       getComponent(['taluka', 'tehsil']) ||
                       // Sometimes taluka is in the formatted address but not in components
                       extractFromFormatted(result.formatted_address, 'taluka');
    
    const district = getComponent(['administrative_area_level_2']) || 
                    getComponent(['district']);
    
    const city = getComponent(['city']);
    const state = getComponent(['administrative_area_level_1']);
    const country = getComponent(['country']);
    const pincode = getComponent(['postal_code']);

    // Build address string with priority - Indian format
    const parts: string[] = [];
    
    // Add village/locality first (most specific)
    if (village) parts.push(village);
    
    // Add sub-district/taluka if different from village
    if (subDistrict && subDistrict !== village && !parts.includes(subDistrict)) {
      parts.push(subDistrict);
    }
    
    // Add district if different from previous
    if (district && !parts.includes(district)) {
      parts.push(district);
    }
    
    // If no specific location found, fall back to city/state
    if (parts.length === 0 && city && city !== state) {
      parts.push(city);
    }
    
    // Always add state for context
    if (state && !parts.includes(state)) parts.push(state);

    const displayAddress = parts.length > 0 
      ? parts.join(', ') 
      : result.formatted_address?.split(',').slice(0, 3).join(', ') || 'Unknown Location';

    return {
      display: displayAddress,
      components: {
        village,
        subDistrict,
        district,
        city,
        state,
        country,
        pincode,
        fullAddress: result.formatted_address,
      }
    };
  };

  // Helper to extract taluka from formatted address if not in components
  const extractFromFormatted = (formatted: string, type: string): string => {
    // Common patterns in Indian addresses
    const patterns = [
      /([\w\s]+)\s+Taluka/i,
      /([\w\s]+)\s+Tehsil/i,
      /T\.\s*([\w\s]+?),/i,
    ];
    for (const pattern of patterns) {
      const match = formatted.match(pattern);
      if (match) return match[1].trim();
    }
    return '';
  };

  /**
   * Format address from OpenStreetMap/Nominatim response
   */
  const formatAddressData = (data: any): { display: string; components: AddressComponents } => {
    const address = data.address;
    if (!address) return { 
      display: data.display_name || 'Unknown Location',
      components: { fullAddress: data.display_name }
    };

    // India-specific address extraction
    const village = address.village || address.hamlet || address.suburb || address.neighbourhood || address.locality;
    const taluka = address.county || address.subdistrict || address.town || address.taluka;
    const district = address.district || address.state_district || address.city;
    const state = address.state;
    const country = address.country;
    const pincode = address.postcode;

    // Build a more accurate address string: "Village/Locality, Taluka/City, District"
    const parts = [];
    if (village) parts.push(village);
    if (taluka && taluka !== village) parts.push(taluka);
    if (district && district !== taluka && district !== village) parts.push(district);
    if (state && !parts.includes(state)) parts.push(state);
    
    const displayAddress = parts.length > 0 
      ? parts.join(', ') 
      : data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown Location';

    return {
      display: displayAddress,
      components: {
        village,
        subDistrict: taluka,
        district,
        state,
        country,
        pincode,
        fullAddress: data.display_name,
      }
    };
  };

  /**
   * Fetch address using Google Geocoding API
   * Falls back to OpenStreetMap if Google API fails or is not configured
   */
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    try {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      // Try Google Geocoding API first if key is available
      if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        try {
          const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=en`;
          
          const response = await fetch(googleUrl);
          const data: GoogleGeocodeResult = await response.json();
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            return formatGoogleAddress(data);
          }
          
          // Log Google API errors for debugging
          if (data.status !== 'ZERO_RESULTS') {
            console.warn('Google Geocoding API error:', data.status, data.error_message);
          }
        } catch (googleError) {
          console.warn('Google Geocoding failed, falling back to OpenStreetMap:', googleError);
        }
      }

      // Fallback to OpenStreetMap/Nominatim
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
        throw new Error('Failed to fetch address from fallback service');
      }

      const data = await response.json();
      return formatAddressData(data);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { display: 'Location unavailable', components: {} };
    }
  }, []);


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
        const addressResult = await fetchAddress(latitude, longitude);

        setState({
          latitude,
          longitude,
          address: addressResult.display,
          addressComponents: addressResult.components,
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
