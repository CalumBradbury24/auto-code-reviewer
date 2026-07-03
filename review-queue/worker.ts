import { Worker } from 'bullmq';
import { redisConnection } from './config';
import { fetchPrDiffs } from 'github/github.api';

// Create worker that processes jobs synchronously (one at a time)
const reviewWorker = new Worker(
    'review-queue',
    async (job) => {
        console.log(`\n🔄 Processing job ${job.id}...`);
        console.log('Job data:', job.data);

        const { repoUrl, prNumber } = job.data;

        await fetchPrDiffs({ repository_url: repoUrl, pr_number: prNumber })


        // await performCodeReview(repoId, title, url);

        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`✅ Completed job ${job.id}`);
        return { success: true };
    },
    {
        connection: redisConnection,
        concurrency: 1, // Process one job at a time (synchronously)
    }
);

// Worker event listeners
reviewWorker.on('completed', (job) => {
    console.log(`✓ Job ${job.id} completed successfully`);
});

reviewWorker.on('failed', (job, err) => {
    console.error(`✗ Job ${job?.id} failed:`, err.message);
});

reviewWorker.on('ready', () => {
    console.log('✓ Worker connected and ready to process jobs');
});

reviewWorker.on('error', (err) => {
    console.error('✗ Worker error:', err);
});

export { reviewWorker };
