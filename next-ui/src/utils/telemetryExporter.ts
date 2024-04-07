import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
  
import { 
    BatchSpanProcessor,
    WebTracerProvider 
} from '@opentelemetry/sdk-trace-web';
import { Resource } from '@opentelemetry/resources';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
  
const API_URL = import.meta.env.VITE_API_URL as string;
const VERSION = import.meta.env.VITE_VERSION as string;
const w = window as unknown as { webkit: unknown};

export function initTelemetry() {

  const collectorOptions = {
    url: `${API_URL}:4318/v1/traces`,
    headers: {}, // an optional object containing custom headers to be sent with each request
    concurrencyLimit: 10, // an optional limit on pending requests
  };
  const exporter = new OTLPTraceExporter(collectorOptions);

  const resource = new Resource({
      "service.name": "isplit.app-web",
      "service.version": VERSION,
      "service.host_os": w.webkit ? "ios" : "web",
  });
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