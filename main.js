import ConsoleStamp from 'console-stamp';
ConsoleStamp(console);

import { checkHttpStatus, checkNotEmpty, httpCheckParse } from "./utils.js";
import fetch from "node-fetch";
import Repository from "./Repository.js";
import { GITHUB_USERNAMES, SLACK_WEBHOOK_URL, USERNAME_MAPPING } from "./constants.js";

const REPOS = Repository.multipleFromString(process.env.REPOS);

const prsAwaitingReview = new Set();

await Promise.all(REPOS.map(async repo => {
    const prs = await repo.getPullRequests();
    console.info(`${repo.organisation}/${repo.repoName} has ${prs.length} open pull requests.`);
    
    prs.forEach(async pr => {
        if (!pr.isOpenForReview()) {
            console.info(`Pull request ${pr.url} is not open for review.`);
            return;
        } else if (!pr.requestsReviewFromOneOfUsers(GITHUB_USERNAMES)) {
            console.info(`Pull request ${pr.url} does not request review from configured users.`);
            return;
        }

        console.info(`Pull request ${pr.url} requests reviews from ${pr.getReviewerUsernames().join(', ')}.`);
        prsAwaitingReview.add(pr);
    });
}));

const getSlackUsername = githubUsername => {
    const slackUsername = USERNAME_MAPPING?.[githubUsername];
    if (slackUsername) {
        return `@${slackUsername}`;
    }

    return githubUsername;
}

if (prsAwaitingReview.size == 0) {
    console.log('No pull requests are awaiting review.');
    process.exit(0);
}

const message = 'Pull requests are awaiting review\n\n' + [...prsAwaitingReview].map(pr => {
    const submitter = getSlackUsername(pr.getSubmitterUsername());
    const reviewers = pr.getReviewerUsernames().map(getSlackUsername);
    const title = pr.title;
    const url = pr.url;

    return `:pullrequest: "${title}" submitted by ${submitter} requires review from ${reviewers.join(', ')}: ${url}`;
}).map(x => `- ${x}`).join('\n');

console.info('Calling Slack webhook...');
console.log(await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
        message
    })
}).then(checkHttpStatus));