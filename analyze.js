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
exports.testDependencies = void 0;
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
function testDependencies(URL_FILE) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('in testDependencies');
        try {
            // console.log('in try, URL_FILE: ' + URL_FILE);
            const urls = fs_1.default.readFileSync(URL_FILE, 'utf-8').split('\n').filter(Boolean);
            for (const url of urls) {
                console.log('in for loop, url: ' + url);
                if (url.includes('npmjs.com')) {
                    const packageName = url.split('/').pop();
                    if (!packageName) {
                        throw new Error(`Invalid URL: ${url}`);
                    }
                    // console.log('in if, packageName: ' + packageName);
                    const data = yield fetchNpmDataWithAxios(packageName);
                    // console.log('in if, data:', JSON.stringify(data, null, 2));
                    const scores = {
                        URL: url,
                        NetScore: calculateNetScore(data),
                        RampUp: calculateRampUpScore(data),
                        Correctness: calculateCorrectnessScore(data),
                        BusFactor: calculateBusFactorScore(data),
                        ResponsiveMaintainer: 0.5,
                        License: calculateLicenseScore(data)
                    };
                    console.log('in if, scores:', JSON.stringify(scores, null, 2));
                    // console.log(JSON.stringify(scores));
                }
                else if (url.includes('github.com')) {
                    const data = yield fetchGitHubDataWithAxios(url);
                    // Your scoring logic for GitHub data will be here
                    // (It's up to you how to derive these metrics from the GitHub data)
                    // const scores = {
                    //     URL: url,
                    //     NetScore: calculateGitHubNetScore(data),
                    //     RampUp: calculateGitHubRampUpScore(data),
                    //     Correctness: calculateGitHubCorrectnessScore(data),
                    //     BusFactor: calculateGitHubBusFactorScore(data),
                    //     ResponsiveMaintainer: calculateGitHubResponsiveMaintainerScore(data),
                    //     License: calculateGitHubLicenseScore(data)
                    // };
                    // TODO: Implement GitHub scoring logic
                    const scores = {
                        URL: url,
                        NetScore: 0.5,
                        RampUp: 0.5,
                        Correctness: 0.5,
                        BusFactor: 0.5,
                        ResponsiveMaintainer: 0.5,
                        License: 0.5
                    };
                    console.log('GitHub scores:', JSON.stringify(scores, null, 2));
                }
            }
            // process.exit(0);
        }
        catch (err) {
            console.error(err);
            console.error('Error occurred:', err);
            process.exit(1);
        }
    });
}
exports.testDependencies = testDependencies;
// async function example1WithFetch() {
//     console.log('in example1WithFetch');
//     const endpoint = "https://registry.npmjs.org/";
//     const res = await axios.get(endpoint);
//     console.log(res.data);
//     console.log('Finished example1WithFetch');
//     const data = await res.data;
//     console.log(data);
//   }
function fetchGitHubDataWithAxios(repositoryUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const [, , , user, repo] = repositoryUrl.split('/');
        const endpoint = `https://api.github.com/repos/${user}/${repo}`;
        try {
            const response = yield axios_1.default.get(endpoint);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching data for:', repositoryUrl, error);
            throw error;
        }
    });
}
function fetchNpmDataWithAxios(packageName) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('Starting fetchNpmDataWithAxios for:', packageName);
        const endpoint = `https://registry.npmjs.org/${packageName}`;
        console.log('endpoint:', endpoint);
        try {
            // console.log('Before Axios call in fetchNpmDataWithAxios for:', packageName);
            const response = yield axios_1.default.get(endpoint, { timeout: 10000 });
            // console.log('Finished Axios call in fetchNpmDataWithAxios for:', packageName);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching data for:', packageName, error);
            throw error;
        }
    });
}
function calculateNetScore(data) {
    // console.log('in calculateNetScore');
    return 0.5; //! Placeholder
}
function calculateRampUpScore(data) {
    // console.log('in calculateRampUpScore');
    const currentDate = new Date().getTime();
    const packageDate = new Date(data.time.created).getTime();
    const age = currentDate - packageDate;
    return 1 - Math.exp(-age / (365 * 24 * 60 * 60 * 1000));
}
function calculateCorrectnessScore(data) {
    // !Placeholder
    // console.log('in calculateCorrectnessScore');
    const downloads = data.versions[data['dist-tags'].latest].npm;
    return downloads > 1000000 ? 1 : downloads / 1000000;
}
function calculateBusFactorScore(data) {
    // console.log('in calculateBusFactorScore');
    return Math.min(data.maintainers.length / 10, 1);
}
function calculateLicenseScore(data) {
    // console.log('in calculateLicenseScore');
    const recognizedLicenses = ['MIT', 'GPL', 'BSD', 'ISC', 'Apache-2.0'];
    return recognizedLicenses.includes(data.license) ? 1 : 0;
}
