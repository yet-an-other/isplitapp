/**
 * Gets the API URL from environment variables with fallback support
 * 
 * @remarks
 * First checks runtime environment variables, then falls back to .env files.
 * In Vite, import.meta.env.VITE_API_URL already includes .env file values,
 * but this function provides explicit fallback handling.
 * 
 * @returns The configured API URL
 * @throws Error when no API URL is configured
 */
export const getApiUrl = (): string => {
    // First check if there's a runtime environment variable (process.env for Node.js contexts)
    if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
        return process.env.VITE_API_URL;
    }
    
    // Fall back to Vite's environment (which includes .env files)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Final fallback if no API URL is configured
    throw new Error('VITE_API_URL environment variable is not configured');
};

/**
 * The configured API URL for the application
 * 
 * @remarks
 * This constant is initialized once when the module is loaded and provides
 * a cached reference to the API URL for use throughout the application.
 */
export const API_URL = getApiUrl();
