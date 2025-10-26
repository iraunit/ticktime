import {useEffect, useState} from 'react';
import api from '@/lib/api';

export interface City {
    name: string;
    state: string;
}

export interface LocationData {
    country: string;
    state: string;
    city: string;
    pincode: string;
    area: string;
}

export interface UseLocationDataReturn {
    cities: City[];
    states: string[];
    loading: boolean;
    error: string | null;
    fetchCities: () => Promise<void>;
    fetchStates: () => Promise<void>;
    lookupPincode: (pincode: string) => Promise<LocationData | null>;
}

export function useLocationData(): UseLocationDataReturn {
    const [cities, setCities] = useState<City[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCities = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users/location-data/', {
                params: {type: 'cities', country: 'India'}
            });

            if (response.data) {
                setCities(response.data.data);
            } else {
                setError('Failed to fetch cities');
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
            setError('Failed to fetch cities');
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users/location-data/', {
                params: {type: 'states', country: 'India'}
            });

            if (response.data) {
                setStates(response.data.data);
            } else {
                setError('Failed to fetch states');
            }
        } catch (err) {
            console.error('Error fetching states:', err);
            setError('Failed to fetch states');
        } finally {
            setLoading(false);
        }
    };

    const lookupPincode = async (pincode: string): Promise<LocationData | null> => {
        try {
            console.log('Hook: Starting pincode lookup for:', pincode);
            setLoading(true);
            setError(null);

            const url = '/users/location-data/';
            const params = {type: 'pincode', pincode};
            console.log('Hook: Making API call to:', url, 'with params:', params);

            const response = await api.get(url, {params});
            console.log('Hook: API response:', response.data);

            if (response.data) {
                console.log('Hook: Success, returning data:', response.data.data);
                return response.data.data;
            } else {
                console.log('Hook: API returned error status');
                setError('Could not find location data for this pincode');
                return null;
            }
        } catch (err) {
            console.error('Hook: Error looking up pincode:', err);
            setError('Failed to lookup pincode');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        fetchCities();
        fetchStates();
    }, []);

    return {
        cities,
        states,
        loading,
        error,
        fetchCities,
        fetchStates,
        lookupPincode
    };
}
