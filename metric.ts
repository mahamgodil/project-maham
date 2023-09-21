import axios from 'axios';
require('dotenv').config();
import fs from 'fs';
import path from 'path';
// https://www.npmjs.com/package/express
// https://www.npmjs.com/package/browserify

const token = process.env.GITHUB_API_TOKEN;
//const repositoryUrl = 'https://api.github.com/repos/nytimes/covid-19-data'; // must be in form https://api.github.com/repos/${Owner}/${Name}

// Authenticate with GitHub
const headers = {
  Authorization: `Bearer ${token}`,
};


export async function busFactor(repositoryUrl: string) {
  try {
    const repositoryResponse = await axios.get(repositoryUrl, { headers });
    const repositoryData = repositoryResponse.data;
    const [, , , user, repo] = repositoryUrl.split('/');

    // Directory name based on user and repo
    const dirName = `${user}_${repo}`;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }

    // Save repository data
    const repoFilename = path.join(dirName, 'repositoryData.json');
    fs.writeFileSync(repoFilename, JSON.stringify(repositoryData, null, 2));

    let totalCommits = 0;
    const contributorsUrl = repositoryData.contributors_url;
    const contributorsResponse = await axios.get(contributorsUrl, { headers });
    const contributorsData = contributorsResponse.data;

    const contributorsFilename = path.join(dirName, 'contributorsData.json');
    fs.writeFileSync(contributorsFilename, JSON.stringify(contributorsData, null, 2));



    contributorsData.forEach((contributor: any) => {
      totalCommits += contributor.contributions;
    });

    const significantContributors = contributorsData.filter(
      (contributor: any) => (contributor.contributions / totalCommits) * 100 > 5
    );

    console.log("BusFactor:", significantContributors.length);
    return significantContributors.length;
  } catch (error: any) {
    console.error('Error:', error.message);
    return -1;  // or throw the error if you want to handle it outside this function
  }
}

export async function license(repositoryUrl: string) {
  try {
    const licenseUrl = `${repositoryUrl}/license`;
    const LicenseResponse = await axios.get(licenseUrl, { headers });

    const [, , , user, repo] = repositoryUrl.split('/');
    const dirName = `${user}_${repo}`;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }

    const licenseFilename = path.join(dirName, 'licenseData.json');
    fs.writeFileSync(licenseFilename, JSON.stringify(LicenseResponse.data, null, 2));

    if (LicenseResponse.status === 200) {
      console.log('License: 1');
      return 1;
    } else {
      console.log(`Unexpected response status: ${LicenseResponse.status}`);
      return -1;
    }
  } catch (error: any) {
    if (error.response.status === 404) {
      return 0;
    } else {
      console.log(`Unexpected response status: ${error.response.status}`);
      return -1;
    }
  }
}


export async function correctness(repositoryUrl: string) {
  const repositoryResponse = await axios.get(repositoryUrl, { headers });
  const repositoryData = repositoryResponse.data;

  const issuesUrl = repositoryUrl + "/issues?state=all";
  const params = {
    state: 'all',
    per_page: 100, // Increase this value to retrieve more issues per page
    page: 1, // Start with page 1
  };
  let totalIssues = 0;
  let totalClosedIssues = 0;

  // Function to recursively fetch all issues
  async function fetchAllIssues(page: number = 1): Promise<number> {
    try {
      const response = await axios.get(issuesUrl, { params: { ...params, page }, headers });

      const [, , , user, repo] = repositoryUrl.split('/');
      const dirName = `${user}_${repo}`;
      if (!fs.existsSync(dirName)) {

        fs.mkdirSync(dirName);
      }

      fs.writeFileSync(path.join(dirName, `issuesData_page${page}.json`), JSON.stringify(response.data, null, 2));

      const issues = response.data;
      totalIssues += issues.length;
      totalClosedIssues += issues.filter((issue: any) => issue.state === 'closed').length;

      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextPage = page + 1;
        return await fetchAllIssues(nextPage);
      } else {
        const bugPercentage = (totalClosedIssues / totalIssues);
        console.log(`Correctness: ${bugPercentage.toFixed(5)}`);
        return bugPercentage;
      }
    } catch (error) {
      console.error('Error making API request:', error);
      return 0; // You might want to decide on a more appropriate default value
    }
  }

  return await fetchAllIssues();
}

export async function responsiveMaintainer(repositoryUrl: string) {

  const issuesUrl = `${repositoryUrl}/issues?state=all`;
  const params = {
    state: 'all',
    per_page: 100,
    page: 1,
  };
  let totalIssues = 0;
  let totalResponseTime = 0;

  async function fetchCommentsForIssue(issue: any) {
    try {
      const response = await axios.get(issue.comments_url, { headers });

      const [, , , user, repo] = repositoryUrl.split('/');
      const dirName = `${user}_${repo}`;

      // Ensure the directory exists
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
      }

      // Save comments data to the file
      const commentsFilename = path.join(dirName, `commentsData_issue${issue.number}.json`);
      fs.writeFileSync(commentsFilename, JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        const comments = response.data;
        const maintainerComments = comments.filter((comment: any) => comment.user.type === 'User');
        if (maintainerComments.length > 0) {
          const firstMaintainerComment = maintainerComments[0];
          const createdAt = new Date(issue.created_at);
          const respondedAt = new Date(firstMaintainerComment.created_at);
          const responseTime = respondedAt.getTime() - createdAt.getTime();
          totalResponseTime += ((responseTime / 1000) / 60) / 60;
          totalIssues++;
        }
      }
    } catch (error) {
      console.error('Error fetching comments for issue:', error);
    }
  }

  async function fetchAllIssues(page: number = 1): Promise<number> {
    try {
      const response = await axios.get(issuesUrl, { params: { ...params, page }, headers });


      const issues = response.data;

      await Promise.all(issues.slice(0, 10).map(fetchCommentsForIssue));

      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextPage = page + 1;
        return await fetchAllIssues(nextPage);
      } else {
        const averageResponseTime = totalResponseTime / totalIssues / 100;
        console.log(`ResponsiveMaintainer: ${averageResponseTime}`);
        return averageResponseTime;
      }
    } catch (error) {
      console.error('Error making API request:', error);
      return 0; // You might want to decide on a more appropriate default value
    }
  }

  return await fetchAllIssues();
}




export async function rampUp(repositoryUrl: string) {
  return -1;
}