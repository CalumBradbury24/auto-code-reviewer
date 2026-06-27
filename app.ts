import express from 'express';
import { eventEmitter } from './events';
import { fetchReviewRequests, fetchUserRepositories } from './github/github.api';

// Start express app
const app = express();

eventEmitter.on('start:polling:github', async () => {


    try {
        // 1. Fetch all repos where the bot is the assigned reviewer
        const repos = await fetchReviewRequests();//await fetchUserRepositories();
        repos.forEach(r => console.log(r.title))
        const results = [];

        // 2. For each repo, list PRs and filter by reviewer
        // for (const repo of repos.data) {
        //     const prs = await octokit.rest.pulls.list({
        //         owner,
        //         repo: repo.name,
        //         state: "open"
        //     });

        //     const assigned = prs.data.filter(pr =>
        //         pr.requested_reviewers.some(r => r.login === reviewer)
        //     );
        // }

        // 3. Fetch diffs for each matching PR
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
        console.log(err)
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