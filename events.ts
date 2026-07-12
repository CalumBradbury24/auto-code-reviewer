import { EventEmitter } from 'node:events'

export const eventEmitter = new EventEmitter();

export async function startGithubPolling() {
    eventEmitter.emit('start:polling:github');
    setTimeout(startGithubPolling, 3_600_000); // Poll every hour
}
