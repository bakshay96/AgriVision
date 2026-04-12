'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Navigation, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
  };
}

export default function LocationPicker({ isOpen, onClose, onSelect, initialLocation }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addressDetails, setAddressDetails] = useState<any>(null);

  // Search for locations using Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Add India bias to search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'AgriVision Pro/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Location search error:', error);
      toast.error('Failed to search locations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        await fetchAddressDetails(latitude, longitude);
        setDetectingLocation(false);
      },
      (error) => {
        setDetectingLocation(false);
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fetch address details for coordinates
  const fetchAddressDetails = async (lat: number, lng: number) => {
    try {
      const token = process.env.NEXT_PUBLIC_LOCATIONIQ_TOKEN;
      let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      
      if (token && token !== 'YOUR_LOCATIONIQ_TOKEN') {
        url = `https://us1.locationiq.com/v1/reverse.php?key=${token}&lat=${lat}&lon=${lng}&format=json`;
      }

      const response = await fetch(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      });

      if (!response.ok) throw new Error('Failed to fetch address');

      const data = await response.json();
      const address = data.address || {};

      // Extract Indian address components
      const village = address.village || address.hamlet || address.suburb || address.neighbourhood || address.locality || '';
      const taluka = address.county || address.subdistrict || address.town || address.taluka || '';
      const district = address.district || address.state_district || address.city || '';
      const state = address.state || '';
      const pincode = address.postcode || '';

      // Build display address
      const parts = [];
      if (village) parts.push(village);
      if (taluka && taluka !== village) parts.push(taluka);
      if (district && district !== taluka) parts.push(district);
      if (state && !parts.includes(state)) parts.push(state);

      const formattedAddress = parts.join(', ') || data.display_name || 'Selected Location';

      setAddressDetails({
        lat,
        lng,
        address: formattedAddress,
        village,
        taluka,
        district,
        state,
        pincode,
        fullAddress: data.display_name,
      });
    } catch (error) {
      console.error('Address fetch error:', error);
      setAddressDetails({
        lat,
        lng,
        address: 'Selected Location',
        fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

  // Handle search result selection
  const handleSelectSearchResult = async (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedLocation({ lat, lng });
    
    const address = result.address || {};
    const village = address.village || address.town || address.city || '';
    const district = address.district || '';
    const state = address.state || '';
    const pincode = address.postcode || '';

    setAddressDetails({
      lat,
      lng,
      address: result.display_name,
      village,
      district,
      state,
      pincode,
      fullAddress: result.display_name,
    });
    
    setSearchResults([]);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!addressDetails) {
      toast.error('Please select a location first');
      return;
    }

    onSelect({
      lat: addressDetails.lat,
      lng: addressDetails.lng,
      address: addressDetails.address,
      village: addressDetails.village,
      taluka: addressDetails.taluka,
      district: addressDetails.district,
      state: addressDetails.state,
      pincode: addressDetails.pincode,
    });
    
    toast.success('Location selected successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search village, town, or address..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {searchResults.map((result, index) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectSearchResult(result)}
                    className={`w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-start gap-3 ${
                      index !== searchResults.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''
                    }`}
                  >
                    <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {result.display_name.split(',')[0]}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {result.display_name.split(',').slice(1, 3).join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Or divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 uppercase">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Current Location Button */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={detectingLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {detectingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Use Current Location
              </>
            )}
          </button>

          {/* Selected Location Details */}
          <AnimatePresence>
            {addressDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                    <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      Selected Location
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                      {addressDetails.address}
                    </p>
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                      {addressDetails.village && (
                        <p>Village: {addressDetails.village}</p>
                      )}
                      {addressDetails.taluka && (
                        <p>Taluka: {addressDetails.taluka}</p>
                      )}
                      {addressDetails.district && (
                        <p>District: {addressDetails.district}</p>
                      )}
                      {addressDetails.state && (
                        <p>State: {addressDetails.state}</p>
                      )}
                      {addressDetails.pincode && (
                        <p>Pincode: {addressDetails.pincode}</p>
                      )}
                    </div>
                    <p className="text-xs text-emerald-500 mt-2">
                      Lat: {addressDetails.lat.toFixed(6)}, Lng: {addressDetails.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Search for your village or town name. You can also use your current GPS location. 
              The address details can be manually corrected after selection.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!addressDetails}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Confirm Location
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
