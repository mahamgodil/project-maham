import { readFileSync } from 'fs';
import { get } from 'axios';

export async function analyzeDependencies(filePath: string) {
    try {
        const urlList = readFileSync(filePath, 'utf-8').split('\n').filter(url => url.length > 0);
        
        for (let url of urlList) {
            console.log(`Processing URL: ${url}`);
            
            if (url.includes('npmjs.com')) {
                const pkgName = url.split('/').slice(-1)[0];
                if (!pkgName) throw new Error(`Malformed URL: ${url}`);
                
                const pkgData = await retrieveNpmData(pkgName);
                
                const metric = {
                    url,
                    netScore: deriveNetScore(pkgData),
                    rampUp: deriveRampUpScore(pkgData),
                    correctness: deriveCorrectnessScore(pkgData),
                    busFactor: deriveBusFactorScore(pkgData),
                    maintainerResponse: 0.5,  // Temp value
                    licenseScore: deriveLicenseScore(pkgData),
                };

                console.log('NPM metrics:', JSON.stringify(metric, null, 2));

            } else if (url.includes('github.com')) {
                const repoData = await retrieveGitHubData(url);
                
                const metric = {
                    url,
                    netScore: 0.5,  // Temp value
                    rampUp: 0.5,  // Temp value
                    correctness: 0.5,  // Temp value
                    busFactor: 0.5,  // Temp value
                    maintainerResponse: 0.5,  // Temp value
                    licenseScore: 0.5,  // Temp value
                };
                
                console.log('GitHub metrics:', JSON.stringify(metric, null, 2));
            }
        }
    } catch (err) {
        console.error('An error occurred:', err);
        process.exit(1);
    }
}

async function retrieveGitHubData(repoUrl: string) {
    const [,, , owner, repoName] = repoUrl.split('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
    
    try {
        const response = await get(apiUrl);
        return response.data;
    } catch (err) {
        console.error(`Failed to fetch data for: ${repoUrl}`, err);
        throw err;
    }
}

async function retrieveNpmData(pkgName: string) {
    const apiUrl = `https://registry.npmjs.org/${pkgName}`;
    
    try {
        const response = await get(apiUrl, { timeout: 10000 });
        return response.data;
    } catch (err) {
        console.error(`Failed to fetch data for: ${pkgName}`, err);
        throw err;
    }
}

function deriveNetScore(data: any): number {
    return 0.5;  // Placeholder
}

function deriveRampUpScore(data: any): number {
    const now = Date.now();
    const creationDate = new Date(data.time.created).getTime();
    const delta = now - creationDate;
    return 1 - Math.exp(-delta / (365 * 24 * 60 * 60 * 1000));
}

function deriveCorrectnessScore(data: any): number {
    const downloads = data.versions[data['dist-tags'].latest].npm;
    return downloads > 1000000 ? 1 : downloads / 1000000;
}

function deriveBusFactorScore(data: any): number {
    return Math.min(data.maintainers.length / 10, 1);
}

function deriveLicenseScore(data: any): number {
    const validLicenses = ['MIT', 'GPL', 'BSD', 'ISC', 'Apache-2.0'];
    return validLicenses.includes(data.license) ? 1 : 0;
}
