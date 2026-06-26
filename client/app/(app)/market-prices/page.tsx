"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { Search, ChevronUp, ChevronDown, Download, MessageSquare, Calendar as CalIcon, Filter, X, ArrowUpDown, SlidersHorizontal, Store, BarChart3, Loader2 } from "lucide-react";
import { marketPricesApi, feedbackApi } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import PriceTicker from "@/components/market/PriceTicker";
import { ALL_INDIA_STATES_CLIENT } from "@/lib/indiaStates";
import { getDistrictsByState, getTalukasByDistrict } from "@/lib/indianLocations";
import { toast } from "sonner";

type SortField = "cropName"|"variety"|"priceMin"|"priceMax"|"priceModal"|"marketName"|"arrivalDate";
type SortDir = "asc"|"desc";

export default function MarketPricesPage() {
  const { user } = useAppStore();
  const { t } = useLanguageStore();
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTaluka, setSelectedTaluka] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<{field:SortField;dir:SortDir}>({field:"priceModal",dir:"desc"});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fb, setFb] = useState({subject:"",message:"",category:"general" as const,rating:5});
  const headerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const onScroll = () => headerRef.current && setIsSticky(window.scrollY > headerRef.current.offsetTop + 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Query 1: Prices (main data) ──────────────────────────────────────────
  const { data: priceData, isFetching: pricesFetching, isLoading: pricesLoading } = useQuery({
    queryKey: ["market-prices", debouncedSearch, selectedState, selectedDistrict, selectedTaluka, selectedCrop, fromDate, toDate],
    queryFn: () => marketPricesApi.getAll({
      crop: selectedCrop||undefined, state: selectedState||undefined,
      district: selectedDistrict||undefined, market: selectedTaluka||undefined,
      fromDate: fromDate||undefined, toDate: toDate||undefined,
      search: debouncedSearch||undefined, limit: 500,
    }).then(r => r.data.data),
    placeholderData: keepPreviousData,
  });

  // ── Query 2: Districts for selected state ───────────────────────────────
  const { data: districtData, isFetching: districtsFetching } = useQuery({
    queryKey: ["market-districts", selectedState],
    queryFn: () => marketPricesApi.getDistricts(selectedState).then(r => r.data.data),
    enabled: !!selectedState,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // ── Query 3: Talukas for selected district ──────────────────────────────
  const { data: talukaData, isFetching: talukasFetching } = useQuery({
    queryKey: ["market-talukas", selectedState, selectedDistrict],
    queryFn: () => marketPricesApi.getDistricts(selectedState, selectedDistrict).then(r => r.data.data),
    enabled: !!selectedState && !!selectedDistrict,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const { prices=[], crops=[], states=[] } = priceData || {};
  
  // Combine local and API-fetched districts (divisions)
  const districtsOptions = useMemo(() => {
    if (!selectedState) return [];
    const localDistricts = getDistrictsByState(selectedState) || [];
    const apiDistricts = districtData?.districts || [];
    return Array.from(new Set([...localDistricts, ...apiDistricts])).sort();
  }, [selectedState, districtData]);

  // Combine local and API-fetched talukas (sub-divisions)
  const talukasOptions = useMemo(() => {
    if (!selectedDistrict) return [];
    const localTalukas = getTalukasByDistrict(selectedState, selectedDistrict) || [];
    const apiTalukas = talukaData?.talukas || [];
    return Array.from(new Set([...localTalukas, ...apiTalukas])).sort();
  }, [selectedState, selectedDistrict, talukaData]);

  const stats = useMemo(() => {
    if (!prices.length) return {avg:0,total:0,min:0,max:0};
    const mp = prices.map((p:any) => p.price?.modal||0);
    return { avg: Math.round(mp.reduce((a:number,b:number)=>a+b,0)/prices.length), total:prices.length, min:Math.min(...mp), max:Math.max(...mp) };
  }, [prices]);

  const sorted = useMemo(() => {
    return [...prices].sort((a:any,b:any) => {
      let av:any,bv:any;
      switch(sort.field){
        case "cropName": av=a.cropName; bv=b.cropName; break;
        case "variety": av=a.variety; bv=b.variety; break;
        case "priceMin": av=a.price?.min; bv=b.price?.min; break;
        case "priceMax": av=a.price?.max; bv=b.price?.max; break;
        case "priceModal": av=a.price?.modal; bv=b.price?.modal; break;
        case "marketName": av=a.marketName; bv=b.marketName; break;
        case "arrivalDate": {
          const parseClientDate = (s: string) => {
            if (!s) return 0;
            // Handle YYYY-MM-DD
            if (s.includes("-")) {
              const parts = s.split("-");
              if (parts.length === 3) {
                const p0 = Number(parts[0]);
                const p1 = Number(parts[1]);
                const p2 = Number(parts[2]);
                if (p0 > 1000) return new Date(p0, p1 - 1, p2).getTime();
                return new Date(p2, p1 - 1, p0).getTime();
              }
            }
            // Handle DD/MM/YYYY
            if (s.includes("/")) {
              const parts = s.split("/");
              if (parts.length === 3) {
                const p0 = Number(parts[0]);
                const p1 = Number(parts[1]);
                const p2 = Number(parts[2]);
                if (p2 > 1000) return new Date(p2, p1 - 1, p0).getTime();
                if (p0 > 1000) return new Date(p0, p1 - 1, p2).getTime();
              }
            }
            const d = new Date(s);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          };
          av = parseClientDate(a.arrivalDate || "");
          bv = parseClientDate(b.arrivalDate || "");
          break;
        }
        default: return 0;
      }
      if(typeof av==="string") return sort.dir==="asc"?av.localeCompare(bv):bv.localeCompare(av);
      return sort.dir==="asc"?av-bv:bv-av;
    });
  }, [prices, sort]);

  const handleSort = useCallback((field:SortField) => setSort(p=>({field,dir:p.field===field&&p.dir==="asc"?"desc":"asc"})),[]);

  const downloadCSV = () => {
    const rows = sorted.map((p:any)=>[p.cropName,p.variety,p.marketName,p.marketLocation?.state,p.marketLocation?.district,p.price?.min,p.price?.max,p.price?.modal,p.arrivalDate]);
    const csv = [["Crop","Variety","Market","State","District","Min","Max","Modal","Date"],...rows].map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `market_prices_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const fbMutation = useMutation({
    mutationFn: (d:any) => feedbackApi.create(d),
    onSuccess: () => { toast.success("Feedback sent!"); setShowFeedback(false); setFb({subject:"",message:"",category:"general",rating:5}); },
    onError: () => toast.error("Failed to send feedback."),
  });

  const statesAll: string[] = states.length ? states : ALL_INDIA_STATES_CLIENT;

  if (pricesLoading && !priceData) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600"/>
        <p className="text-sm font-semibold text-slate-500">Fetching live mandi prices…</p>
      </div>
    </div>
  );

  const cols: {label:string;field:SortField}[] = [
    {label:"CropName",field:"cropName"},{label:"Variety",field:"variety"},{label:"Market / Taluka",field:"marketName"},
    {label:"Min Price",field:"priceMin"},{label:"Max Price",field:"priceMax"},{label:"Modal Avg",field:"priceModal"},{label:"Arrival Date",field:"arrivalDate"},
  ];

  return (
    <div className="relative min-h-screen pb-24">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="space-y-4">

        {/* Compact Header Row */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Store className="h-5 w-5"/>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {t("market.title")}
                {pricesFetching && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                    <Loader2 className="h-2.5 w-2.5 animate-spin"/> Live Syncing
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Daily prices & mandi arrivals · Agmarknet OGD Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={downloadCSV} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 font-bold text-xs shadow-sm transition-all"
            >
              <Download className="h-3.5 w-3.5"/>
              Export CSV
            </button>
            <button 
              onClick={() => setShowFeedback(true)} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5"/>
              Feedback
            </button>
          </div>
        </div>

        {/* Price Ticker */}
        {prices.length > 0 && <PriceTicker prices={prices.slice(0,12).map((p:any)=>({cropName:p.cropName,variety:p.variety,price:p.price?.modal,marketName:p.marketName,trend:"stable",changePercent:0}))}/>}

        {/* Filters Toolbar - Single compact row */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
              <input 
                type="text" 
                placeholder="Search mandi / crop..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 pl-8 pr-2.5 py-1.5 text-xs outline-none transition-all focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* State */}
            <select 
              value={selectedState} 
              onChange={e => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
                setSelectedTaluka("");
              }} 
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white cursor-pointer"
            >
              <option value="">State: All States</option>
              {statesAll.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* District */}
            <div className="relative">
              {districtsFetching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-emerald-500"/>}
              <select 
                value={selectedDistrict} 
                onChange={e => {
                  setSelectedDistrict(e.target.value);
                  setSelectedTaluka("");
                }} 
                disabled={!selectedState} 
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white disabled:opacity-50 cursor-pointer"
              >
                <option value="">District: All</option>
                {districtsOptions.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Taluka */}
            <div className="relative">
              {talukasFetching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-emerald-500"/>}
              <select 
                value={selectedTaluka} 
                onChange={e => setSelectedTaluka(e.target.value)} 
                disabled={!selectedDistrict} 
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white disabled:opacity-50 cursor-pointer"
              >
                <option value="">Taluka: All</option>
                {talukasOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Commodity */}
            <select 
              value={selectedCrop} 
              onChange={e => setSelectedCrop(e.target.value)} 
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white cursor-pointer"
            >
              <option value="">Commodity: All</option>
              {crops.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-1">
              <div className="relative">
                <CalIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400"/>
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={e => setFromDate(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 pl-6 pr-1 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white cursor-pointer"
                />
              </div>
              <div className="relative">
                <CalIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={e => setToDate(e.target.value)} 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 pl-6 pr-1 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white cursor-pointer"
                />
              </div>
            </div>

          </div>

          {(search || selectedState || selectedDistrict || selectedTaluka || selectedCrop || fromDate || toDate) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <span className="font-semibold text-slate-400 mr-1">Active Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  "{search}"
                  <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setSearch("")}/>
                </span>
              )}
              {selectedState && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  {selectedState}
                  <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => { setSelectedState(""); setSelectedDistrict(""); setSelectedTaluka(""); }}/>
                </span>
              )}
              {selectedDistrict && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  {selectedDistrict}
                  <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => { setSelectedDistrict(""); setSelectedTaluka(""); }}/>
                </span>
              )}
              {selectedTaluka && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  {selectedTaluka}
                  <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setSelectedTaluka("")}/>
                </span>
              )}
              {selectedCrop && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                  {selectedCrop}
                  <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setSelectedCrop("")}/>
                </span>
              )}
              {(fromDate || toDate) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                  {fromDate || "*"} - {toDate || "*"}
                  <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => { setFromDate(""); setToDate(""); }}/>
                </span>
              )}
              <button 
                onClick={() => { setSearch(""); setSelectedState(""); setSelectedDistrict(""); setSelectedTaluka(""); setSelectedCrop(""); setFromDate(""); setToDate(""); }}
                className="text-red-500 hover:text-red-650 transition-colors ml-auto hover:underline font-bold text-[10px]"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Mandi Records Listing */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4">
              <Store className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Mandi Prices Found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              We couldn't find any pricing records matching your search queries. Try adjusting your state, district, or date range filters.
            </p>
            {(search || selectedState || selectedDistrict || selectedTaluka || selectedCrop || fromDate || toDate) && (
              <button
                onClick={() => { setSearch(""); setSelectedState(""); setSelectedDistrict(""); setSelectedTaluka(""); setSelectedCrop(""); setFromDate(""); setToDate(""); }}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-sm">
                    <tr>
                      {cols.map(h => (
                        <th 
                          key={h.field} 
                          onClick={() => handleSort(h.field)} 
                          className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap border-b border-slate-200 dark:border-slate-700 select-none transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            {h.label}
                            <ArrowUpDown className={`h-3.5 w-3.5 ${sort.field === h.field ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`}/>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sorted.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-5 py-4 font-bold text-slate-950 dark:text-white whitespace-nowrap">{p.cropName}</td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap max-w-[120px] truncate" title={p.variety}>
                          {p.variety}
                        </td>
                        <td className="px-5 py-4 min-w-[150px]">
                          <div className="font-bold text-slate-800 dark:text-slate-250 truncate" title={p.marketName}>{p.marketName}</div>
                          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate mt-0.5">
                            {p.marketLocation?.district}, {p.marketLocation?.state}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">{formatCurrency(p.price?.min)}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">{formatCurrency(p.price?.max)}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform">
                            {formatCurrency(p.price?.modal)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{p.arrivalDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card Grid View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {sorted.map((p: any, i: number) => (
                <Card key={i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Crop Name and Arrival Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{p.cropName}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Variety: <span className="font-semibold">{p.variety}</span></p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <CalIcon className="h-3 w-3"/>
                        {p.arrivalDate}
                      </div>
                    </div>

                    {/* Market Details */}
                    <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-2.5">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Mandi / Location</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{p.marketName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{p.marketLocation?.district}, {p.marketLocation?.state}</p>
                    </div>

                    {/* Prices Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Min Price</p>
                        <p className="text-xs font-bold text-slate-650 dark:text-slate-350 mt-0.5">{formatCurrency(p.price?.min)}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max Price</p>
                        <p className="text-xs font-bold text-slate-650 dark:text-slate-350 mt-0.5">{formatCurrency(p.price?.max)}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-center">
                        <p className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Modal Avg</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(p.price?.modal)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Floating sort button (sticky) */}
      <AnimatePresence>
        {isSticky&&(
          <motion.button initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:100,opacity:0}} onClick={()=>setSidebarOpen(true)} className="fixed right-6 bottom-10 z-[100] flex items-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-600/40 hover:bg-emerald-700 font-bold ring-4 ring-white dark:ring-slate-900">
            <SlidersHorizontal className="h-5 w-5"/>Sort & Filter
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out sidebar */}
      <AnimatePresence>
        {sidebarOpen&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSidebarOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"/>
            <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:25,stiffness:200}} className="fixed right-0 top-0 h-screen w-full max-w-xs bg-white dark:bg-slate-900 z-[120] shadow-2xl p-6 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-black dark:text-white flex items-center gap-2"><Filter className="h-5 w-5 text-emerald-600"/>Sort & Filter</h2><button onClick={()=>setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5 text-slate-500"/></button></div>
              <div className="space-y-6 flex-1">
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Sort By</h3>
                  <div className="space-y-2">
                    {([["priceModal","Modal Price"],["cropName","Crop Name"],["marketName","Market / Taluka"],["arrivalDate","Arrival Date"]] as [SortField,string][]).map(([f,l])=>(
                      <button key={f} onClick={()=>handleSort(f)} className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${sort.field===f?"bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300"}`}>
                        {l}{sort.field===f&&(sort.dir==="asc"?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>)}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Filter</h3>
                  <input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"/>
                </section>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={()=>{setSearch("");setSelectedState("");setSelectedDistrict("");setSelectedTaluka("");setSelectedCrop("");setFromDate("");setToDate("");}} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm">Reset</button>
                <button onClick={()=>setSidebarOpen(false)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">Apply</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      <AnimatePresence>
        {showFeedback&&(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-7 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-black dark:text-white">Share Feedback</h2><button onClick={()=>setShowFeedback(false)}><X className="h-5 w-5 text-slate-400"/></button></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">{["bug","feature","general","other"].map(cat=><button key={cat} onClick={()=>setFb({...fb,category:cat as any})} className={`py-2.5 rounded-2xl border-2 text-sm font-bold capitalize ${fb.category===cat?"bg-emerald-600 border-emerald-600 text-white":"border-slate-100 dark:border-slate-700 text-slate-500 hover:border-emerald-200"}`}>{cat}</button>)}</div>
                <input type="text" placeholder="Subject" value={fb.subject} onChange={e=>setFb({...fb,subject:e.target.value})} className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-sm dark:bg-slate-800 dark:text-white outline-none"/>
                <textarea rows={4} placeholder="What can we improve?" value={fb.message} onChange={e=>setFb({...fb,message:e.target.value})} className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-sm dark:bg-slate-800 dark:text-white outline-none resize-none"/>
              </div>
              <button onClick={()=>fbMutation.mutate({...fb,name:user?.name||"Anonymous",email:user?.email||""})} disabled={fbMutation.isPending||!fb.message} className="w-full mt-5 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50">{fbMutation.isPending?"Sending…":"Send Feedback"}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
