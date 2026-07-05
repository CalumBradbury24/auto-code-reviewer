import './config';
import logger from 'logger';
import { startGithubPolling } from './events';

process.on("uncaughtException", (err: Error) => {
    logger.error(`Uncaught exception, server closing down: ${err}`);
    process.exit(1);
});


import app from './app'; //Use the app for this server

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, (err) => {
    if (err) throw err;
    logger.info(`server listening on port ${PORT}`);
    startGithubPolling();
});

process.on("unhandledRejection", (err: Error) => {
    logger.error(`Unhandled rejection, server closing down: ${err}`);
    server.close(() => {
        //Server.close gives the server time to finish all the requests that are still processing/pending before closing
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    logger.warn("SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        process.exit(1);
    });
});