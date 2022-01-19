import {checkNotEmpty, httpCheckParse} from "./utils.js";
import {GITHUB_API_BASE_URL, BASE_HEADERS} from "./constants.js";
import fetch from "node-fetch";
import PullRequest from "./PullRequest.js";

export default class Repository {
    constructor(organisation, repoName) {
        this.organisation = checkNotEmpty(organisation);
        this.repoName = checkNotEmpty(repoName);
        this.fullName = `${organisation}/${repoName}`;

        this.repoBaseUrl = `${GITHUB_API_BASE_URL}repos/${this.organisation}/${this.repoName}`;
    }

    static fromString(repo) {
        const [organisation, repoName] = checkNotEmpty(repo).split('/', 2);

        return new Repository(organisation, repoName);
    }

    static multipleFromString(repos) {
        return checkNotEmpty(repos).split(',')
            .map(repo => repo.trim())
            .map(repo => Repository.fromString(repo));
    }

    async getPullRequests() {
        const url = `${this.repoBaseUrl}/pulls`;

        return (await httpCheckParse(await fetch(url, {
            headers: BASE_HEADERS
        })))
        .map(prData => new PullRequest(prData));
    }

    static async getAllForOrganisation(organisation) {
        const url = `${GITHUB_API_BASE_URL}orgs/${organisation}/repos?per_page=100`;

        console.info(`Fetching repositories for organisation=${organisation}...`);
        const reposResponse = await fetch(url, {
            headers: BASE_HEADERS
        }).then(httpCheckParse);
        const repos = reposResponse.map(repoData => Repository.fromString(repoData.full_name))
        console.log(`Repositories:\n${repos.map(repo => repo.fullName).map(x => '- ' + x).join('\n')}`)

        return repos;
    }
}