
import { redisConnection } from './config';
import { Queue } from 'bullmq';
const reviewQueue = new Queue('review-queue', { connection: redisConnection });

// Wait for Redis connection
reviewQueue.waitUntilReady()
    .then(() => {
        console.log('✓ BullMQ queue connected to Redis successfully');
    })
    .catch((err) => {
        console.error('✗ BullMQ queue connection failed:', err);
    });

reviewQueue.on('error', (err) => {
    console.error('✗ BullMQ queue error:', err);
});
// reviewQueue will queue jobs internally until redis is ready, no need to waitUntilReady before using it
export { reviewQueue };
