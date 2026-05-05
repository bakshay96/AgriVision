import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  fetchAgmarknetPrices,
  getPriceTrends as getServicePriceTrends,
  cropVarieties,
  stateMarkets,
  ALL_INDIA_STATES,
} from '../services/governmentApiService';

// Get market prices with filters - Government API Integration
export const getMarketPrices = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { crop, state, district, taluka, fromDate, toDate, search, page = 1, limit = 50 } = req.query;

  try {
    // Fetch real government prices
    const govPrices = await fetchAgmarknetPrices(
      state as string | undefined,
      district as string | undefined,
      crop as string | undefined,
      fromDate as string | undefined,
      toDate as string | undefined,
      500, // fetching a larger set to allow local filtering
      0
    );

    // Apply remaining filters locally
    let filteredPrices = govPrices;

    if (taluka && taluka !== '') {
      filteredPrices = filteredPrices.filter((p: any) =>
        p.marketLocation.taluka?.toLowerCase().includes((taluka as string).toLowerCase())
      );
    }

    if (search && search !== '') {
      const searchLower = (search as string).toLowerCase();
      filteredPrices = filteredPrices.filter((p: any) =>
        p.cropName.toLowerCase().includes(searchLower) ||
        p.variety.toLowerCase().includes(searchLower) ||
        p.marketName.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = filteredPrices.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedPrices = filteredPrices.slice(skip, skip + Number(limit));

    // Get unique values for filters based on what's populated in the service
    const crops = Object.keys(cropVarieties);
    const states = Array.from(new Set([...Object.keys(stateMarkets), ...ALL_INDIA_STATES])).sort();
    const districts = state ? (stateMarkets[state as string] || []) : [];

    res.status(200).json({
      success: true,
      data: {
        prices: paginatedPrices,
        crops,
        states,
        districts,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
        source: 'Agmarknet (Government of India)',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    throw createError('Failed to fetch market prices', 500);
  }
});

// Get price trends for a specific crop - Government API
export const getPriceTrends = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { cropName } = req.params;

  if (!cropName) {
    throw createError('Crop name is required', 400);
  }

  const trends = await getServicePriceTrends(cropName);

  res.status(200).json({
    success: true,
    data: { 
      trends,
      cropName,
      source: 'Agmarknet (Government of India)',
    },
  });
});

// Get nearby markets based on farmer location - Government API
export const getNearbyMarkets = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { state, district } = req.query;

  // Fetch real government data
  const govPrices = await fetchAgmarknetPrices(
    state as string | undefined,
    district as string | undefined,
    undefined,
    undefined,
    undefined,
    100
  );

  // Group by market
  const marketMap = new Map();
  
  govPrices.forEach((price: any) => {
    const key = price.marketName;
    if (!marketMap.has(key)) {
      marketMap.set(key, {
        _id: price.marketName,
        location: price.marketLocation,
        crops: new Set(),
        prices: [],
      });
    }
    
    const market = marketMap.get(key);
    market.crops.add(price.cropName);
    market.prices.push(price.price.modal);
  });

  const markets = Array.from(marketMap.values()).map(m => ({
    _id: m._id,
    location: m.location,
    crops: Array.from(m.crops),
    avgPrice: Math.round(m.prices.reduce((a: number, b: number) => a + b, 0) / m.prices.length),
  }));

  res.status(200).json({
    success: true,
    data: { 
      markets,
      source: 'Agmarknet (Government of India)',
    },
  });
});
