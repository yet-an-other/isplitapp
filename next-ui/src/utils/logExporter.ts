import { SeverityNumber } from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

import format from 'format-util';


const API_URL = import.meta.env.VITE_API_URL as string;
const VERSION = import.meta.env.VITE_VERSION as string;
const w = window as unknown as { webkit: unknown};

export function initLogExporter() {

    // exporter options. see all options in OTLPExporterConfigBase
    //
    const collectorOptions = {
        url: `${API_URL}:4318/v1/logs`,
        headers: {}, // an optional object containing custom headers to be sent with each request
        concurrencyLimit: 1, // an optional limit on pending requests
    };
    const logExporter = new OTLPLogExporter(collectorOptions);

    const resource = new Resource({
        "service.name": "isplit.app-web",
        "service.version": VERSION,
        "service.host_os": w.webkit ? "ios" : "web",
    });
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

