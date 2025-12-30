// LocalStorage utilities for data and URL persistence

const STORAGE_KEY = 'cloud-armor-dashboard-data';
const URL_STORAGE_KEY = 'cloud-armor-dashboard-url';

export interface StoredData {
    rules: string;
    timestamp: number;
    source: 'sheets' | 'upload';
}

export function saveDataToStorage(rules: unknown[], source: 'sheets' | 'upload'): void {
    try {
        const data: StoredData = {
            rules: JSON.stringify(rules),
            timestamp: Date.now(),
            source,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save data to localStorage:', error);
    }
}

export function loadDataFromStorage(): StoredData | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const data: StoredData = JSON.parse(stored);

        // Data expires after 7 days
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp > sevenDays) {
            clearStoredData();
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to load data from localStorage:', error);
        return null;
    }
}

export function clearStoredData(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
    }
}

// URL Storage
export function saveSheetURL(url: string): void {
    try {
        localStorage.setItem(URL_STORAGE_KEY, url);
    } catch (error) {
        console.error('Failed to save URL to localStorage:', error);
    }
}

export function loadSheetURL(): string | null {
    try {
        return localStorage.getItem(URL_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to load URL from localStorage:', error);
        return null;
    }
}

export function clearSheetURL(): void {
    try {
        localStorage.removeItem(URL_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear URL from localStorage:', error);
    }
}

export function getStoredTimestamp(): Date | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        const data: StoredData = JSON.parse(stored);
        return new Date(data.timestamp);
    } catch {
        return null;
    }
}
