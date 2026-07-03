import { Octokit } from 'octokit';
import { AuthedUserListReposResponse, SearchIssuesAndPrsGetResponseItems } from './types';

const githubApi = new Octokit({
    auth: process.env.GITHUB_REVIEW_BOT_TOKEN, //process.env.GITHUB_API_TOKEN
}).rest;


function parseData(data) {
    // If the data is an array, return that
    if (Array.isArray(data)) {
        return data
    }

    // Some endpoints respond with 204 No Content instead of empty array
    //   when there is no data. In that case, return an empty array.
    if (!data) {
        return []
    }

    // Otherwise, the array of items that we want is in an object
    // Delete keys that don't include the array of items
    delete data.incomplete_results;
    delete data.repository_selection;
    delete data.total_count;
    // Pull out the array of items
    const namespaceKey = Object.keys(data)[0];
    data = data[namespaceKey];

    return data;
}

type getPaginatedDataProps = {
    apiFunction: (options: {}) => {},
    options: {
        per_page: number;
        page: number;
        q?: string;
        affiliation?: string;
    }
}

const getPaginatedData = async ({ apiFunction, options }: getPaginatedDataProps) => {
    let pagesRemaining = true;
    let data = [];

    while (pagesRemaining) {
        console.log('Fetching page: ', options.page || '1')
        const response = await apiFunction(options);

        const parsedData = parseData(response.data)
        data = [...data, ...parsedData];

        const linkHeader = response.headers.link;

        pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
        if (pagesRemaining) {
            const page = linkHeader.match(/<[^>]*page=(\d+)>;\s*rel="next"/)[1];
            options = { ...options, page }
        }
    }

    return data;
}

export async function fetchUserRepositories(): Promise<AuthedUserListReposResponse> {
    const owner = process.env.GITHUB_OWNER;
    if (!owner) throw new Error('No repository owner found for fetchUserRepositories');
    const response = await getPaginatedData({
        apiFunction: githubApi.repos.listForAuthenticatedUser, options: {
            affiliation: 'owner',
            per_page: 5,
            page: 1
        }
    })

    return response;
}

// Get all open PRs with review requests for this bot
export async function fetchReviewRequests() {
    const response = await getPaginatedData({
        apiFunction: githubApi.search.issuesAndPullRequests, options: {
            q: 'is:pr is:open review-requested:@me', // Get all PRs the review bot is assigned as reviewer to
            per_page: 50, // Return up to 50 per request
            page: 1 // Start at first page of data
        }
    });

    return response;
}

type fetchPrDiffsProps = {
    repository_url: SearchIssuesAndPrsGetResponseItems[number]['repository_url'],
    pr_number: SearchIssuesAndPrsGetResponseItems[number]['number'],

}
export async function fetchPrDiffs({ repository_url, pr_number }: fetchPrDiffsProps) {
    const repoUrl = repository_url.match(/repos\/([^/]+)\/([^/]+)/);

    if (!repoUrl) throw new Error(`Could not parse owner and repo from URL: ${repoUrl}`);
    const [, owner, repo] = repoUrl;

    const { data: diff } = await githubApi.pulls.get({
        owner,
        repo,
        pull_number: pr_number,
        mediaType: { format: "diff" }
    });

    console.log('DIFFF --->>> ', diff)
    return diff;
}