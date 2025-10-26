import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api';

export interface ContentCategory {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  industry_key: string;
  industry_name: string;
}

export interface UseContentCategoriesResult {
    contentCategories: ContentCategory[];
    loading: boolean;
    error: Error | null;
}

export function useContentCategories(): UseContentCategoriesResult {
    const {data, isLoading, error} = useQuery({
        queryKey: ['content-categories'],
        queryFn: async () => {
            const response = await api.get('/common/content-categories/');
            return response.data.categories as ContentCategory[];
        },
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        contentCategories: data || [],
        loading: isLoading,
        error: error as Error | null,
    };
}
