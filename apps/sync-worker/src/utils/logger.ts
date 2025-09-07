/**
 * Simple logging utility to replace console statements
 * This provides a cleaner interface while maintaining stdout/stderr semantics
 */

export const logger = {
    info: (message: string, ...args: unknown[]) => {
        const formattedMessage = args.length > 0 
            ? `${message} ${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')}`
            : message;
        process.stdout.write(`[INFO] ${formattedMessage}\n`);
    },

    warn: (message: string, ...args: unknown[]) => {
        const formattedMessage = args.length > 0 
            ? `${message} ${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')}`
            : message;
        process.stderr.write(`[WARN] ${formattedMessage}\n`);
    },

    error: (message: string, ...args: unknown[]) => {
        const formattedMessage = args.length > 0 
            ? `${message} ${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')}`
            : message;
        process.stderr.write(`[ERROR] ${formattedMessage}\n`);
    },

    debug: (message: string, ...args: unknown[]) => {
        if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
            const formattedMessage = args.length > 0 
                ? `${message} ${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')}`
                : message;
            process.stdout.write(`[DEBUG] ${formattedMessage}\n`);
        }
    },

    log: (message: string, ...args: unknown[]) => {
        const formattedMessage = args.length > 0 
            ? `${message} ${args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')}`
            : message;
        process.stdout.write(`${formattedMessage}\n`);
    }
};