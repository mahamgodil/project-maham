import axios from 'axios';
import path from 'path';
import winston from 'winston';
const { clone } = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');
const tmp = require('tmp');
// Extracting environment variables
const logLevels = ['error', 'info', 'debug'];
const logLevel = logLevels[Number(process.env.LOG_LEVEL) || 0];
const logFile = process.env.LOG_FILE;
const token = process.env.GITHUB_TOKEN;

// Check if the necessary environment variables are set


const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: logFile })
    ]
});

if (!token || !token.trim()) {
  logger.error('GITHUB_TOKEN environment variable is not set or is an empty string.');
  process.exit(1);
}

if (!logFile || !logFile.trim()) {
  logger.error('LOG_FILE environment variable is not set or is an empty string.');
  process.exit(1);
} else if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '');
}

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

    // console.log("BusFactor:", significantContributors.length);
    var sigLength = significantContributors.length;
    if(sigLength > 10) {
      return 1;
    }
    else {
      return parseFloat((sigLength / 10).toFixed(1)) ;
    }
  } catch (error: any) {
    // console.error('Error:', error.message);
    logger.error('Error:', error.message);
    return -1;  // or throw the error if you want to handle it outside this function
  }
}

export async function license(repositoryUrl: string) {
  try {

    const licenseUrl = `${repositoryUrl}/license`;
    // console.log("licenseUrl", licenseUrl);
    const LicenseResponse = await axios.get(licenseUrl, { headers });
    // console.log("LicenseResponse", LicenseResponse);

    const [, , , user, repo] = repositoryUrl.split('/');
    const dirName = `${user}_${repo}`;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }

    const licenseFilename = path.join(dirName, 'licenseData.json');
    const sanitizedResponse = {
      data: LicenseResponse.data,
      status: LicenseResponse.status
    };

    fs.writeFileSync(licenseFilename, JSON.stringify(sanitizedResponse, null, 2));


    if (LicenseResponse.data && LicenseResponse.data.license) {
      // console.log('License:', LicenseResponse.data.license.name);
      return 1;
    } else {
      // console.log('No license found');
      return 0;
    }

  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 404) {
        // console.log('No license found');
        const [, , , user, repo] = repositoryUrl.split('/');
        const dirName = `${user}_${repo}`;
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName);
        }
        const licenseFilename = path.join(dirName, 'licenseData.json');
        const sanitizedResponse = {
          data: error.response.data,
          status: error.response.status
        };
        fs.writeFileSync(licenseFilename, JSON.stringify(sanitizedResponse, null, 2));
        return 0;
      } else {
        // console.log(`Unexpected response status: ${error.response.status}`);
        logger.error(`Unexpected response status: ${error.response.status}`);
        return -1;
      }
    } else {
      // console.error('Error:', error.message);
      logger.error('Error:', error.message);
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
        // console.log(`Correctness: ${bugPercentage.toFixed(5)}`);
        logger.info(`Correctness: ${bugPercentage.toFixed(5)}`);
        return bugPercentage;
      }
    } catch (error) {
      // console.error('Error making API request:', error);
      logger.error('Error making API request:', error);
      return 0; // You might want to decide on a more appropriate default value
    }
  }

  var perc = await fetchAllIssues();
  return parseFloat((perc * .9).toFixed(1));
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
      // console.error('Error fetching comments for issue:', error);
      logger.error('Error fetching comments for issue:', error);
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
        // console.log(`ResponsiveMaintainer: ${averageResponseTime}`);
        logger.info(`ResponsiveMaintainer: ${averageResponseTime}`);
        if(averageResponseTime > 10) {
          return 0;
        }
        else {
          return parseFloat(((10 - averageResponseTime) / 10).toFixed(1));
        }
      }
    } catch (error) {
      // console.error('Error making API request:', error);
      logger.error('Error making API request:', error);
      return 0; // You might want to decide on a more appropriate default value
    }
  }

  return await fetchAllIssues();
}
function timeoutPromise(ms: number): Promise<void> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms} milliseconds`));
    }, ms);
  });
}

async function getFileSize(filePath: string): Promise<number> {
  // console.log("Getting file size");
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
} catch (error) {
    // console.error(`Error processing file ${filePath}:`, error);
    logger.error(`Error processing file ${filePath}:`, error);
    return 0;
}
  
}

async function getDirectorySize(directory: string, excludeFile?: string): Promise<number> {
  // console.log("Getting directory size");
  const files = await fs.promises.readdir(directory);
  let size = 0;

  for (const file of files) {
    // console.log("Getting file size");
    if (excludeFile && path.join(directory, file) === excludeFile) continue;

    const filePath = path.join(directory, file);
    const stats = await fs.promises.stat(filePath);
    // console.log("Stats:", stats);

    if (stats.isDirectory()) {
      size += await getDirectorySize(filePath, excludeFile);
    } else {
      size += stats.size;
    }
  }

  return size;
}

export async function cloneRepository(repositoryUrl: string): Promise<string> {
  try {
    const tempDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'temp-' });
    const localDir = tempDir.name;
    const userAgent = 'UAgent';
    const newURL = repositoryUrl.replace('api.github.com/repos', 'github.com');
    // console.log("Awaiting clone");
    logger.info("Awaiting clone");

    await Promise.race([
      clone({
        fs,
        http,
        url: newURL,
        dir: localDir,
        onAuth: () => ({ token }),
        headers: {
          'User-Agent': userAgent,
        },
      }),
      timeoutPromise(10000)
    ]);
    // console.log("Repository cloned to:", localDir);


    // console.log("Cloned Repo");
    logger.info("Cloned Repo");
    return localDir; // Return the local directory path where repo was cloned
  } catch (error) {
    if (error instanceof Error) {
      // console.error('Error cloning repository:', error.message);
      logger.error('Error cloning repository:', error.message);
    } else {
      // console.error('Error cloning repository:', error);
      logger.error('Error cloning repository:', error);

    }
    return '';
  }
}



export async function rampUp(repositoryUrl: string): Promise<number> {
  try {
    const tempDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'temp-' });
    const localDir = await cloneRepository(repositoryUrl); // Call cloneRepository instead of rampUp

    if (!localDir) {
      throw new Error('Failed to clone repository');
    }

    const readmePaths = [
      path.join(localDir, 'README.md'),
      path.join(localDir, 'readme.md'),
      path.join(localDir, 'README.MD')
    ];

    let readmeSize = 0;
    for (const readmePath of readmePaths) {
      try {
        // console.log("Getting file size: ", readmePath);
        logger.debug("Getting file size: ", readmePath);
        readmeSize = await getFileSize(readmePath);
        break; // If a valid README file is found, exit the loop
      } catch (err) {
        // console.error('Error getting README file size:', err);
        logger.error('Error getting README file size:', err);
        // File not found or another error. Continue to next possible README path
      }
    }

    const codebaseSize = await getDirectorySize(localDir, readmePaths.find(p => fs.existsSync(p)));

    var ratio = Math.log(readmeSize + 1) / Math.log(codebaseSize + 1);

    tempDir.removeCallback();

    return parseFloat(ratio.toFixed(1));
  } catch (error) {
    if (error instanceof Error) {
      // console.error('Error analyzing repository:', error.message);
      logger.error('Error analyzing repository:', error.message);
    } else {
      // console.error('Error analyzing repository:', error);
      logger.error('Error analyzing repository:', error);
    }
    return -1;
  }
}