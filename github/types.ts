import type { paths } from "@octokit/openapi-types";
import { ReviewComment } from "review-service/types";

export type AuthedUserListReposRequest =
    paths["/user/repos"]["get"]["parameters"];
export type AuthedUserListReposResponse =
    paths["/user/repos"]["get"]["responses"]["200"]["content"]["application/json"];
export type SearchIssuesAndPrsGetResponseItems = paths['/search/issues']['get']['responses']['200']['content']['application/json']['items'];
export type PullsGetResponse = paths['/repos/{owner}/{repo}/pulls/{pull_number}']["get"]["responses"]["200"]["content"]["application/json"];

export type PaginatedData<T> = {
    apiFunction: (options: any) => Promise<{ data: any; headers: any }>,
    options: {
        per_page: number;
        page: number;
        q?: string;
        affiliation?: string;
    }
}

export type FetchPrDiffs = {
    repository_url: SearchIssuesAndPrsGetResponseItems[number]['repository_url'],
    pr_number: SearchIssuesAndPrsGetResponseItems[number]['number'],

}

export type PostReview = {
    repository_url: SearchIssuesAndPrsGetResponseItems[number]['repository_url'],
    pr_number: SearchIssuesAndPrsGetResponseItems[number]['number'],
    reviewSummary: string,
    comments: ReviewComment[],
    event: 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';
}