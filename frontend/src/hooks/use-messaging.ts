import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api';

/**
 * Hook to fetch unread messages count
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: ['unread-messages-count'],
        queryFn: async () => {
            const response = await api.get('/messaging/unread-count/');
            return response.data.unread_count || 0;
        },
        refetchInterval: 60000,
        retry: 2,
    });
}

