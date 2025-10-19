import {useState} from 'react';
import {api} from '@/lib/api';

export interface PincodeLocationData {
    pincode: string;
    country: string;
    state: string;
    city: string;
}

export interface UsePincodeLookupReturn {
    loading: boolean;
    error: string | null;
    lookupPincode: (pincode: string, country: string) => Promise<PincodeLocationData | null>;
}

export function usePincodeLookup(): UsePincodeLookupReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookupPincode = async (pincode: string, country: string): Promise<PincodeLocationData | null> => {
        if (!pincode || !country) {
            setError('Pincode and country are required');
            return null;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Hook: Making API call with params:', {pincode, country});
            const response = await api.get('/common/location-from-pincode/', {
                params: {pincode, country}
            });

            console.log('Hook: API response:', response.data);

            // The API interceptor already extracts the result, so response.data is the actual result
            if (response.data && typeof response.data === 'object' && 'state' in response.data && 'city' in response.data) {
                console.log('Hook: Success, returning result:', response.data);
                return response.data;
            } else {
                console.log('Hook: API returned unexpected data:', response.data);
                setError('Could not find location data for this pincode');
                return null;
            }
        } catch (err: any) {
            console.error('Hook: Error looking up pincode:', err);
            setError(err.response?.data?.error || 'Failed to lookup pincode');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        lookupPincode
    };
}
