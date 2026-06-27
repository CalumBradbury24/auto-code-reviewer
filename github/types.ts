import type { paths } from "@octokit/openapi-types";

export type AuthedUserListReposRequest =
    paths["/user/repos"]["get"]["parameters"];
export type AuthedUserListReposResponse =
    paths["/user/repos"]["get"]["responses"]["200"]["content"]["application/json"];