import fs from 'fs';
import axios from 'axios';

export async function testDependencies(URL_FILE: string) {
    console.log('in testDependencies');
    try {
        console.log('in try, URL_FILE: ' + URL_FILE);
        const urls = fs.readFileSync(URL_FILE, 'utf-8').split('\n').filter(Boolean);

        for (const url of urls) {
            console.log('in for loop, url: ' + url);
            if (url.includes('npmjs.com')) {
                const packageName = url.split('/').pop();
                if (!packageName) {
                    throw new Error(`Invalid URL: ${url}`);
                }
                console.log('in if, packageName: ' + packageName);
                const data = await fetchNpmDataWithAxios(packageName);
                // console.log('in if, data:', JSON.stringify(data, null, 2));

                const scores = {
                    URL: url,
                    NetScore: calculateNetScore(data),
                    RampUp: calculateRampUpScore(data),
                    Correctness: calculateCorrectnessScore(data),
                    BusFactor: calculateBusFactorScore(data),
                    ResponsiveMaintainer: 0.5,  // Placeholder
                    License: calculateLicenseScore(data)
                };

                console.log('in if, scores:', JSON.stringify(scores, null, 2));

                // console.log(JSON.stringify(scores));
            } else if (url.includes('github.com')) {
                //TODO GitHub stuff in here
                console.log('GitHub stuff in here to do');
            }
        }

        // process.exit(0);
    } catch (err) {
        console.error(err);
        console.error('Error occurred:', err);

        process.exit(1);
    }
}

// async function example1WithFetch() {
//     console.log('in example1WithFetch');
//     const endpoint = "https://registry.npmjs.org/";
//     const res = await axios.get(endpoint);
//     console.log(res.data);
//     console.log('Finished example1WithFetch');
//     const data = await res.data;
//     console.log(data);
//   }
  



async function fetchNpmDataWithAxios(packageName: string) {
    console.log('Starting fetchNpmDataWithAxios for:', packageName);
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
    console.log('in calculateNetScore');
    return 0.5; //! Placeholder
}

function calculateRampUpScore(data: any): number {
    console.log('in calculateRampUpScore');
    const currentDate = new Date().getTime();
    const packageDate = new Date(data.time.created).getTime();
    const age = currentDate - packageDate;
    return 1 - Math.exp(-age / (365 * 24 * 60 * 60 * 1000));
}

function calculateCorrectnessScore(data: any): number {
    // !Placeholder
    console.log('in calculateCorrectnessScore');
    const downloads = data.versions[data['dist-tags'].latest].npm;
    return downloads > 1000000 ? 1 : downloads / 1000000;
}

function calculateBusFactorScore(data: any): number {
    console.log('in calculateBusFactorScore');
    return Math.min(data.maintainers.length / 10, 1);
}

function calculateLicenseScore(data: any): number {
    console.log('in calculateLicenseScore');
    const recognizedLicenses = ['MIT', 'GPL', 'BSD', 'ISC', 'Apache-2.0'];
    return recognizedLicenses.includes(data.license) ? 1 : 0;
}
