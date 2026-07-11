import express from 'express';
import logger from 'logger';

import { eventEmitter } from './events';
import { reviewQueue } from './review-queue/queue';
import { fetchReviewRequests } from './github/github.api';
import { ensureModelReady } from 'llm-service';

// Start express app
const app = express();

eventEmitter.on('start:polling:github', async () => {
    await reviewQueue.obliterate({ force: true }); // clean queue for testing

    logger.info(`------------------------------- Github Review Process Starting... ------------------------- \n`)
    try {
        // 1. Get all available models and return the first one that is ready to process a review
        await ensureModelReady();

        // 2. Fetch all repos where the bot is the assigned reviewer
        const repos = await fetchReviewRequests();//await fetchUserRepositories();
        logger.info(`------------------------------- ${repos.length} REPOS FOUND REQUIRING REVIEW ------------------------- \n`)

        // 3. Push each PR job to the queue
        for (const repo of repos) {
            console.log('Title: ', repo.title);
            console.log('URL: ', repo.url);
            //console.log(repo)
            await reviewQueue.add(
                'github-review',
                { repoId: repo.id, repoUrl: repo.repository_url, prNumber: repo.number },
                { jobId: `pr-${repo.id}` } // used for deduplication
            );
            logger.info(`------------------------------- ${repo.title} PUSHED TO QUEUE ------------------------- \n`)
        }

        // console.log(await reviewQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'));

        // 4. Import and start worker
        await import('./review-queue/worker');




        // for (const pr of assigned) {
        //     const diff = await octokit.request(
        //         "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        //         {
        //             owner,
        //             repo: repo.name,
        //             pull_number: pr.number,
        //             headers: {
        //                 accept: "application/vnd.github.v3.diff"
        //             }
        //         }
        //     );

        //console.log(`Success! Status: ${result.status}. Rate limit remaining: ${result.headers["x-ratelimit-remaining"]}`)
        //console.log(prs.data)
    } catch (err) {
        logger.error(err)
        //console.log(`Error! Status: ${err.status}. Rate limit remaining: ${err.headers["x-ratelimit-remaining"]}. Message: ${error.response.data.message}`)
    }
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