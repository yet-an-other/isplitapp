import { SeverityNumber } from '@opentelemetry/api-logs';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { 
    BatchSpanProcessor,
    WebTracerProvider 
} from '@opentelemetry/sdk-trace-web';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions';

// OS type values as per OpenTelemetry semantic conventions
const OS_TYPE_VALUES = {
  DARWIN: 'darwin',
  WINDOWS: 'windows',
  LINUX: 'linux',
  WEB: 'web'
} as const;
import { OTELCOL_URL } from './apiConfig';

type ConsoleMethod = 'log' | 'error' | 'warn' | 'debug';
type OriginalConsole = Record<ConsoleMethod, (...args: unknown[]) => void>;



//const OTELCOL_URL = import.meta.env.VITE_OTEL_COLLECTOR_URL as string;
const VERSION = import.meta.env.VITE_VERSION as string;
const w = window as unknown as { webkit: unknown};

const getOSType = (): string => {
  if (w.webkit) return OS_TYPE_VALUES.DARWIN; // iOS runs on Darwin
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return OS_TYPE_VALUES.WINDOWS;
    if (userAgent.includes('linux')) return OS_TYPE_VALUES.LINUX;
    if (userAgent.includes('mac')) return OS_TYPE_VALUES.DARWIN;
  }
  return OS_TYPE_VALUES.WEB;
};

const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "iSplitApp-web",
    [ATTR_SERVICE_VERSION]: VERSION || "unknown",
    'os.type': getOSType(),
  })
);

let isInitialized = false;
const originalConsole: OriginalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  debug: console.debug.bind(console),
};

/***
 * Enable OpenTelemetry logging
 */
/**
 * Initialize OpenTelemetry logging with console interception
 * @returns Promise that resolves when logging is initialized
 */
export function initLogExporter(): void {
    if (!OTELCOL_URL) {
        console.warn('OpenTelemetry: OTELCOL_URL not configured, skipping log exporter initialization');
        return;
    }

    try {
        const collectorOptions = {
            url: `${OTELCOL_URL}/v1/logs`,
            headers: {}, 
            concurrencyLimit: 1, 
        };
        const logExporter = new OTLPLogExporter(collectorOptions);

        const batchProcessor = new BatchLogRecordProcessor(logExporter);
        const loggerProvider = new LoggerProvider({ 
            resource,
            processors: [batchProcessor]
        });
        const logger = loggerProvider.getLogger('iSplitApp-web', VERSION || '1.0.0');
        
        const emit = (severityNumber: SeverityNumber, ...args: unknown[]) => {
            try {
                const deviceId = window?.localStorage?.getItem('device-id') ?? 'unknown';
                    
                logger.emit({
                    severityNumber: severityNumber,
                    severityText: SeverityNumber[severityNumber],
                    body: args.length === 1 ? String(args[0]) : args.map(arg => String(arg)).join(' '),
                    attributes: {
                        deviceId,
                        timestamp: Date.now(),
                    }
                });
            } catch (e) {
                originalConsole.error(`OpenTelemetry emit error: ${String(e)}`);
            }
        };

        // Intercept console methods
        console.log = (...args: unknown[]) => {
            originalConsole.log(...args);
            emit(SeverityNumber.INFO, ...args);
        };

        console.error = (...args: unknown[]) => {
            originalConsole.error(...args);
            emit(SeverityNumber.ERROR, ...args);
        };

        console.warn = (...args: unknown[]) => {
            originalConsole.warn(...args);
            emit(SeverityNumber.WARN, ...args);
        };

        console.debug = (...args: unknown[]) => {
            originalConsole.debug(...args);
            emit(SeverityNumber.DEBUG, ...args);
        };

        console.log('OpenTelemetry logging initialized successfully');
    } catch (error) {
        console.error('Failed to initialize OpenTelemetry logging:', error);
    }
}

export let traceProvider: WebTracerProvider;

/**
 * Initialize OpenTelemetry tracing
 * @returns Promise that resolves to WebTracerProvider or undefined if initialization fails
 */
export function initTraceProvider(): WebTracerProvider | undefined {
    if (!OTELCOL_URL) {
        console.warn('OpenTelemetry: OTELCOL_URL not configured, skipping trace provider initialization');
        return undefined;
    }

    try {
        const collectorOptions = {
            url: `${OTELCOL_URL}/v1/traces`,
            headers: {}, 
            concurrencyLimit: 10, 
        };

        const exporter = new OTLPTraceExporter(collectorOptions);
        const batchSpanProcessor = new BatchSpanProcessor(exporter, {
            maxQueueSize: 100,
            maxExportBatchSize: 10,
            scheduledDelayMillis: 500,
            exportTimeoutMillis: 30000,
        });
        
        const provider = new WebTracerProvider({ 
            resource,
            spanProcessors: [batchSpanProcessor]
        });
        
        provider.register({
            contextManager: new ZoneContextManager(),
            propagator: new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
        });
        
        // Register instrumentations
        registerInstrumentations({
            instrumentations: [
                new DocumentLoadInstrumentation(),
                new FetchInstrumentation({
                    propagateTraceHeaderCorsUrls: [
                        /https:\/\/api\.isplit\.app(\S*)/,
                        /https:\/\/isplit-api\.bdgn\.me(\S*)/,
                        /http:\/\/localhost(\S*)/
                    ],
                    clearTimingResources: true,
                })
            ],
        });

        traceProvider = provider;
        console.log('OpenTelemetry tracing initialized successfully');
        return provider;
    } catch (error) {
        console.error('Failed to initialize OpenTelemetry tracing:', error);
        return undefined;
    }
}

/**
 * Initialize both OpenTelemetry logging and tracing
 * @returns Promise that resolves when initialization is complete
 */
export function initOpenTelemetry(): void {
    if (isInitialized) {
        console.warn('OpenTelemetry already initialized');
        return;
    }

    try {
        initLogExporter();
        initTraceProvider();
        isInitialized = true;
        console.log('OpenTelemetry initialization completed');
    } catch (error) {
        console.error('OpenTelemetry initialization failed:', error);
    }
}

/**
 * Restore original console methods (useful for cleanup)
 */
export function restoreConsole(): void {
    if (typeof window !== 'undefined') {
        Object.assign(console, originalConsole);
        console.log('Console methods restored to original state');
    }
}