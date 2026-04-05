export declare const cropVarieties: Record<string, string[]>;
export declare const stateMarkets: Record<string, string[]>;
export declare const generateGovernmentStylePrices: (state?: string, district?: string) => any[];
export declare const fetchAgmarknetPrices: (state?: string, district?: string, crop?: string, date?: string) => Promise<{
    success: boolean;
    data: any[];
    count: number;
    source: string;
    lastUpdated: string;
}>;
export declare const getPriceTrends: (prices: any[]) => any[];
declare const _default: {
    generateGovernmentStylePrices: (state?: string, district?: string) => any[];
    fetchAgmarknetPrices: (state?: string, district?: string, crop?: string, date?: string) => Promise<{
        success: boolean;
        data: any[];
        count: number;
        source: string;
        lastUpdated: string;
    }>;
    getPriceTrends: (prices: any[]) => any[];
    cropVarieties: Record<string, string[]>;
    stateMarkets: Record<string, string[]>;
};
export default _default;
//# sourceMappingURL=governmentApiService.d.ts.map