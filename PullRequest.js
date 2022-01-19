import {checkNotEmpty, checkNotNull, httpCheckParse} from "./utils.js";
import {GITHUB_API_BASE_URL, BASE_HEADERS} from "./constants.js";
import fetch from "node-fetch";

export default class PullRequest {
    constructor(data) {
        this._data = {...checkNotNull(data)};

        this.url = checkNotEmpty(data?._links?.html?.href);
        this.submitter = checkNotEmpty(data.user);
        this.submitterUsername = checkNotEmpty(this.submitter?.login);
        this.title = checkNotEmpty(data.title);
        this.state = checkNotEmpty(data.state);
        this.draft = checkNotNull(data.draft);
        this.reviewers = checkNotNull(data.requested_reviewers);
        this.reviewerUsernames = this.reviewers.map(reviewer => reviewer.login);
        this.statusUrl = data.statuses_url;
    }

    isOpenForReview() {
        if (this.state != 'open') {
            console.debug(`Pull request ${this.url} is not open for review because this.state=${this.state}`);
            return false;
        } else if (this.draft) {
            console.debug(`Pull request ${this.url} is not open for review because this.draft=${this.draft}`);
            return false;
        } else if (this.reviewers.length <= 0) {
            console.debug(`Pull request ${this.url} is not open for review because this.reviewers=${this.reviewers}`,);
            return false;
        }

        return true;
    }

    requestsReviewFromOneOfUsers(users) {
        return this.reviewerUsernames.some(reviewer => users.includes(reviewer));
    }

    async getStatusChecks() {
        if (!this.statusUrl) {
            console.warn(`No status checks endpoint for pull request ${this.url}.`);
            return [];
        }

        console.log(`Fetching status checks for pull request ${this.url}...`);
        const statusChecks = await fetch(this.statusUrl, {
            headers: BASE_HEADERS
        }).then(httpCheckParse);

        return Object.fromEntries(statusChecks.reverse().map(statusCheck => ([statusCheck.context, statusCheck.state === 'success'])));
    }
}