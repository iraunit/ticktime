import { api } from './api';

export interface IndustryCategory {
  id: number;
  key: string;
  name: string;
}

/**
 * Fetches the list of industries from the backend
 * @returns Promise<IndustryCategory[]> - Array of available industries
 */
export async function fetchIndustries(): Promise<IndustryCategory[]> {
  try {
    const response = await api.get('/common/industries/');
    if (response.data.industries) {
      return response.data.industries;
    }
    return [];
  } catch (error) {
    console.error('Error fetching industries:', error);
    return [];
  }
}

/**
 * Fetches the list of categories from the backend (legacy endpoint)
 * @returns Promise<IndustryCategory[]> - Array of available categories
 */
export async function fetchCategories(): Promise<IndustryCategory[]> {
  try {
    const response = await api.get('/common/categories/');
    if (response.data.status === 'success') {
      return response.data.categories;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Gets industry display name by key
 * @param key - Industry key
 * @param industries - Array of industries
 * @returns string - Display name or key if not found
 */
export function getIndustryDisplayName(key: string, industries: IndustryCategory[]): string {
  const industry = industries.find(i => i.key === key);
  return industry ? industry.name : key;
}

/**
 * Converts industries array to options format for Select components
 * @param industries - Array of industries
 * @returns Array of options with value and label
 */
export function industriesToOptions(industries: IndustryCategory[]) {
  return industries.map(industry => ({
    value: industry.key,
    label: industry.name
  }));
}
