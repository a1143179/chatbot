// Simple Azure Functions logger utility
// This can be used in modules that don't have access to the context object

export const azureLogger = {
    info: (message, data = null) => {
        const logEntry = data ? `${message} | Data: ${JSON.stringify(data)}` : message;
        console.log(`[INFO] ${logEntry}`);
    },
    warn: (message, data = null) => {
        const logEntry = data ? `${message} | Data: ${JSON.stringify(data)}` : message;
        console.warn(`[WARN] ${logEntry}`);
    },
    error: (message, data = null) => {
        const logEntry = data ? `${message} | Data: ${JSON.stringify(data)}` : message;
        console.error(`[ERROR] ${logEntry}`);
    },
    debug: (message, data = null) => {
        const logEntry = data ? `${message} | Data: ${JSON.stringify(data)}` : message;
        console.log(`[DEBUG] ${logEntry}`);
    }
};

export default azureLogger; 