import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'auto-code-reviewer' },
    transports:
        process.env.NODE_ENV === 'production'
            ? [
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                }),
            ]
            : [],
});

// If not in production, log to console with a simpler format
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.colorize({ level: true }),
                winston.format.printf(({ level, message, stack, timestamp, service, ...meta }) => {
                    // Map log levels to slightly darker color variants for the message text
                    const messageColors: { [key: string]: string } = {
                        error: '\x1b[91m',    // bright red (lighter than standard red)
                        warn: '\x1b[93m',     // bright yellow
                        info: '\x1b[92m',     // bright green
                        http: '\x1b[96m',     // bright cyan
                        verbose: '\x1b[94m',  // bright blue
                        debug: '\x1b[95m',    // bright magenta
                        silly: '\x1b[97m',    // bright white
                    };

                    const reset = '\x1b[0m';
                    const levelName = level.replace(/\x1b\[\d+m/g, '').trim();
                    const messageColor = messageColors[levelName] || reset;

                    let output = `${level} ${messageColor}${message}${reset}`;

                    // Include stack trace if present
                    if (stack) {
                        output += `\n${messageColor}${stack}${reset}`;
                    }

                    // Include additional metadata if present (excluding default meta)
                    if (Object.keys(meta).length > 0) {
                        output += `\n${messageColor}${JSON.stringify(meta, null, 2)}${reset}`;
                    }

                    return output;
                })
            ),
        })
    );
}

export default logger;
