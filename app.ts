import express from 'express';
import { eventEmitter } from './events';
import { fetchPrDiffs, fetchReviewRequests, fetchUserRepositories } from './github/github.api';

// Start express app
const app = express();

eventEmitter.on('start:polling:github', async () => {


    try {
        // 1. Fetch all repos where the bot is the assigned reviewer
        const repos = await fetchReviewRequests();//await fetchUserRepositories();
        console.log(`**** ${repos.length} REPOS FOUND REQUIRING REVIEW *****`);
        console.log('--------------------------------------------------------------------------------------------')
        repos.forEach(r => {
            console.log('Id: ', r.id)
            console.log('Title: ', r.title);
            console.log('URL: ', r.url);
            console.log(r)
            console.log('--------------------------------------------------------------------------------------------')
        })
        const results = [];

        // 2. Push each PR job to the queue
        // 2. Fetch diffs for each matching PR
        await fetchPrDiffs(repos[0])


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