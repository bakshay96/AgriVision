'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ShoppingCart, MapPin, Star,
  Package, Leaf, X, ChevronDown, Loader2,
  CheckCircle2, Info, Map as MapIcon, Globe,
  ShieldCheck, Truck, CreditCard, User, Building,
  Clock, Clock12, Phone, Mail, Award, Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, ordersApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { SkeletonInventoryCard } from '@/components/ui/SkeletonLoaders';
import { formatCurrency, getStatusColor, formatDate, resolveUrl, cn } from '@/lib/utils';
import { indianLocations, getAllStates, getDistrictsByState, getTalukasByDistrict } from '@/lib/indianLocations';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function MarketplacePage() {
  const { user } = useAppStore();
  const { language, t } = useLanguageStore();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    district: '',
    taluka: '',
    state: '',
    pinCode: '',
    country: 'IN'
  });
  
  // Location dropdown state
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTalukas, setAvailableTalukas] = useState<string[]>([]);

  // Handle state selection
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('');
    setShippingAddress({ ...shippingAddress, state, district: '', taluka: '' });
    const districts = getDistrictsByState(state);
    setAvailableDistricts(districts);
    setAvailableTalukas([]);
  };

  // Handle district selection
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setShippingAddress({ ...shippingAddress, district, taluka: '' });
    const talukas = getTalukasByDistrict(selectedState, district);
    setAvailableTalukas(talukas);
  };

  // Handle taluka selection
  const handleTalukaChange = (taluka: string) => {
    setShippingAddress({ ...shippingAddress, taluka, city: taluka });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'marketplace', search],
    queryFn: () => inventoryApi.getAll({ search: search || undefined, status: 'available', limit: 24 }).then(r => r.data.data),
  });

  const { mutate: placeOrder, isPending: isOrdering } = useMutation({
    mutationFn: () => ordersApi.create({
      items: [{ inventoryId: selectedItem!._id, quantity: orderQty }],
      shippingAddress,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully! Farmer has been notified.');
      setSelectedItem(null);
    },
    onError: (err: any) => showErrorToast(err, 'Order Failed'),
  });

  const items = data?.items || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* Search Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
             Global B2B <span className="text-emerald-600">Fresh Marketplace</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Source directly from verified farmers worldwide. Verified quality, transparent pricing.</p>
        </div>
        
        <div className="flex flex-1 max-w-md items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search crops, varieties, or locations..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-12 pr-6 text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
             <Filter className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Hero Stats (Optional) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Active Listings', val: data?.total || 0, color: 'text-emerald-600' },
           { label: 'Verified Farms', val: '500+', color: 'text-blue-600' },
           { label: 'Total Volume', val: '12.4k tons', color: 'text-amber-600' },
           { label: 'Avg Quality', val: '4.8/5', color: 'text-purple-600' }
         ].map((s, i) => (
           <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
              <p className={cn('mt-1.5 text-lg font-black', s.color)}>{s.val}</p>
           </div>
         ))}
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => <SkeletonInventoryCard key={i} />)
        ) : items.map((item: any) => (
          <motion.div
            key={item._id}
            variants={cardVariants}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
          >
            {/* Image Section */}
            <div className="relative h-56 w-full overflow-hidden">
               {item.images?.[0] ? (
                 <img 
                  src={resolveUrl(item.images[0])} 
                  alt={item.cropName} 
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                 />
               ) : (
                 <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <Leaf className="h-14 w-14 text-emerald-100 dark:text-emerald-900/40" />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="absolute left-4 top-4">
                  <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg', getStatusColor(item.status))}>
                     {item.status.replace('_', ' ')}
                  </span>
               </div>
               <div className="absolute right-4 bottom-4 translate-y-10 group-hover:translate-y-0 transition-transform">
                  <div className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-slate-900">
                     <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                     {item.rating > 0 ? item.rating.toFixed(1) : 'New Listing'}
                  </div>
               </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-6 space-y-4">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{item.cropName}</h3>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.variety}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                       {formatCurrency(item.pricePerUnit)}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">per {item.unit}</p>
                  </div>
               </div>

               <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="truncate">{item.location?.city}, {item.location?.state}</span>
               </div>

               <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                     <Package className="h-3 w-3" /> {item.quantity} {item.unit}
                  </span>
                  <span className="rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                     <Clock12 className="h-3 w-3" /> Min: {item.minimumOrderQuantity}
                  </span>
               </div>

               <div className="pt-4 mt-auto">
                 {user?.role !== 'farmer' ? (
                   <button 
                    onClick={() => {
                        setSelectedItem(item);
                        setOrderQty(item.minimumOrderQuantity);
                    }}
                    className="w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     <ShoppingCart className="h-4 w-4" /> Secure Order
                   </button>
                 ) : (
                    <button disabled className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 py-3.5 text-xs font-bold text-slate-400 cursor-not-allowed">
                       Farmer View Active
                    </button>
                 )}
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Buy Now / Checkout Modal (Horizontal Desktop Layout) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={() => setSelectedItem(null)}
             />
             <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
             >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-6">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                         <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{t('market.secureCheckout')}</h2>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                           <Globe className="h-3 w-3" /> Direct B2B Transaction
                        </p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedItem(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <X className="h-6 w-6" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   <div className="grid gap-10 grid-cols-1">
                       {/* Left Section: Order Summary & Review */}
                       <div className="space-y-8">
                          {/* Item Card */}
                          <div className="flex gap-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6">
                             <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                                <img 
                                  src={resolveUrl(selectedItem.images?.[0])} 
                                  className="h-full w-full object-cover" 
                                />
                             </div>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-900 dark:text-white truncate">{selectedItem.cropName}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">{selectedItem.variety}</p>
                                <div className="flex gap-4">
                                   <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('market.unitPrice')}</p>
                                      <p className="text-sm font-black text-emerald-600">{formatCurrency(selectedItem.pricePerUnit)}</p>
                                   </div>
                                   <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                                   <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('market.origination')}</p>
                                      <p className="text-sm font-bold text-slate-600 truncate max-w-[120px]">{selectedItem.location.city}</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Purchase Logic */}
                          <div className="space-y-6">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('market.adjustQuantity')} ({selectedItem.unit}s)</label>
                                <div className="flex items-center gap-4">
                                   <input 
                                      type="number"
                                      min={selectedItem.minimumOrderQuantity}
                                      max={selectedItem.quantity}
                                      value={orderQty}
                                      onChange={(e) => setOrderQty(Number(e.target.value))}
                                      className="flex-1 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                                   />
                                   <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 flex flex-col justify-center">
                                      <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{t('market.netTotal')}</p>
                                      <p className="text-xl font-black text-emerald-600">{formatCurrency(orderQty * selectedItem.pricePerUnit)}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-slate-400">
                                   <Info className="h-3 w-3" /> {t('market.min')}: {selectedItem.minimumOrderQuantity} · {t('market.maxAvailable')}: {selectedItem.quantity}
                                </div>
                             </div>

                             <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
                                <div className="flex justify-between items-center text-sm font-medium">
                                   <span className="text-slate-400 flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t('market.transactionFee')}</span>
                                   <span className="text-slate-900 dark:text-white">0.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                   <span className="text-slate-400 flex items-center gap-2"><Truck className="h-4 w-4" /> {t('market.deliveryEst')}</span>
                                   <span className="text-slate-900 dark:text-white">--</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-end">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('market.totalPayable')}</p>
                                      <p className="text-2xl font-black text-emerald-600">{formatCurrency(orderQty * selectedItem.pricePerUnit)}</p>
                                   </div>
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                       <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Right Section: Logistics & Fulfillment */}
                       <div className="space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                             <Truck className="h-5 w-5 text-emerald-600" /> {t('market.logisticsDetails')}
                          </h3>
                          
                          <div className="space-y-4">
                             {/* Street Address */}
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('market.consigneeAddress')}</label>
                                <input 
                                   className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white"
                                   placeholder="House no., Street, Landmark"
                                   value={shippingAddress.street}
                                   onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})}
                                />
                             </div>
                             
                             {/* State Dropdown */}
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">State *</label>
                                <select
                                   value={selectedState}
                                   onChange={(e) => handleStateChange(e.target.value)}
                                   className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white appearance-none cursor-pointer"
                                >
                                   <option value="">Select State</option>
                                   {getAllStates().map(state => (
                                      <option key={state} value={state}>{state}</option>
                                   ))}
                                </select>
                             </div>

                             {/* District Dropdown */}
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">District *</label>
                                <select
                                   value={selectedDistrict}
                                   onChange={(e) => handleDistrictChange(e.target.value)}
                                   disabled={!selectedState}
                                   className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                   <option value="">Select District</option>
                                   {availableDistricts.map(district => (
                                      <option key={district} value={district}>{district}</option>
                                   ))}
                                </select>
                             </div>

                             {/* Taluka/Subdivision Dropdown */}
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Taluka / Subdivision *</label>
                                <select
                                   value={shippingAddress.taluka}
                                   onChange={(e) => handleTalukaChange(e.target.value)}
                                   disabled={!selectedDistrict}
                                   className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                   <option value="">Select Taluka</option>
                                   {availableTalukas.map(taluka => (
                                      <option key={taluka} value={taluka}>{taluka}</option>
                                   ))}
                                </select>
                             </div>
                             
                             {/* PIN Code */}
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">PIN Code *</label>
                                <input 
                                   type="text"
                                   maxLength={6}
                                   className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white"
                                   placeholder="e.g., 400001"
                                   value={shippingAddress.pinCode}
                                   onChange={e => setShippingAddress({...shippingAddress, pinCode: e.target.value.replace(/\D/g, '')})}
                                />
                             </div>
                          </div>

                          {/* Supplier/Farmer Details */}
                          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-emerald-950 dark:to-slate-900 p-6 text-white space-y-5">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                   <Award className="h-4 w-4" /> Verified Supplier
                                </h4>
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                                   ✓ Verified
                                </span>
                             </div>
                             
                             {/* Farm Details */}
                             <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                   <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                      <Building className="h-5 w-5 text-emerald-400" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Farm Name</p>
                                      <p className="text-sm font-bold text-white truncate">{selectedItem.farmerId?.farmName || 'N/A'}</p>
                                   </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                   <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                      <User className="h-5 w-5 text-emerald-400" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Farmer Name</p>
                                      <p className="text-sm font-bold text-white truncate">{selectedItem.farmerId?.name || 'N/A'}</p>
                                   </div>
                                </div>
                                
                                {selectedItem.farmerId?.phoneNumber && (
                                   <div className="flex items-start gap-3">
                                      <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                         <Phone className="h-5 w-5 text-emerald-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Contact</p>
                                         <p className="text-sm font-bold text-white">{selectedItem.farmerId.phoneNumber}</p>
                                      </div>
                                   </div>
                                )}
                                
                                {selectedItem.location && (
                                   <div className="flex items-start gap-3">
                                      <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                         <MapPin className="h-5 w-5 text-emerald-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Farm Location</p>
                                         <p className="text-sm font-bold text-white">
                                            {selectedItem.location.address && `${selectedItem.location.address}, `}
                                            {selectedItem.location.city}, {selectedItem.location.state}
                                         </p>
                                         {selectedItem.location.pin && (
                                            <p className="text-xs text-emerald-400/70 mt-0.5">PIN: {selectedItem.location.pin}</p>
                                         )}
                                      </div>
                                   </div>
                                )}
                                
                                {selectedItem.farmerId?.farmSizeAcres && (
                                   <div className="flex items-start gap-3">
                                      <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                         <Package className="h-5 w-5 text-emerald-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Farm Size</p>
                                         <p className="text-sm font-bold text-white">{selectedItem.farmerId.farmSizeAcres} acres</p>
                                      </div>
                                   </div>
                                )}
                             </div>
                             
                             {/* Trust Badges */}
                             <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                   <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                   <span className="text-[10px] font-bold text-white/80">ID Verified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                   <span className="text-[10px] font-bold text-white/80">Quality Checked</span>
                                </div>
                             </div>
                          </div>

                          <button 
                             onClick={() => placeOrder()}
                             disabled={isOrdering || !shippingAddress.street || !selectedState || !selectedDistrict || !shippingAddress.taluka || !shippingAddress.pinCode}
                             className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-2xl shadow-emerald-600/40 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             {isOrdering ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                             {isOrdering ? t('market.securing') : t('market.confirmSource')}
                          </button>
                       </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
