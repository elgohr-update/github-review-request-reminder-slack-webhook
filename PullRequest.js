import {checkNotEmpty, checkNotNull, httpCheckParse} from "./utils.js";
import {GITHUB_API_BASE_URL, BASE_HEADERS} from "./constants.js";
import fetch from "node-fetch";

export default class PullRequest {
    constructor(data) {
        Object.assign(this, checkNotNull(data));


        checkNotEmpty(this.url);
        checkNotEmpty(this.user?.login);
        checkNotEmpty(this.title);
        checkNotEmpty(this.state);
        checkNotNull(this.requested_reviewers);
    }

    getSubmitterUsername() {
        return this.user.login;
    }

    getReviewerUsernames() {
        return this.requested_reviewers.map(reviewer => reviewer.login);
    }

    isOpenForReview() {
        if (this.state != 'open') {
            return false;
        } else if (this.requested_reviewers.length <= 0) {
            return false;
        }

        return true;
    }

    requestsReviewFromOneOfUsers(users) {
        return this.getReviewerUsernames()
            .some(reviewer => users.includes(reviewer));
    }
}