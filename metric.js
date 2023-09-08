"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var token = process.env.GITHUB_API_TOKEN;
var repositoryUrl = 'https://api.github.com/repos/nytimes/covid-19-data'; // must be in form https://api.github.com/repos/${Owner}/${Name}
// Authenticate with GitHub
var headers = {
    Authorization: "Bearer ".concat(token),
};
getNumOfSigContrib();
checkRepoLicense();
getClosedBugs();
function getNumOfSigContrib() {
    return __awaiter(this, void 0, void 0, function () {
        var repositoryResponse, repositoryData, totalCommits, contributorsUrl, contributorsResponse, contributorsData, significantContributors, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get(repositoryUrl, { headers: headers })];
                case 1:
                    repositoryResponse = _a.sent();
                    repositoryData = repositoryResponse.data;
                    totalCommits = 0;
                    contributorsUrl = repositoryData.contributors_url;
                    return [4 /*yield*/, axios_1.default.get(contributorsUrl, { headers: headers })];
                case 2:
                    contributorsResponse = _a.sent();
                    contributorsData = contributorsResponse.data;
                    // Calculate and count significant contributors
                    contributorsData.forEach(function (contributor) {
                        totalCommits += contributor.contributions;
                        //console.log(contributor.contributions);
                    });
                    significantContributors = contributorsData.filter(function (contributor) { return (contributor.contributions / totalCommits) * 100 > 5; });
                    console.log("Number of significant contributors: ".concat(significantContributors.length));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error:', error_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function checkRepoLicense() {
    return __awaiter(this, void 0, void 0, function () {
        var repositoryResponse, repositoryData, licenseUrl, LicenseResponse, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get(repositoryUrl, { headers: headers })];
                case 1:
                    repositoryResponse = _a.sent();
                    repositoryData = repositoryResponse.data;
                    licenseUrl = repositoryUrl + "/license";
                    return [4 /*yield*/, axios_1.default.get(licenseUrl)];
                case 2:
                    LicenseResponse = _a.sent();
                    // If the repository has a license, the response status will be 200 OK.
                    // If the repository does not have a license, the response status will be 404 Not Found.
                    if (LicenseResponse.status === 200) {
                        console.log('The repository has a license.');
                    }
                    else {
                        console.log("Unexpected response status: ".concat(LicenseResponse.status));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    if (error_2.response.status === 404) {
                        console.log('The repository does not have a license.');
                    }
                    else {
                        console.log("Unexpected response status: ".concat(error_2.response.status));
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getClosedBugs(page) {
    if (page === void 0) { page = 1; }
    return __awaiter(this, void 0, void 0, function () {
        // Function to recursively fetch all issues
        function fetchAllIssues(page) {
            if (page === void 0) { page = 1; }
            return __awaiter(this, void 0, void 0, function () {
                var response, issues, linkHeader, nextPage, bugPercentage, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            return [4 /*yield*/, axios_1.default.get(issuesUrl, { params: __assign(__assign({}, params), { page: page }), headers: headers })];
                        case 1:
                            response = _a.sent();
                            issues = response.data;
                            totalIssues += issues.length;
                            totalClosedIssues += issues.filter(function (issue) { return issue.state === 'closed'; }).length;
                            linkHeader = response.headers.link;
                            if (!(linkHeader && linkHeader.includes('rel="next"'))) return [3 /*break*/, 3];
                            nextPage = page + 1;
                            return [4 /*yield*/, fetchAllIssues(nextPage)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            bugPercentage = (totalClosedIssues / totalIssues) * 100;
                            console.log("Percentage of closed bug issues: ".concat(bugPercentage.toFixed(2), "%"));
                            _a.label = 4;
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_3 = _a.sent();
                            console.error('Error making API request:', error_3);
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        var repositoryResponse, repositoryData, issuesUrl, params, totalIssues, totalClosedIssues;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1.default.get(repositoryUrl, { headers: headers })];
                case 1:
                    repositoryResponse = _a.sent();
                    repositoryData = repositoryResponse.data;
                    issuesUrl = repositoryUrl + "/issues?state=all";
                    params = {
                        state: 'all',
                        per_page: 100,
                        page: 1, // Start with page 1
                    };
                    totalIssues = 0;
                    totalClosedIssues = 0;
                    fetchAllIssues();
                    return [2 /*return*/];
            }
        });
    });
}
