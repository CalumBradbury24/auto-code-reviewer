
import logger from 'logger';
import { redisConnection } from './config';
import { Queue } from 'bullmq';
const reviewQueue = new Queue('review-queue', { connection: redisConnection });

// Wait for Redis connection
reviewQueue.waitUntilReady()
    .then(() => {
        logger.info('✓ BullMQ queue connected to Redis successfully');
    })
    .catch((err) => {
        logger.error('✗ BullMQ queue connection failed:', err);
    });

reviewQueue.on('error', (err) => {
    logger.error('✗ BullMQ queue error:', err);
    process.exit(1);
});
// reviewQueue will queue jobs internally until redis is ready, no need to waitUntilReady before using it
export { reviewQueue };
