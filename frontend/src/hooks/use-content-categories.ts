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
            try {
                const response = await api.get('/common/content-categories/');
                // After API interceptor, response.data is already the result object
                // Backend returns: {success: true, result: {categories: [...]}}
                // After interceptor: response.data = {categories: [...]}
                const categories = response.data?.categories || response.data || [];
                return categories as ContentCategory[];
            } catch (err) {
                console.error('Error fetching content categories:', err);
                throw err;
            }
        },
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    return {
        contentCategories: data || [],
        loading: isLoading,
        error: error as Error | null,
    };
}
