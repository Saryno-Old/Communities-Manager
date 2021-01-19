import { createLogger, format, transport, transports } from 'winston';
const { combine, label, timestamp, metadata, colorize } = format;

import { LoggingWinston } from '@google-cloud/logging-winston';

const logFormat = format.printf(
  info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`,
);

const usedTransports: transport[] = [];

if (Boolean(process.env.LOG_CONSOLE) === true) {
  usedTransports.push(
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
  );
}

if (Boolean(process.env.GOOGLE_WINSTON) === true) {
  const loggingWinston = new LoggingWinston();
  usedTransports.push(loggingWinston);
}

if (process.env.LOG_FILE !== undefined) {
  const fileLogging = new transports.File({
    filename: process.env.LOG_FILE,
    format: format.combine(
      label({ label: 'request_response' }),
      timestamp(),
      metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      format.json(),
    ),
  });
  usedTransports.push(fileLogging);
}

export const Logger = createLogger({
  level: 'info',
  transports: usedTransports,
});
