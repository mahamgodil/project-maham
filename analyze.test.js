const axios = require('axios');
const { busFactor, license, correctness, responsiveMaintainer } = require('./metric');
const fs = require('fs');

process.env.GITHUB_TOKEN = "mock-token";
process.env.LOG_FILE = "./mock-log.log";

jest.mock('axios');
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
  })),
  format: {
      simple: jest.fn()
  },
  transports: {
      Console: jest.fn(),
      File: jest.fn()
  }
}));


function getMockDataPath(repositoryUrl, dataType) {
  const parts = repositoryUrl.split('/');
  const user = parts[parts.length - 2];
  const dirName = `repos_${user}`;
  return `${dirName}/${dataType}.json`;
}

function getNumberOfMockPages(starts = 'issuesData_page', repositoryUrl) {
  const dirPath = getMockDataPath(repositoryUrl, '').slice(0, -5); // Remove the '.json' to get the directory path
  const files = fs.readdirSync(dirPath);
  const issuesFiles = files.filter(file => file.startsWith(starts));
  return issuesFiles.length;
}


function loadMockData(repositoryUrl, dataType) {
  const filePath = getMockDataPath(repositoryUrl, dataType);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('GitHub Repository Metrics', () => {
  const repositoryUrls = fs.readFileSync('packages.txt', 'utf-8').split('\n').filter(Boolean);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  repositoryUrls.forEach(repositoryUrl => {
    it('should compute the bus factor correctly', async () => {
      const repoMockData = loadMockData(repositoryUrl, 'repositoryData');
      const contributorsMockData = loadMockData(repositoryUrl, 'contributorsData');

      axios.get.mockResolvedValueOnce({ data: repoMockData })
            .mockResolvedValueOnce({ data: contributorsMockData });

      const result = await busFactor(repositoryUrl);
      expect(result).toBeGreaterThan(0);
    });

    it('should determine the license status correctly', async () => {
      const licenseMockData = loadMockData(repositoryUrl, 'licenseData');
      // console.log(licenseMockData);
      // console log status
      // console.log(licenseMockData.status);
      axios.get.mockResolvedValueOnce({
        data: licenseMockData.data,
        status: licenseMockData.status
    });
    

      const result = await license(repositoryUrl);
    // it can be 1 or 0
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should compute correctness based on issues', async () => {
      const numberOfPages = getNumberOfMockPages(repositoryUrl);

      for (let i = 1; i <= numberOfPages; i++) {
        const issuesMockData = loadMockData(repositoryUrl, `issuesData_page${i}`);
        axios.get.mockResolvedValueOnce({ data: issuesMockData });
      }
      // const issuesMockDataPage1 = loadMockData(repositoryUrl, 'issuesData_page1');
      // axios.get.mockResolvedValueOnce({ data: issuesMockDataPage1 });

      const result = await correctness(repositoryUrl);
      expect(result).toBeLessThanOrEqual(1);
    });

      
    // RESPONSIVE MAINTAINER
    it('should compute responsiveness of maintainers', async () => {
      const numIssuePages = getNumberOfMockPages('issuesData_page', repositoryUrl);
    
      // Mock data for each issue page
      for (let i = 1; i <= numIssuePages; i++) {
        const issuesMockData = loadMockData(repositoryUrl, `issuesData_page${i}`);
        axios.get.mockResolvedValueOnce({ data: issuesMockData });
    
        // For each issue in the current page (only first 10), mock the comments data
        issuesMockData.slice(0, 10).forEach(issue => {
          const commentsMockData = loadMockData(repositoryUrl, `commentsData_issue${issue.number}`);
          axios.get.mockResolvedValueOnce({ data: commentsMockData });
        });
      }
    
      const result = await responsiveMaintainer(repositoryUrl);
      expect(result).toBeLessThanOrEqual(24);
    });
    
  });
});
