'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Sprout, Edit2, Save, X,
  Plus, Trash2, Tractor, Home, CreditCard, Globe, Leaf,
  Wheat, Droplets, Sun, Thermometer, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile, useSelectedCrops, useUpdateProfile, useAddSelectedCrop, useRemoveSelectedCrop } from '@/hooks/useUser';
import { useLanguageStore } from '@/store/useLanguageStore';
import { indianLocations, kharifCrops, rabiCrops } from '@/lib/indianLocations';

const availableCrops = [
  ...kharifCrops.map(name => ({ name, season: 'Kharif', icon: Droplets })),
  ...rabiCrops.map(name => ({ name, season: 'Rabi', icon: Sun })),
];

export default function ProfilePage() {
  const { t, language } = useLanguageStore();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: cropsData, isLoading: cropsLoading } = useSelectedCrops();
  const updateProfile = useUpdateProfile();
  const addCrop = useAddSelectedCrop();
  const removeCrop = useRemoveSelectedCrop();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({
    name: '',
    phoneNumber: '',
    farmName: '',
    farmSizeAcres: 0,
    preferredLanguage: 'en',
    state: '',
    district: '',
    taluka: '',
    village: '',
    pincode: '',
    farmLocation: {
      lat: 0,
      lng: 0,
      address: '',
    },
  });

  // Update editedProfile when profile data loads
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.name || '',
        phoneNumber: profile.phoneNumber || '',
        farmName: profile.farmName || '',
        farmSizeAcres: profile.farmSizeAcres || 0,
        preferredLanguage: profile.preferredLanguage || 'en',
        state: profile.state || '',
        district: profile.district || '',
        taluka: profile.taluka || '',
        village: profile.village || '',
        pincode: profile.pincode || '',
        farmLocation: profile.farmLocation || {
          lat: 0,
          lng: 0,
          address: '',
        },
      });
    }
  }, [profile]);

  const selectedCrops = cropsData?.selectedCrops || [];
  const maxCrops = 5;

  const handleSaveProfile = () => {
    if (!editedProfile.name || !editedProfile.state || !editedProfile.district) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateProfile.mutate(editedProfile, {
      onSuccess: () => setIsEditing(false)
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const token = process.env.NEXT_PUBLIC_LOCATIONIQ_TOKEN;
          let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
          
          if (token && token !== 'YOUR_LOCATIONIQ_TOKEN') {
            url = `https://us1.locationiq.com/v1/reverse.php?key=${token}&lat=${latitude}&lon=${longitude}&format=json`;
          }

          const response = await fetch(url);
          const data = await response.json();
          const address = data.address || {};
          
          // Auto-fill address fields from geocoding
          const village = address.village || address.hamlet || address.suburb || address.neighbourhood || '';
          const taluka = address.county || address.subdistrict || address.town || '';
          const district = address.district || address.state_district || address.city || '';
          const state = address.state || '';
          const pincode = address.postcode || '';

          // Format a nice display address
          const parts = [];
          if (village) parts.push(village);
          if (taluka && taluka !== village) parts.push(taluka);
          if (district && district !== taluka && district !== village) parts.push(district);
          const formattedAddress = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 3).join(',') || 'Current Location');

          setEditedProfile({
            ...editedProfile,
            village: village || editedProfile.village,
            taluka: taluka || editedProfile.taluka,
            district: district || editedProfile.district,
            state: state || editedProfile.state,
            pincode: pincode || editedProfile.pincode,
            farmLocation: {
              lat: latitude,
              lng: longitude,
              address: formattedAddress,
            },
          });
          
          toast.success('Location and address captured successfully!');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setEditedProfile({
            ...editedProfile,
            farmLocation: {
              lat: latitude,
              lng: longitude,
              address: 'Current Location',
            },
          });
          toast.success('Coordinates captured (address lookup failed)');
        } finally {
          setGettingLocation(false);
        }
      },

      (error) => {
        setGettingLocation(false);
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
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleAddCrop = (cropName: string) => {
    if (selectedCrops.length < maxCrops) {
      addCrop.mutate(cropName);
      setShowCropSelector(false);
    }
  };

  const handleRemoveCrop = (cropName: string) => {
    removeCrop.mutate(cropName);
  };

  if (profileLoading || cropsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {language === 'mr' ? 'माझे प्रोफाइल' : language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile'}
        </h1>
        {!isEditing ? (
          <button
            onClick={() => {
              setEditedProfile(profile);
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            {language === 'mr' ? 'संपादित करा' : language === 'hi' ? 'संपादित करें' : 'Edit Profile'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
              {language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending 
                ? (language === 'mr' ? 'जतन करत आहे...' : language === 'hi' ? 'सहेज रहा है...' : 'Saving...')
                : (language === 'mr' ? 'जतन करा' : language === 'hi' ? 'सहेजें' : 'Save')
              }
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <User className="h-5 w-5 text-emerald-500" />
              {language === 'mr' ? 'वैयक्तिक माहिती' : language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'mr' ? 'पूर्ण नाव' : language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <p className="font-medium text-slate-900 dark:text-white">{profile?.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">Email</label>
                <p className="font-medium text-slate-900 dark:text-white">{profile?.email}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'mr' ? 'फोन नंबर' : language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phoneNumber || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phoneNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <p className="font-medium text-slate-900 dark:text-white">{profile?.phoneNumber || '-'}</p>
                )}
              </div>

              {/* Farm Name */}
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'mr' ? 'शेताचे नाव' : language === 'hi' ? 'फार्म का नाम' : 'Farm Name'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.farmName || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, farmName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <p className="font-medium text-slate-900 dark:text-white">{profile?.farmName || '-'}</p>
                )}
              </div>

              {/* Farm Size */}
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'mr' ? 'शेताचे क्षेत्रफळ (एक्र)' : language === 'hi' ? 'फार्म का आकार (एकड़)' : 'Farm Size (Acres)'}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedProfile.farmSizeAcres || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, farmSizeAcres: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                ) : (
                  <p className="font-medium text-slate-900 dark:text-white">{profile?.farmSizeAcres || '-'} acres</p>
                )}
              </div>

              {/* Preferred Language */}
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'mr' ? 'प्राधान्य भाषा' : language === 'hi' ? 'पसंदीदा भाषा' : 'Preferred Language'}
                </label>
                {isEditing ? (
                  <select
                    value={editedProfile.preferredLanguage || 'en'}
                    onChange={(e) => setEditedProfile({ ...editedProfile, preferredLanguage: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                ) : (
                  <p className="font-medium text-slate-900 dark:text-white">
                    {profile?.preferredLanguage === 'hi' ? 'हिंदी' : profile?.preferredLanguage === 'mr' ? 'मराठी' : 'English'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <MapPin className="h-5 w-5 text-blue-500" />
              {language === 'mr' ? 'पत्ता' : language === 'hi' ? 'पता' : 'Location'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Get Current Location Button */}
            {isEditing && (
              <button
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gettingLocation ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {language === 'mr' ? 'स्थान मिळवत आहे...' : language === 'hi' ? 'स्थान प्राप्त कर रहे हैं...' : 'Getting Location...'}
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" />
                    {language === 'mr' ? 'सध्याचे स्थान वापरा' : language === 'hi' ? 'वर्तमान स्थान उपयोग करें' : 'Use Current Location'}
                  </>
                )}
              </button>
            )}

            {/* Display current farm location */}
            {editedProfile.farmLocation?.lat && editedProfile.farmLocation?.lng && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {language === 'mr' ? 'शेताचे स्थान:' : language === 'hi' ? 'खेत का स्थान:' : 'Farm Location:'}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {editedProfile.farmLocation.address || `${editedProfile.farmLocation.lat.toFixed(4)}, ${editedProfile.farmLocation.lng.toFixed(4)}`}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Lat: {editedProfile.farmLocation.lat.toFixed(6)}, Lng: {editedProfile.farmLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'राज्य' : language === 'hi' ? 'राज्य' : 'State'}
                  </label>
                  <select
                    value={editedProfile.state || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, state: e.target.value, district: '', taluka: '' })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">{language === 'mr' ? 'राज्य निवडा' : language === 'hi' ? 'राज्य चुनें' : 'Select State'}</option>
                    {indianLocations.map(loc => (
                      <option key={loc.state} value={loc.state}>{loc.state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'जिल्हा' : language === 'hi' ? 'जिला' : 'District'}
                  </label>
                  <select
                    value={editedProfile.district || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, district: e.target.value, taluka: '' })}
                    disabled={!editedProfile.state}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{language === 'mr' ? 'जिल्हा निवडा' : language === 'hi' ? 'जिला चुनें' : 'Select District'}</option>
                    {editedProfile.state && indianLocations
                      .find(loc => loc.state === editedProfile.state)?.districts
                      .map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'तालुका' : language === 'hi' ? 'तालुका' : 'Taluka'}
                  </label>
                  <select
                    value={editedProfile.taluka || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, taluka: e.target.value })}
                    disabled={!editedProfile.district}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{language === 'mr' ? 'तालुका निवडा' : language === 'hi' ? 'तालुका चुनें' : 'Select Taluka'}</option>
                    {editedProfile.state && editedProfile.district && indianLocations
                      .find(loc => loc.state === editedProfile.state)?.districts
                      .find(d => d.name === editedProfile.district)?.talukas
                      .map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'गाव' : language === 'hi' ? 'गांव' : 'Village'}
                  </label>
                  <input
                    type="text"
                    value={editedProfile.village || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, village: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'mr' ? 'पिन कोड' : language === 'hi' ? 'पिन कोड' : 'Pincode'}
                  </label>
                  <input
                    type="text"
                    value={editedProfile.pincode || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, pincode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-900 dark:text-white">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'mr' ? 'राज्य: ' : language === 'hi' ? 'राज्य: ' : 'State: '}</span>
                  {profile?.state || '-'}
                </p>
                <p className="text-slate-900 dark:text-white">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'mr' ? 'जिल्हा: ' : language === 'hi' ? 'जिला: ' : 'District: '}</span>
                  {profile?.district || '-'}
                </p>
                <p className="text-slate-900 dark:text-white">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'mr' ? 'तालुका: ' : language === 'hi' ? 'तालुका: ' : 'Taluka: '}</span>
                  {profile?.taluka || '-'}
                </p>
                <p className="text-slate-900 dark:text-white">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'mr' ? 'गाव: ' : language === 'hi' ? 'गांव: ' : 'Village: '}</span>
                  {profile?.village || '-'}
                </p>
                <p className="text-slate-900 dark:text-white">
                  <span className="text-slate-500 dark:text-slate-400">{language === 'mr' ? 'पिन कोड: ' : language === 'hi' ? 'पिन कोड: ' : 'Pincode: '}</span>
                  {profile?.pincode || '-'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Crops Section */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Sprout className="h-5 w-5 text-emerald-500" />
            {language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops'}
            <span className="text-sm font-normal text-slate-500">
              ({selectedCrops.length}/{maxCrops})
            </span>
          </CardTitle>
          {selectedCrops.length < maxCrops && (
            <button
              onClick={() => setShowCropSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {language === 'mr' ? 'पीक जोडा' : language === 'hi' ? 'फसल जोड़ें' : 'Add Crop'}
            </button>
          )}
        </CardHeader>
        <CardContent>
          {selectedCrops.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                {language === 'mr' 
                  ? 'तुमची अद्याप कोणतीही पिके निवडलेली नाहीत' 
                  : language === 'hi' 
                    ? 'आपने अभी तक कोई फसल नहीं चुनी है' 
                    : 'You haven\'t selected any crops yet'}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {language === 'mr' 
                  ? 'तुमच्या डॅशबोर्डवर वैयक्तिकृत माहिती मिळवण्यासाठी किमान 5 पिके निवडा'
                  : language === 'hi'
                    ? 'व्यक्तिगत जानकारी के लिए अपने डैशबोर्ड पर न्यूनतम 5 फसलें चुनें'
                    : 'Select at least 5 crops to get personalized information on your dashboard'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {selectedCrops.map((cropName: string) => {
                const cropInfo = availableCrops.find(c => c.name === cropName);
                return (
                  <motion.div
                    key={cropName}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
                  >
                    <button
                      onClick={() => handleRemoveCrop(cropName)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                        {cropInfo?.season === 'Kharif' ? (
                          <Droplets className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Sun className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{cropName}</p>
                        <p className="text-xs text-slate-500">{cropInfo?.season}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crop Selector Modal */}
      {showCropSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'mr' ? 'पीक निवडा' : language === 'hi' ? 'फसल चुनें' : 'Select Crop'}
              </h3>
              <button
                onClick={() => setShowCropSelector(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Kharif Crops */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    {language === 'mr' ? 'खरीप पिके (पावसाळी)' : language === 'hi' ? 'खरीफ फसलें (मानसून)' : 'Kharif Crops (Monsoon)'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {kharifCrops
                      .filter(crop => !selectedCrops.includes(crop))
                      .map(crop => (
                        <button
                          key={crop}
                          onClick={() => handleAddCrop(crop)}
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {crop}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Rabi Crops */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    {language === 'mr' ? 'रबी पिके (हिवाळी)' : language === 'hi' ? 'रबी फसलें (सर्दी)' : 'Rabi Crops (Winter)'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rabiCrops
                      .filter(crop => !selectedCrops.includes(crop))
                      .map(crop => (
                        <button
                          key={crop}
                          onClick={() => handleAddCrop(crop)}
                          className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          {crop}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
