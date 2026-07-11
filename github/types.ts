import type { paths } from "@octokit/openapi-types";

export type AuthedUserListReposRequest =
    paths["/user/repos"]["get"]["parameters"];
export type AuthedUserListReposResponse =
    paths["/user/repos"]["get"]["responses"]["200"]["content"]["application/json"];
export type SearchIssuesAndPrsGetResponseItems = paths['/search/issues']['get']['responses']['200']['content']['application/json']['items'];
export type PullsGetResponse = paths['/repos/{owner}/{repo}/pulls/{pull_number}']["get"]["responses"]["200"]["content"]["application/json"];