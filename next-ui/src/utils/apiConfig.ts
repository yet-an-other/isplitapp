/**
 * Runtime configuration interface
 */
interface RuntimeConfig {
    VITE_API_URL: string;
    [key: string]: string;
}

/**
 * Global runtime configuration that can be set by deployment scripts
 */
declare global {
    interface Window {
        __RUNTIME_CONFIG__?: RuntimeConfig;
    }
}

/**
 * Gets the API URL with runtime configuration support
 * 
 * Fallback hierarchy:
 * 1. Runtime configuration from window.__RUNTIME_CONFIG__ (set by deployment script)
 * 2. Build-time environment variables from Vite (.env files)
 * 
 * @returns The configured API URL
 * @throws Error when no API URL is configured
 */
export const getApiUrl = (): string => {
    // Check runtime configuration from deployment script
    if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.VITE_API_URL) {
        return window.__RUNTIME_CONFIG__.VITE_API_URL;
    }
    
    // Fall back to build-time environment variables
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    throw new Error('VITE_API_URL environment variable is not configured');
};

export const getOtelUrl = (): string => {
    // Check runtime configuration from deployment script
    if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.VITE_OTEL_COLLECTOR_URL) {
        return window.__RUNTIME_CONFIG__.VITE_OTEL_COLLECTOR_URL;
    }
    
    // Fall back to build-time environment variables
    if (import.meta.env.VITE_OTEL_COLLECTOR_URL) {
        return import.meta.env.VITE_OTEL_COLLECTOR_URL;
    }
    return "";
};


/**
 * The configured API URL for the application
 */
export const API_URL = getApiUrl();

/**
 * The configured OpenTelemetry collector URL for the application
 */
export const OTELCOL_URL = getOtelUrl();
