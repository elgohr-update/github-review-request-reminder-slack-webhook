import ConsoleStamp from 'console-stamp';
ConsoleStamp(console);

import { checkHttpStatus, checkNotEmpty, httpCheckParse, sleep } from "./utils.js";
import fetch from "node-fetch";
import Repository from "./Repository.js";
import { GITHUB_USERNAMES, SLACK_WEBHOOK_URL, GITHUB_USERNAME_TO_SLACK_MEMBER_ID_MAP } from "./constants.js";

const REPOS = process.env.REPOS?.startsWith('ALL:')
    ? await Repository.getAllForOrganisation(process.env.REPOS.substring(4))
    : Repository.multipleFromString(process.env.REPOS);

const prsAwaitingReview = new Set();

for (const repo of REPOS) {
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

        console.info(`Pull request ${pr.url} requests reviews from ${pr.reviewerUsernames.join(', ')}.`);
        prsAwaitingReview.add(pr);
    });

    await sleep(100); // So Github continues to like me
}

const tryGetSlackMention = githubUsername => {
    const slackMemberId = GITHUB_USERNAME_TO_SLACK_MEMBER_ID_MAP?.[githubUsername];
    if (slackMemberId) {
        return `<@${slackMemberId}>`;
    }

    return githubUsername;
}

if (prsAwaitingReview.size == 0) {
    console.log('No pull requests are awaiting review.');
    process.exit(0);
}

const message = 'Pull requests are awaiting review\n\n' + (await Promise.all([...prsAwaitingReview].map(async pr => {
    const submitter = tryGetSlackMention(pr.submitterUsername);
    const reviewers = pr.reviewerUsernames.map(tryGetSlackMention);
    const title = pr.title;
    const url = pr.url;
    const statusChecks = await pr.getStatusChecks();
    const nStatusChecks = Object.keys(statusChecks).length;
    const nStatusChecksPassed = Object.values(statusChecks).filter(x => x === true).length;
    const statusChecksMessage = (() => {
        if (nStatusChecks == 0) {
            return '';
        } else if (nStatusChecksPassed >= nStatusChecks) {
            return ` [:white_check_mark: ${nStatusChecksPassed}/${nStatusChecks} status checks passed]`;
        }

        return ` [:x: ${nStatusChecksPassed}/${nStatusChecks} status checks passed]`;
    })();

    await sleep(100); // Potentially getting status checks for a lot of PRs

    return `:pullrequest: "${title}" (by ${submitter}) requires review from ${reviewers.join(', ')}: ${url}${statusChecksMessage}`;
}))).map(x => `- ${x}`).join('\n');

console.info('Calling Slack webhook...', message);
console.log(await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
        message
    })
}).then(checkHttpStatus));