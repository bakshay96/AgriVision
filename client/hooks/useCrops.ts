import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cropsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export const CROP_KEYS = {
  all: ['crops'] as const,
  lists: () => [...CROP_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...CROP_KEYS.lists(), filters] as const,
  detail: (id: string) => [...CROP_KEYS.all, id] as const,
  stats: () => [...CROP_KEYS.all, 'stats'] as const,
};

export const useCrops = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: CROP_KEYS.list(params || {}),
    queryFn: () => cropsApi.getAll(params).then((r) => r.data.data),
  });

export const useCropById = (id: string) =>
  useQuery({
    queryKey: CROP_KEYS.detail(id),
    queryFn: () => cropsApi.getById(id).then((r) => r.data.data.crop),
    enabled: !!id,
  });

export const useCropStats = () =>
  useQuery({
    queryKey: CROP_KEYS.stats(),
    queryFn: () => cropsApi.getStats().then((r) => r.data.data),
  });

export const useCreateCrop = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => cropsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CROP_KEYS.all });
      toast.success('Crop created successfully!');
    },
    onError: () => toast.error('Failed to create crop.'),
  });
};

export const useUpdateCrop = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      cropsApi.update(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: CROP_KEYS.detail(variables.id) });
      qc.invalidateQueries({ queryKey: CROP_KEYS.lists() });
      toast.success('Crop updated!');
    },
    onError: () => toast.error('Failed to update crop.'),
  });
};

export const useDeleteCrop = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cropsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CROP_KEYS.all });
      toast.success('Crop removed.');
    },
    onError: () => toast.error('Failed to remove crop.'),
  });
};
