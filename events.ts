import { EventEmitter } from 'events';

export const eventEmitter = new EventEmitter();

export function startGithubPolling() {
    eventEmitter.emit('start:polling:github');
}
