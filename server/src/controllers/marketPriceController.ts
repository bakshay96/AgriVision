import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  fetchAgmarknetPrices,
  getPriceTrends as getServicePriceTrends,
  stateMarkets,
  ALL_INDIA_STATES,
} from '../services/governmentApiService';

// ─── Get Market Prices with filters ────────────────────────────────────────────
export const getMarketPrices = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { crop, state, district, market, fromDate, toDate, search, page = 1, limit = 50 } = req.query;

  try {
    const govPrices = await fetchAgmarknetPrices(
      state as string | undefined,
      district as string | undefined,
      crop as string | undefined,
      fromDate as string | undefined,
      toDate as string | undefined,
      500,
      0
    );

    let filteredPrices = govPrices;

    // 'market' is the city/taluka-level filter (Agmarknet market name)
    if (market && market !== '') {
      filteredPrices = filteredPrices.filter((p: any) =>
        p.marketName.toLowerCase().includes((market as string).toLowerCase())
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

    const total = filteredPrices.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedPrices = filteredPrices.slice(skip, skip + Number(limit));

    // Derive available filter options from the current fetch
    const crops = Array.from(new Set(govPrices.map((p: any) => p.cropName))).filter(Boolean).sort() as string[];
    const states = Array.from(new Set([...Object.keys(stateMarkets), ...ALL_INDIA_STATES])).sort();
    // Districts come from what the API returned for the selected state (live, not cached)
    const districts = state
      ? (Array.from(new Set(govPrices.map((p: any) => p.marketLocation.district))).filter(Boolean).sort() as string[])
      : [];

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

// ─── Get Districts & Talukas for a State (or talukas for State+District) ─────
export const getDistrictsForState = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { state, district } = req.query;

  if (!state) {
    res.status(400).json({ success: false, message: 'State query param is required' });
    return;
  }

  // Fetch records filtered by state (+ district if provided)
  const govPrices = await fetchAgmarknetPrices(
    state as string,
    district as string | undefined,   // when district given, narrows to talukas
    undefined,
    undefined,
    undefined,
    500,
    0
  );

  // Districts = all districts in the state
  const districts = Array.from(new Set(govPrices.map((p: any) => p.marketLocation.district)))
    .filter(Boolean).sort() as string[];

  // Talukas = unique market names within the (optionally filtered) district
  // In Agmarknet, market name == taluka/sub-division city
  const talukas = Array.from(new Set(govPrices.map((p: any) => p.marketName)))
    .filter(Boolean).sort() as string[];

  res.status(200).json({
    success: true,
    data: {
      state,
      district: district || null,
      districts,   // populated when no district filter
      talukas,     // populated always; narrowed when district filter is set
    },
  });
});

// ─── Get Price Trends for a crop ──────────────────────────────────────────────
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

// ─── Get Nearby Markets ───────────────────────────────────────────────────────
export const getNearbyMarkets = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { state, district } = req.query;

  const govPrices = await fetchAgmarknetPrices(
    state as string | undefined,
    district as string | undefined,
    undefined,
    undefined,
    undefined,
    100
  );

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
    const m = marketMap.get(key);
    m.crops.add(price.cropName);
    m.prices.push(price.price.modal);
  });

  const markets = Array.from(marketMap.values()).map(m => ({
    _id: m._id,
    location: m.location,
    crops: Array.from(m.crops),
    avgPrice: Math.round(m.prices.reduce((a: number, b: number) => a + b, 0) / m.prices.length),
  }));

  res.status(200).json({
    success: true,
    data: { markets, source: 'Agmarknet (Government of India)' },
  });
});
