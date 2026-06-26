import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';

export interface UserNotification {
  _id: string;
  type: 'NEW_ORDER' | 'ORDER_STATUS_UPDATE' | 'NEW_MESSAGE' | 'CROP_ALERT' | 'AI_ANALYSIS_COMPLETE' | 'SYSTEM';
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Get User Notifications ────────────────────────────────────────────────
export function useUserNotifications() {
  return useQuery<UserNotification[]>({
    queryKey: ['user', 'notifications'],
    queryFn: async () => {
      const response = await userApi.getNotifications();
      return response.data.data;
    },
  });
}

// ─── Mark Notification Read ──────────────────────────────────────────────────
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userApi.markNotificationRead(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    },
  });
}

// ─── Mark All Notifications Read ─────────────────────────────────────────────
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await userApi.markAllNotificationsRead();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    },
  });
}
