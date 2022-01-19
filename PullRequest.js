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
    }

    isOpenForReview() {
        if (this.state != 'open') {
            return false;
        } else if (this.draft) {
            return false;
        } else if (this.reviewers.length <= 0) {
            return false;
        }

        return true;
    }

    requestsReviewFromOneOfUsers(users) {
        return this.reviewerUsernames.some(reviewer => users.includes(reviewer));
    }
}