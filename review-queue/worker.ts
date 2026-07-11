import logger from 'logger';
import { Worker } from 'bullmq';
import { redisConnection } from './config';
import { fetchPrDiffs, postReview } from 'github/github.api';
import { getCodeReview } from 'review-service/llm-service';
import { CodeReviewResult } from 'review-service/types';

// Create worker that processes jobs synchronously (one at a time)
const reviewWorker = new Worker(
    'review-queue',
    async (job) => {
        logger.info(`\n🔄 Processing job ${job.id}...`);
        logger.info('Job data:', job.data);

        const { repoUrl, prNumber } = job.data;

        const diffs = await fetchPrDiffs({ repository_url: repoUrl, pr_number: prNumber });
        if (!diffs.length) {
            console.warn('No diffs found for review');
            return { success: true };
        }

        logger.info(`Getting review for ${repoUrl}`)
        const { summary, positives, comments, overallRecommendation }: CodeReviewResult = await getCodeReview(diffs);

        // Format summary with positives if any
        let reviewSummary = summary;
        if (positives.length > 0) {
            reviewSummary += '\n\n## Positive Observations\n';
            reviewSummary += positives.map(p => `- ${p}`).join('\n');
        }

        await postReview({ repository_url: repoUrl, pr_number: prNumber, reviewSummary, comments, event: overallRecommendation });

        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 3000));

        logger.info(`✅ Completed job ${job.id}`);
        return { success: true };
    },
    {
        connection: redisConnection,
        concurrency: 1, // Process one job at a time (synchronously)
    }
);

// Worker event listeners
reviewWorker.on('completed', (job) => {
    logger.info(`✓ Job ${job.id} completed successfully`);
});

reviewWorker.on('failed', (job, err) => {
    logger.error(`✗ Job ${job?.id} failed:`, err.message);
});

reviewWorker.on('ready', () => {
    logger.info('✓ Worker connected and ready to process jobs');
});

reviewWorker.on('error', (err) => {
    logger.error('✗ Worker error:', err);
});

export { reviewWorker };
