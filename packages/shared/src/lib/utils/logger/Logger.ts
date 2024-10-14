export const LOGGER_SERVICE_NAME = 'CodyLogger';

export interface Logger {
  log: (...rest: unknown[]) => void;
  error: (...rest: unknown[]) => void;
  warn: (...rest: unknown[]) => void;
}
