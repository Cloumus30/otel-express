import { useMemo } from 'react';
import { logger } from '../utils/logger';
import type { LogAttributes } from '../utils/logger';

/**
 * Hook untuk logging di dalam komponen React.
 * Otomatis menyisipkan atribut `component` ke setiap log record.
 *
 * Contoh penggunaan:
 * ```tsx
 * const log = useLogger('UserListPage');
 * log.info('Pengguna membuka halaman daftar user', { page: 1 });
 * log.error('Gagal mengambil data user', error);
 * ```
 */
export function useLogger(componentName: string) {
  return useMemo(() => {
    return {
      debug(message: string, attributes?: LogAttributes) {
        logger.debug(message, {
          component: componentName,
          ...attributes,
        });
      },

      info(message: string, attributes?: LogAttributes) {
        logger.info(message, {
          component: componentName,
          ...attributes,
        });
      },

      warn(message: string, attributes?: LogAttributes) {
        logger.warn(message, {
          component: componentName,
          ...attributes,
        });
      },

      error(
        message: string,
        errorOrAttributes?: Error | LogAttributes,
        extraAttributes?: LogAttributes
      ) {
        if (errorOrAttributes instanceof Error) {
          logger.error(message, errorOrAttributes, {
            component: componentName,
            ...extraAttributes,
          });
        } else {
          logger.error(message, {
            component: componentName,
            ...errorOrAttributes,
          });
        }
      },
    };
  }, [componentName]);
}
