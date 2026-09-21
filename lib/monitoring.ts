type LogData = Record<string, string | number | boolean | null | undefined>;

function entry(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: LogData = {},
) {
  return JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function logInfo(event: string, data?: LogData) {
  console.log(entry('info', event, data));
}

export function logWarning(event: string, data?: LogData) {
  console.warn(entry('warn', event, data));
}

export function logError(event: string, error: unknown, data: LogData = {}) {
  console.error(
    entry('error', event, {
      ...data,
      error: error instanceof Error ? error.message : 'unknown error',
    }),
  );
}
