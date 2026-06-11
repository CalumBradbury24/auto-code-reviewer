import express from 'express';
import { eventEmitter } from './events';

// Start express app
const app = express();

eventEmitter.on('start:polling:github', () => {
    console.log('STARTING GITHUB POLLING')
})



export default app;




/*
server starts
kicks off polling
pulls in all prs the review bot is assigned to
queues them
kicks off review 1
posts comments and finishes
kicks off next review
if next poll occurs during this time we simply add new PRs to the end of the queue


See requirements.md 
have a dry run mode where reviews are not pushed to github for testing.
*/