import { Router } from 'express';
import axios from 'axios';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Geocode coordinates to address using Google Maps API
router.get('/reverse', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw createError('Latitude and longitude are required', 400);
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

    // If Google API key is available, use it
    if (googleApiKey) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=en`
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const components = result.address_components;

          // Extract address components
          const getComponent = (types: string[]) => {
            const component = components.find((c: any) => 
              types.some(type => c.types.includes(type))
            );
            return component?.long_name || '';
          };

          const village = getComponent(['locality', 'sublocality', 'sublocality_level_1', 'neighborhood']);
          const subDistrict = getComponent(['administrative_area_level_3']);
          const district = getComponent(['administrative_area_level_2']);
          const city = getComponent(['administrative_area_level_1']);
          const state = getComponent(['administrative_area_level_1']);
          const country = getComponent(['country']);
          const pincode = getComponent(['postal_code']);

          // Build formatted address
          const parts: string[] = [];
          if (village) parts.push(village);
          if (subDistrict && subDistrict !== village) parts.push(subDistrict);
          if (district && district !== subDistrict) parts.push(district);
          if (state && !parts.includes(state)) parts.push(state);

          return res.status(200).json({
            success: true,
            data: {
              formattedAddress: parts.join(', ') || result.formatted_address,
              fullAddress: result.formatted_address,
              components: {
                village,
                subDistrict,
                district,
                city,
                state,
                country,
                pincode,
              },
              coordinates: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
              source: 'google',
            },
          });
        }
      } catch (googleError) {
        console.warn('Google Geocoding failed, falling back to OpenStreetMap:', googleError);
      }
    }

    // Fallback to OpenStreetMap Nominatim
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'AgriVision Pro/1.0',
          },
        }
      );

      const data = response.data;
      const address = data.address;

      const village = address.village || address.hamlet || address.suburb || address.neighbourhood || address.locality;
      const taluka = address.county || address.subdistrict || address.town;
      const district = address.district || address.state_district || address.city;
      const state = address.state;
      const country = address.country;
      const pincode = address.postcode;

      const parts: string[] = [];
      if (village) parts.push(village);
      if (taluka && taluka !== village) parts.push(taluka);
      if (district && district !== taluka) parts.push(district);
      if (state && !parts.includes(state)) parts.push(state);

      return res.status(200).json({
        success: true,
        data: {
          formattedAddress: parts.join(', ') || data.display_name,
          fullAddress: data.display_name,
          components: {
            village,
            subDistrict: taluka,
            district,
            city: address.city,
            state,
            country,
            pincode,
          },
          coordinates: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
          source: 'nominatim',
        },
      });
    } catch (osmError) {
      throw createError('Failed to geocode coordinates', 500);
    }
  } catch (error) {
    next(error);
  }
});

// Geocode address to coordinates
router.get('/geocode', async (req: AuthRequest, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      throw createError('Address is required', 400);
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

    // If Google API key is available, use it
    if (googleApiKey) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address as string)}&key=${googleApiKey}&language=en&region=in`
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const location = result.geometry.location;
          const components = result.address_components;

          const getComponent = (types: string[]) => {
            const component = components.find((c: any) => 
              types.some(type => c.types.includes(type))
            );
            return component?.long_name || '';
          };

          return res.status(200).json({
            success: true,
            data: {
              coordinates: { lat: location.lat, lng: location.lng },
              formattedAddress: result.formatted_address,
              components: {
                village: getComponent(['locality', 'sublocality']),
                district: getComponent(['administrative_area_level_2']),
                state: getComponent(['administrative_area_level_1']),
                country: getComponent(['country']),
                pincode: getComponent(['postal_code']),
              },
              source: 'google',
            },
          });
        }
      } catch (googleError) {
        console.warn('Google Geocoding failed:', googleError);
      }
    }

    throw createError('Address geocoding requires Google Maps API key', 501);
  } catch (error) {
    next(error);
  }
});

export default router;
