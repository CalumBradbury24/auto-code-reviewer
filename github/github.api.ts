import { Octokit } from 'octokit';
import { AuthedUserListReposResponse, SearchIssuesAndPrsGetResponseItems } from './types';
import logger from 'logger';
import { ReviewComment } from 'review-service/types';

const githubApi = new Octokit({
    auth: process.env.GITHUB_REVIEW_BOT_TOKEN, //process.env.GITHUB_API_TOKEN
}).rest;


function parseData(data: any) {
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
    if (!namespaceKey) return [];
    data = data[namespaceKey];

    return data;
}

type getPaginatedDataProps<T> = {
    apiFunction: (options: any) => Promise<{ data: any; headers: any }>,
    options: {
        per_page: number;
        page: number;
        q?: string;
        affiliation?: string;
    }
}

const getPaginatedData = async <T>({ apiFunction, options }: getPaginatedDataProps<T>): Promise<T[]> => {
    let pagesRemaining = true;
    let data: T[] = [];

    while (pagesRemaining) {
        logger.info('Fetching page: ', options.page || '1')
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
    const response = await getPaginatedData<AuthedUserListReposResponse[number]>({
        apiFunction: githubApi.repos.listForAuthenticatedUser, options: {
            affiliation: 'owner',
            per_page: 5,
            page: 1
        }
    })

    return response;
}

// Get all open PRs with review requests for this bot
export async function fetchReviewRequests(): Promise<SearchIssuesAndPrsGetResponseItems> {
    const response = await getPaginatedData<SearchIssuesAndPrsGetResponseItems[number]>({
        apiFunction: githubApi.search.issuesAndPullRequests, options: {
            q: 'is:pr is:open review-requested:@me', // Get all PRs the review bot is assigned as reviewer to
            per_page: 50, // Return up to 50 per request
            page: 1 // Start at first page of data
        }
    });

    return response;
}

const getPrRepoUrlInfo = (repository_url: SearchIssuesAndPrsGetResponseItems[number]['repository_url']) => {
    const repoUrl = repository_url.match(/repos\/([^/]+)\/([^/]+)/);
    if (!repoUrl) throw new Error(`Could not parse owner and repo from URL: ${repoUrl}`);
    const [, owner, repo] = repoUrl;
    return [owner, repo];
}

type FetchPrDiffs = {
    repository_url: SearchIssuesAndPrsGetResponseItems[number]['repository_url'],
    pr_number: SearchIssuesAndPrsGetResponseItems[number]['number'],

}
export async function fetchPrDiffs({ repository_url, pr_number }: FetchPrDiffs) {
    const [owner, repo] = getPrRepoUrlInfo(repository_url);

    const { data: diff } = await githubApi.pulls.get({
        owner,
        repo,
        pull_number: pr_number,
        mediaType: { format: "diff" },
    });

    // console.log('DIFFF --->>> ', diff)
    return diff;
}

type PostReview = {
    repository_url: SearchIssuesAndPrsGetResponseItems[number]['repository_url'],
    pr_number: SearchIssuesAndPrsGetResponseItems[number]['number'],
    reviewSummary: string,
    comments: ReviewComment[],
    event: 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';
}

export async function postReview({
    repository_url,
    pr_number,
    reviewSummary,
    comments,
    event
}: PostReview) {
    const [owner, repo] = getPrRepoUrlInfo(repository_url);

    // Post review with line-specific comments
    await githubApi.pulls.createReview({
        owner,
        repo,
        pull_number: pr_number,
        body: reviewSummary,
        event: comments.length ? event : 'APPROVE', // No comments -> default to approve
        comments: comments.map(comment => ({
            path: comment.path,
            line: comment.line,
            body: comment.body,
            side: 'RIGHT' // Comment on the new version of the file
        }))
    });

    logger.info(`Posted review to ${repository_url} with ${comments.length} comments`);
}