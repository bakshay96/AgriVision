import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from 'sonner';

// ─── Get User Profile ───────────────────────────────────────────────────────
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await userApi.getProfile();
      return response.data.data;
    },
  });
}

// ─── Update User Profile ────────────────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await userApi.updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success(language === 'mr' ? 'प्रोफाइल अपडेट केले' : language === 'hi' ? 'प्रोफाइल अपडेट किया गया' : 'Profile updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || (error.message || 'Failed to update profile');
      toast.error(message);
    },
  });
}

// ─── Get Selected Crops ─────────────────────────────────────────────────────
export function useSelectedCrops() {
  return useQuery({
    queryKey: ['user', 'crops'],
    queryFn: async () => {
      const response = await userApi.getSelectedCrops();
      return response.data.data;
    },
  });
}

// ─── Add Selected Crop ──────────────────────────────────────────────────────
export function useAddSelectedCrop() {
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  
  return useMutation({
    mutationFn: async (cropName: string) => {
      const response = await userApi.addSelectedCrop(cropName);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'crops'] });
      toast.success(language === 'mr' ? 'पीक जोडले' : language === 'hi' ? 'फसल जोडी गई' : 'Crop added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || (error.message || 'Failed to add crop');
      toast.error(message);
    },
  });
}

// ─── Remove Selected Crop ───────────────────────────────────────────────────
export function useRemoveSelectedCrop() {
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  
  return useMutation({
    mutationFn: async (cropName: string) => {
      const response = await userApi.removeSelectedCrop(cropName);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'crops'] });
      toast.success(language === 'mr' ? 'पीक काढले' : language === 'hi' ? 'फसल हटा दी गई' : 'Crop removed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || (error.message || 'Failed to remove crop');
      toast.error(message);
    },
  });
}

// ─── Update Selected Crops (Bulk) ───────────────────────────────────────────
export function useUpdateSelectedCrops() {
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();
  
  return useMutation({
    mutationFn: async (crops: string[]) => {
      const response = await userApi.updateSelectedCrops(crops);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'crops'] });
      toast.success(language === 'mr' ? 'पिके अपडेट केली' : language === 'hi' ? 'फसलें अपडेट की गईं' : 'Crops updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || (error.message || 'Failed to update crops');
      toast.error(message);
    },
  });
}
