"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const token = process.env.GITHUB_API_TOKEN;
const repositoryUrl = 'https://api.github.com/repos/nytimes/covid-19-data'; // must be in form https://api.github.com/repos/${Owner}/${Name}
// Authenticate with GitHub
const headers = {
    Authorization: `Bearer ${token}`,
};
//getNumOfSigContrib();
//checkRepoLicense();
//getClosedBugs();
calcAvgResponse();
//rampUp();
function getNumOfSigContrib() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch repository information
            const repositoryResponse = yield axios_1.default.get(repositoryUrl, { headers });
            const repositoryData = repositoryResponse.data;
            // Get the total number of commits in the repository
            var totalCommits = 0;
            // Fetch the list of contributors
            const contributorsUrl = repositoryData.contributors_url;
            const contributorsResponse = yield axios_1.default.get(contributorsUrl, { headers });
            const contributorsData = contributorsResponse.data;
            // Calculate and count significant contributors
            contributorsData.forEach(function (contributor) {
                totalCommits += contributor.contributions;
                //console.log(contributor.contributions);
            });
            //console.log("Total commits: " + totalCommits);
            const significantContributors = contributorsData.filter((contributor) => (contributor.contributions / totalCommits) * 100 > 5);
            console.log(`Number of significant contributors: ${significantContributors.length}`);
        }
        catch (error) {
            console.error('Error:', error.message);
        }
    });
}
function checkRepoLicense() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const repositoryResponse = yield axios_1.default.get(repositoryUrl, { headers });
            const repositoryData = repositoryResponse.data;
            const licenseUrl = repositoryUrl + "/license";
            const LicenseResponse = yield axios_1.default.get(licenseUrl);
            // If the repository has a license, the response status will be 200 OK.
            // If the repository does not have a license, the response status will be 404 Not Found.
            if (LicenseResponse.status === 200) {
                console.log('The repository has a license.');
            }
            else {
                console.log(`Unexpected response status: ${LicenseResponse.status}`);
            }
        }
        catch (error) {
            if (error.response.status === 404) {
                console.log('The repository does not have a license.');
            }
            else {
                console.log(`Unexpected response status: ${error.response.status}`);
            }
        }
    });
}
function getClosedBugs(page = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const repositoryResponse = yield axios_1.default.get(repositoryUrl, { headers });
        const repositoryData = repositoryResponse.data;
        const issuesUrl = repositoryUrl + "/issues?state=all";
        const params = {
            state: 'all',
            per_page: 100,
            page: 1, // Start with page 1
        };
        let totalIssues = 0;
        let totalClosedIssues = 0;
        // Function to recursively fetch all issues
        function fetchAllIssues(page = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield axios_1.default.get(issuesUrl, { params: Object.assign(Object.assign({}, params), { page }), headers });
                    const issues = response.data;
                    totalIssues += issues.length;
                    totalClosedIssues += issues.filter((issue) => issue.state === 'closed').length;
                    // Fetch the next page if available
                    const linkHeader = response.headers.link;
                    if (linkHeader && linkHeader.includes('rel="next"')) {
                        const nextPage = page + 1;
                        yield fetchAllIssues(nextPage);
                    }
                    else {
                        // All issues have been fetched, display the results
                        const bugPercentage = (totalClosedIssues / totalIssues) * 100;
                        console.log(`Percentage of closed issues: ${bugPercentage.toFixed(2)}%`);
                    }
                }
                catch (error) {
                    console.error('Error making API request:', error);
                }
            });
        }
        fetchAllIssues();
    });
}
function calcAvgResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        const repositoryResponse = yield axios_1.default.get(repositoryUrl, { headers });
        const repositoryData = repositoryResponse.data;
        const issuesUrl = repositoryUrl + "/issues?state=all";
        const params = {
            state: 'all',
            per_page: 100,
            page: 1, // Start with page 1
        };
        let totalIssues = 0;
        let totalResponseTime = 0;
        function fetchAllIssues(page = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield axios_1.default.get(issuesUrl, { params: Object.assign(Object.assign({}, params), { page }), headers });
                    const issues = response.data;
                    for (const issue of issues) {
                        const commentsEndpoint = issue.comments_url;
                        console.log(`${totalResponseTime}, ${totalIssues}`);
                        try {
                            const response = yield axios_1.default.get(commentsEndpoint, { headers });
                            if (response.status === 200) {
                                const comments = response.data;
                                const maintainerComments = comments.filter((comment) => comment.user.type === 'User');
                                if (maintainerComments.length > 0) {
                                    const firstMaintainerComment = maintainerComments[0];
                                    const createdAt = new Date(issue.created_at);
                                    const respondedAt = new Date(firstMaintainerComment.created_at);
                                    const responseTime = respondedAt.getTime() - createdAt.getTime();
                                    totalResponseTime += ((responseTime / 1000) / 60) / 60; // milliseconds to minutes to hours
                                    totalIssues++;
                                }
                            }
                        }
                        catch (error) {
                            console.error('Error fetching comments for issue:', error);
                        }
                    }
                    // Fetch the next page if available
                    const linkHeader = response.headers.link;
                    if (linkHeader && linkHeader.includes('rel="next"')) {
                        const nextPage = page + 1;
                        yield fetchAllIssues(nextPage);
                    }
                    else {
                        // All issues have been fetched, display the results
                        const bugPercentage = totalResponseTime / totalIssues;
                        console.log(`Average response time of issues: ${bugPercentage.toFixed(2)}`);
                    }
                }
                catch (error) {
                    console.error('Error making API request:', error);
                }
            });
        }
        fetchAllIssues();
    });
}
function rampUp() {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
