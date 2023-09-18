import fs from 'fs';
import axios from 'axios';
import { argv } from "process";

import { busFactor, correctness, license, rampUp, responsiveMaintainer } from './metric';


export async function analyzeDependencies(URL_FILE: string) {
    // console.log('in testDependencies');
    try {
        // console.log('in try, URL_FILE: ' + URL_FILE);
        const urls = fs.readFileSync(URL_FILE, 'utf-8').split('\n').filter(Boolean);
//         https://github.com/cloudinary/cloudinary_npm
//         https://github.com/nullivex/nodist
// https://github.com/lodash/lodash
        for (const url of urls) {
            console.log('in for loop, url: ' + url);
            if (url.includes('npmjs.com')) {
                const packageName = url.split('/').pop();
                if (!packageName) {
                    throw new Error(`Invalid URL: ${url}`);
                }
                // console.log('in if, packageName: ' + packageName);
                const data = await fetchNpmDataWithAxios(packageName);
                const repositoryUrl = getGithubUrlFromNpmData(data);
            
                // Convert the GitHub URL to its respective GitHub API URL
                if (repositoryUrl) { // Check if repositoryUrl is not null
                    const newUrl = repositoryUrl.replace('github.com', 'api.github.com/repos');
                    console.log('newUrl:', newUrl);
                    // const rampUpResult = await rampUp(repositoryUrl);
                    // // console.log('RampUp:', rampUpResult);
                    // const CorrectnessResult = await correctness(repositoryUrl);
                    // // console.log('Correctness:', CorrectnessResult);
                    // const BusFactorResult = await busFactor(repositoryUrl);
                    // // console.log('BusFactor:', BusFactorResult);
                    // const ResponsiveMaintainerResult = await responsiveMaintainer(repositoryUrl);
                    // // console.log('ResponsiveMaintainer:', ResponsiveMaintainerResult);
                    // const LicenseResult = await license(repositoryUrl);
                    // // console.log('License:', LicenseResult);
    
    
                    // // TODO: Implement GitHub scoring logic
                    // const scores = {
                    //     URL: url,
                    //     NetScore: 1,  // Placeholder
                    //     RampUp: rampUpResult,
                    //     Correctness: CorrectnessResult,
                    //     BusFactor: BusFactorResult,
                    //     ResponsiveMaintainer: ResponsiveMaintainerResult,
                    //     License: LicenseResult
                    // };
                    // console.log('in if, scores:', JSON.stringify(scores, null, 2));
                } else {
                    console.log('No GitHub repository found for:', packageName);
                }
            } else if (url.includes('github.com')) {

                // Change url from the format like https://github.com/nullivex/nodist to https://api.github.com/repos/nullivex/nodist
                const newUrl = url.replace('github.com', 'api.github.com/repos');

                const rampUpResult = await rampUp(newUrl);
                // console.log('RampUp:', rampUpResult);
                const CorrectnessResult = await correctness(newUrl);
                // console.log('Correctness:', CorrectnessResult);
                const BusFactorResult = await busFactor(newUrl);
                // console.log('BusFactor:', BusFactorResult);
                const ResponsiveMaintainerResult = await responsiveMaintainer(newUrl);
                // console.log('ResponsiveMaintainer:', ResponsiveMaintainerResult);
                const LicenseResult = await license(newUrl);
                // console.log('License:', LicenseResult);


                // TODO: Implement GitHub scoring logic
                const scores = {
                    URL: url,
                    NetScore: 1,  // Placeholder
                    RampUp: rampUpResult,
                    Correctness: CorrectnessResult,
                    BusFactor: BusFactorResult,
                    ResponsiveMaintainer: ResponsiveMaintainerResult,
                    License: LicenseResult
                };
            
                console.log('GitHub scores:', JSON.stringify(scores, null, 2));
            }
        }

        // process.exit(0);
    } catch (err) {
        console.error(err);
        console.error('Error occurred:', err);

        process.exit(1);
    }
}

function getGithubUrlFromNpmData(data: any): string | null {
    if (data && data.repository && data.repository.url) {
        const repoUrl = data.repository.url;
        // Check if the URL is a GitHub URL and clean it up if needed
        const match = repoUrl.match(/https?:\/\/github\.com\/[^\/]+\/[^\/]+/);
        if (match) {
            return match[0];
        }
    }
    return null;
}

async function fetchGitHubDataWithAxios(repositoryUrl: string) {
    const [, , , user, repo] = repositoryUrl.split('/');
    const endpoint = `https://api.github.com/repos/${user}/${repo}`;
    try {
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        console.error('Error fetching data for:', repositoryUrl, error);
        throw error;
    }
}

async function fetchNpmDataWithAxios(packageName: string) {
    // console.log('Starting fetchNpmDataWithAxios for:', packageName);
    const endpoint = `https://registry.npmjs.org/${packageName}`;
    console.log('endpoint:', endpoint);
    try {
        // console.log('Before Axios call in fetchNpmDataWithAxios for:', packageName);
        const response = await axios.get(endpoint, { timeout: 10000 });
        // console.log('Finished Axios call in fetchNpmDataWithAxios for:', packageName);
        return response.data;
    } catch (error) {
        console.error('Error fetching data for:', packageName, error);
        throw error;
    }
}


function calculateNetScore(data: any): number {
    // console.log('in calculateNetScore');
    return 0.5; //! Placeholder
}

function calculateRampUpScore(data: any): number {
    // console.log('in calculateRampUpScore');
    const currentDate = new Date().getTime();
    const packageDate = new Date(data.time.created).getTime();
    const age = currentDate - packageDate;
    return 1 - Math.exp(-age / (365 * 24 * 60 * 60 * 1000));
}

function calculateCorrectnessScore(data: any): number {
    // !Placeholder
    // console.log('in calculateCorrectnessScore');
    const downloads = data.versions[data['dist-tags'].latest].npm;
    return downloads > 1000000 ? 1 : downloads / 1000000;
}

function calculateBusFactorScore(data: any): number {
    // console.log('in calculateBusFactorScore');
    return Math.min(data.maintainers.length / 10, 1);
}

function calculateLicenseScore(data: any): number {
    // console.log('in calculateLicenseScore');
    const recognizedLicenses = ['MIT', 'GPL', 'BSD', 'ISC', 'Apache-2.0'];
    return recognizedLicenses.includes(data.license) ? 1 : 0;
}

if (require.main === module) {
    (async () => {
        if (argv.length >= 3) {
            const file = argv[2];  // Get the file path from the command line arguments.
            await analyzeDependencies(file);
        }
    })();
}