import fs from 'fs';
import axios from 'axios';

export async function testDependencies(URL_FILE: string) {
  try {
    const urls = fs.readFileSync(URL_FILE, 'utf-8').split('\n').filter(Boolean);
    for (const url of urls) {
      let data: any;
      let scores: any;
      
      if (url.includes('npmjs.com')) {
        const packageName = url.split('/').pop();
        if (!packageName) throw new Error(`Invalid URL: ${url}`);
        
        data = await fetchNpmDataWithAxios(packageName);
        scores = analyzeDataWithAI(data);
      } 
      else if (url.includes('github.com')) {
        data = await fetchGitHubDataWithAxios(url);
        scores = analyzeDataWithAI(data);
      } 
      else {
        console.warn(`Unknown URL type: ${url}`);
        continue;
      }

      console.log('Scores:', JSON.stringify(scores, null, 2));
    }
  } catch (err) {
    console.error('Error occurred:', err);
    process.exit(1);
  }
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
  const endpoint = `https://registry.npmjs.org/${packageName}`;
  try {
    const response = await axios.get(endpoint, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching data for:', packageName, error);
    throw error;
  }
}

async function analyzeDataWithAI(data: any, source: 'npm' | 'github'): Promise<any> {
    try {
        let scores: any = {
            URL: data.url,
            NetScore: 0,
            RampUp: 0,
            Correctness: 0,
            BusFactor: 0,
            ResponsiveMaintainer: 0,
            License: 0
        };

        if (source === 'npm') {
            scores.NetScore = calculateNetScore(data);
            scores.RampUp = calculateRampUpScore(data);
            scores.Correctness = calculateCorrectnessScore(data);
            scores.BusFactor = calculateBusFactorScore(data);
            scores.ResponsiveMaintainer = 0.5; // placeholder, to analyze maintainers' responsiveness from the data
            scores.License = calculateLicenseScore(data);
        } else if (source === 'github') {
            // For GitHub, define functions like calculateGitHubNetScore, calculateGitHubRampUpScore, , 
            // that will take GitHub data as input and return a score based on some criteria.
            scores.NetScore = calculateGitHubNetScore(data);
            scores.RampUp = calculateGitHubRampUpScore(data);
            scores.Correctness = calculateGitHubCorrectnessScore(data);
            scores.BusFactor = calculateGitHubBusFactorScore(data);
            scores.ResponsiveMaintainer = calculateGitHubResponsiveMaintainerScore(data);
            scores.License = calculateGitHubLicenseScore(data);
        }

        return scores;
    } catch (error) {
        console.error('Error in analyzeDataWithAI function:', error);
        throw error;
    }
}

function calculateNetScore(data: any): number {
    // Implement logic here to calculate NetScore for npm data
    return 0.5;
}

function calculateRampUpScore(data: any): number {
    // Implement logic here to calculate RampUp score for npm data
    return 0.5;
}

// Define other score calculating functions here...
// ... for npm:

function calculateCorrectnessScore(data: any): number { return 0.5; }
function calculateBusFactorScore(data: any): number { return 0.5; }
function calculateLicenseScore(data: any): number { return 0.5; }

// ... and for GitHub:

function calculateGitHubNetScore(data: any): number { return 0.5; }
function calculateGitHubRampUpScore(data: any): number { return 0.5; }
function calculateGitHubCorrectnessScore(data: any): number { return 0.5; }
function calculateGitHubBusFactorScore(data: any): number { return 0.5; }
function calculateGitHubResponsiveMaintainerScore(data: any): number { return 0.5; }
function calculateGitHubLicenseScore(data: any): number { return 0.5; }

