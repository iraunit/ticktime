import {api} from './api';

export interface CountryCode {
    id: number;
    code: string;
    country: string;
    flag?: string;
}

/**
 * Fetches the list of country codes from the backend
 * @returns Promise<CountryCode[]> - Array of available country codes
 */
export async function fetchCountryCodes(): Promise<CountryCode[]> {
    try {
        const response = await api.get('/common/country-codes/');
        if (response.data.status === 'success') {
            return response.data.country_codes;
        }
        return [];
    } catch (error) {
        console.error('Error fetching country codes:', error);
        return [];
    }
}
