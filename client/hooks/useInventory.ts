import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import toast from 'react-hot-toast';

export const INVENTORY_KEYS = {
  all: ['inventory'] as const,
  lists: () => [...INVENTORY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...INVENTORY_KEYS.lists(), filters] as const,
  myListings: () => [...INVENTORY_KEYS.all, 'my'] as const,
  detail: (id: string) => [...INVENTORY_KEYS.all, id] as const,
};

export const useInventory = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: INVENTORY_KEYS.list(params || {}),
    queryFn: () => inventoryApi.getAll(params).then((r) => r.data.data),
  });

export const useMyInventory = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: INVENTORY_KEYS.myListings(),
    queryFn: () => inventoryApi.getMyListings(params).then((r) => r.data.data),
  });

export const useInventoryById = (id: string) =>
  useQuery({
    queryKey: INVENTORY_KEYS.detail(id),
    queryFn: () => inventoryApi.getById(id).then((r) => r.data.data.item),
    enabled: !!id,
  });

export const useCreateInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
      toast.success('Listing created!');
    },
    onError: () => toast.error('Failed to create listing.'),
  });
};

export const useUpdateInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
      toast.success('Listing updated!');
    },
    onError: () => toast.error('Failed to update listing.'),
  });
};

export const useDeleteInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
      toast.success('Listing removed.');
    },
    onError: () => toast.error('Failed to remove listing.'),
  });
};
