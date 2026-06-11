process.on("uncaughtException", (error) => {
    console.log("uncaught exception - ...server closing down.");
    console.log(error.name, error.message); //Catch and log the error name and message
    process.exit(1);
});

import app from './app'; //Use the app for this server
import { startGithubPolling } from './events';

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`server listening on port ${PORT}`);
    startGithubPolling();
});

process.on("unhandledRejection", (err: Error) => {
    console.log("Unahndled rejection - ...server closing down.");
    console.log(err.message);
    server.close(() => {
        //Server.close gives the server time to finish all the requests that are still processing/pending before closing
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    console.log("SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        process.exit(1);
    });
});