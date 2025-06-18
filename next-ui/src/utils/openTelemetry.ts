import { SeverityNumber } from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';
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
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_OS_TYPE
} from '@opentelemetry/semantic-conventions';
import { OTELCOL_URL } from './apiConfig';



//const OTELCOL_URL = import.meta.env.VITE_OTEL_COLLECTOR_URL as string;
const VERSION = import.meta.env.VITE_VERSION as string;
const w = window as unknown as { webkit: unknown};

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "iSplitApp-web",
    [SEMRESATTRS_SERVICE_VERSION]: VERSION,
    [SEMRESATTRS_OS_TYPE]: w.webkit ? "ios" : "web",
  }),
);

/***
 * Enable OpenTelemetry logging
 */
export function initLogExporter() {

    // exporter options. see all options in OTLPExporterConfigBase
    //
    const collectorOptions = {
        url: `${OTELCOL_URL}/v1/logs`,
        headers: {}, 
        concurrencyLimit: 1, 
    };
    const logExporter = new OTLPLogExporter(collectorOptions);

    const loggerProvider = new LoggerProvider({ resource });
    loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
    const logger = loggerProvider.getLogger('default', '1.0.0');
    

    // intercept console.log
    //
    const log = console.log.bind(console);
    console.log = (...args) => {
        log(...args)
        emit(SeverityNumber.INFO, ...args)
    }

    const error = console.error.bind(console);
    console.error = (...args) => {
        error(...args)
        emit(SeverityNumber.ERROR, ...args)
    }

    const warn = console.warn.bind(console);
    console.error = (...args) => {
        warn(...args)
        emit(SeverityNumber.WARN, ...args)
    }

    const debug = console.debug.bind(console);
    console.error = (...args) => {
        debug(...args)
        emit(SeverityNumber.DEBUG, ...args)
    }    

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emit = (severityNumber: SeverityNumber, ...args: [any?, ...any[]]) => {

      try {
        logger.emit({
            severityNumber: severityNumber,
            severityText: SeverityNumber[severityNumber],
            body: args, // format(args[0] as string, args),
            attributes: {
                "deviceId": localStorage.getItem('device-id') ?? 'unknown',
            }
        });
      } catch (e) {
        console.error(`Error in emit: ${e as string}`);
      }
    }
}

export let traceProvider: WebTracerProvider;

/**
 * Enable OpenTelemetry tracing
 * @returns WebTracerProvider
 */
export function initTraceProvider() {

    const collectorOptions = {
      url: `${OTELCOL_URL}/v1/traces`,
      headers: {}, 
      concurrencyLimit: 10, 
    };

    const exporter = new OTLPTraceExporter(collectorOptions);

    const provider = new WebTracerProvider({resource});
    provider.addSpanProcessor(
      new BatchSpanProcessor(
        exporter, {

          // The maximum queue size. After the size is reached spans are dropped.
          //
          maxQueueSize: 100,

          // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
          //
          maxExportBatchSize: 10,

          // The interval between two consecutive exports
          //
          scheduledDelayMillis: 500,

          // How long the export can run before it is cancelled
          //
          exportTimeoutMillis: 30000,
        }
      )
    );
    
    provider.register({

      // Changing default contextManager to use ZoneContextManager - supports asynchronous operations
      //
      contextManager: new ZoneContextManager(),
      propagator: new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
    });
    
    // Registering instrumentations
    //
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation(
          {
            propagateTraceHeaderCorsUrls: [/https:\/\/api.isplit.app(\S*)/, /https:\/\/apidev.isplit.app(\S*)/, /http:\/\/localhost(\S*)/],
            clearTimingResources: true,
          }
        )
      ],
    });

    traceProvider = provider;
    return provider;
  }