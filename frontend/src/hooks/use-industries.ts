import {useEffect, useState} from 'react';
import {fetchIndustries, IndustryCategory} from '@/lib/industries';

export function useIndustries() {
    const [industries, setIndustries] = useState<IndustryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadIndustries = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchIndustries();
                setIndustries(data);
            } catch (err) {
                setError('Failed to load industries');
                console.error('Error loading industries:', err);
            } finally {
                setLoading(false);
            }
        };

        loadIndustries();
    }, []);

    const refreshIndustries = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchIndustries();
            setIndustries(data);
        } catch (err) {
            setError('Failed to refresh industries');
            console.error('Error refreshing industries:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        industries,
        loading,
        error,
        refreshIndustries,
    };
}
