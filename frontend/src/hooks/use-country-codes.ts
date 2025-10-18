import {useEffect, useState} from 'react';
import {CountryCode, fetchCountryCodes} from '@/lib/country-codes';

export function useCountryCodes() {
    const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCountryCodes = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchCountryCodes();
                setCountryCodes(data);
            } catch (err) {
                setError('Failed to load country codes');
                console.error('Error loading country codes:', err);
            } finally {
                setLoading(false);
            }
        };

        loadCountryCodes();
    }, []);

    const refreshCountryCodes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchCountryCodes();
            setCountryCodes(data);
        } catch (err) {
            setError('Failed to refresh country codes');
            console.error('Error refreshing country codes:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        countryCodes,
        loading,
        error,
        refreshCountryCodes,
    };
}
