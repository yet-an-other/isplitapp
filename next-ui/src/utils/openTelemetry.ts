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

import format from 'format-util';


const API_URL = import.meta.env.VITE_API_URL as string;
const VERSION = import.meta.env.VITE_VERSION as string;
const w = window as unknown as { webkit: unknown};
const OTEL_PORT = "4318"

const resource = new Resource({
    "service.name": "isplit.app-web",
    "service.version": VERSION,
    "service.host_os": w.webkit ? "ios" : "web",
});

export function initLogExporter() {

    // exporter options. see all options in OTLPExporterConfigBase
    //
    const collectorOptions = {
        url: `${API_URL}:${OTEL_PORT}/v1/logs`,
        headers: {}, // an optional object containing custom headers to be sent with each request
        concurrencyLimit: 1, // an optional limit on pending requests
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
    const emit = (severityNumber: SeverityNumber, ...args: [any?, ...any[]]) =>{
        logger.emit({
            severityNumber: severityNumber,
            severityText: SeverityNumber[severityNumber],
            body: format(args[0] as string, args),
            attributes: {
                "deviceId": localStorage.getItem('user-id') ?? 'unknown',
            }
        });
    }    
}


export function initTraceExporter() {

    const collectorOptions = {
      url: `${API_URL}:${OTEL_PORT}/v1/traces`,
      headers: {}, // an optional object containing custom headers to be sent with each request
      concurrencyLimit: 10, // an optional limit on pending requests
    };
    const exporter = new OTLPTraceExporter(collectorOptions);
  
    const provider = new WebTracerProvider({resource});
    provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
      // The maximum queue size. After the size is reached spans are dropped.
      maxQueueSize: 100,
      // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
      maxExportBatchSize: 10,
      // The interval between two consecutive exports
      scheduledDelayMillis: 500,
      // How long the export can run before it is cancelled
      exportTimeoutMillis: 30000,
    }));
    
    provider.register({
      // Changing default contextManager to use ZoneContextManager - supports asynchronous operations - optional
      contextManager: new ZoneContextManager(),
    });
    
    // Registering instrumentations
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation()
      ],
    });
  }