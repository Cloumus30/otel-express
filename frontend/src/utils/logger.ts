import { SeverityNumber } from '@opentelemetry/api-logs';
import { trace, context } from '@opentelemetry/api';
import { frontendLogger } from '../instrumentation';

export type LogAttributes = Record<string, any>;

const MAX_STRING_LENGTH = 1000;
const MAX_OBJECT_SERIALIZED_LENGTH = 1500;

/**
 * Mengambil trace_id dan span_id dari active span jika tersedia
 */
function getTraceContext(): LogAttributes {
  const activeSpan = trace.getActiveSpan();
  const spanContext = activeSpan?.spanContext();
  if (!spanContext || !spanContext.traceId) return {};

  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

/**
 * Mengambil metadata lingkungan browser otomatis untuk konteks log.
 */
function getBrowserContext(): LogAttributes {
  if (typeof window === 'undefined') return {};

  return {
    'browser.url': window.location.href,
    'browser.pathname': window.location.pathname,
    'browser.user_agent': window.navigator.userAgent,
    'browser.language': window.navigator.language,
  };
}

/**
 * Memotong string jika melebihi batas aman untuk mencegah overhead bandwidth.
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}... [Truncated: ${str.length} chars]`;
}

/**
 * Sanitasi dan normalisasi atribut agar aman dikirim ke OpenTelemetry:
 * - Menghapus nilai null/undefined
 * - Mencegah error circular references
 * - Membatasi ukuran payload (mencegah base64/blob besar memperlambat browser)
 */
function normalizeAttributes(attributes?: LogAttributes): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  if (!attributes) return result;

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      result[key] = truncateString(value, MAX_STRING_LENGTH);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
    } else if (typeof value === 'object') {
      try {
        const jsonStr = JSON.stringify(value);
        result[key] = truncateString(jsonStr, MAX_OBJECT_SERIALIZED_LENGTH);
      } catch {
        result[key] = '[Unserializable Object]';
      }
    } else {
      result[key] = String(value);
    }
  }

  return result;
}

/**
 * Standard Structured Logger untuk React & OpenTelemetry / OpenObserve.
 */
export const logger = {
  /**
   * Log level DEBUG: Hanya aktif di environment non-production (development).
   * Otomatis diabaikan di production untuk menghemat resource dan bandwidth.
   */
  debug(message: string, attributes?: LogAttributes) {
    if (import.meta.env.PROD) {
      return; // Skip DEBUG log di production
    }

    frontendLogger.emit({
      severityNumber: SeverityNumber.DEBUG,
      severityText: 'DEBUG',
      body: truncateString(message, MAX_STRING_LENGTH),
      attributes: normalizeAttributes({
        ...getBrowserContext(),
        ...getTraceContext(),
        ...attributes,
      }),
      context: context.active(),
    });
  },

  /**
   * Log level INFO: Peristiwa normal dalam aplikasi (user action, page load, success event).
   */
  info(message: string, attributes?: LogAttributes) {
    frontendLogger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: truncateString(message, MAX_STRING_LENGTH),
      attributes: normalizeAttributes({
        ...getBrowserContext(),
        ...getTraceContext(),
        ...attributes,
      }),
      context: context.active(),
    });
  },

  /**
   * Log level WARN: Situasi tidak ideal atau potensi masalah (validasi gagal, fallback aktif, retry).
   */
  warn(message: string, attributes?: LogAttributes) {
    frontendLogger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: 'WARN',
      body: truncateString(message, MAX_STRING_LENGTH),
      attributes: normalizeAttributes({
        ...getBrowserContext(),
        ...getTraceContext(),
        ...attributes,
      }),
      context: context.active(),
    });
  },

  /**
   * Log level ERROR: Kegagalan operasi atau exception (API failure, crash, boundary error).
   */
  error(
    message: string,
    errorOrAttributes?: Error | LogAttributes,
    extraAttributes?: LogAttributes
  ) {
    const isErrorInstance = errorOrAttributes instanceof Error;
    const errorDetails: LogAttributes = {};

    if (isErrorInstance) {
      errorDetails['error.name'] = errorOrAttributes.name;
      errorDetails['error.message'] = errorOrAttributes.message;
      if (errorOrAttributes.stack) {
        errorDetails['error.stack'] = truncateString(errorOrAttributes.stack, 2000);
      }
    }

    const mergedAttributes = {
      ...getBrowserContext(),
      ...getTraceContext(),
      ...errorDetails,
      ...(isErrorInstance ? extraAttributes : errorOrAttributes),
    };

    frontendLogger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: truncateString(message, MAX_STRING_LENGTH),
      attributes: normalizeAttributes(mergedAttributes),
      context: context.active(),
    });
  },
};

// Pasang Global Unhandled Exception & Promise Rejection Handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled Window Error', event.error || new Error(event.message), {
      'error.filename': event.filename,
      'error.lineno': event.lineno,
      'error.colno': event.colno,
      unhandled: true,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled Promise Rejection', err, {
      unhandled: true,
    });
  });
}
