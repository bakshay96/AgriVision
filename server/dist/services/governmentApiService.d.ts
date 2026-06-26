export declare const cropVarieties: Record<string, string[]>;
export declare const stateMarkets: Record<string, string[]>;
export declare const ALL_INDIA_STATES: string[];
export declare const fetchAgmarknetPrices: (state?: string, district?: string, crop?: string, fromDate?: string, toDate?: string, limit?: number, offset?: number) => Promise<any>;
export declare const getPriceTrends: (cropName: string) => Promise<any[]>;
declare const _default: {
    fetchAgmarknetPrices: (state?: string, district?: string, crop?: string, fromDate?: string, toDate?: string, limit?: number, offset?: number) => Promise<any>;
    getPriceTrends: (cropName: string) => Promise<any[]>;
    cropVarieties: Record<string, string[]>;
    stateMarkets: Record<string, string[]>;
};
export default _default;
//# sourceMappingURL=governmentApiService.d.ts.map