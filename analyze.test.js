const axios = require('axios');
const { busFactor, license, correctness, responsiveMaintainer } = require('./metric');
const fs = require('fs');

jest.mock('axios');

function getMockDataPath(repositoryUrl, dataType) {
  const parts = repositoryUrl.split('/');
  const user = parts[parts.length - 2];
  const dirName = `repos_${user}`;
  return `${dirName}/${dataType}.json`;
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
      axios.get.mockResolvedValueOnce({ data: licenseMockData });

      const result = await license(repositoryUrl);
      expect(result).toBe(1);
    });

    it('should compute correctness based on issues', async () => {
      const issuesMockDataPage1 = loadMockData(repositoryUrl, 'issuesData_page1');
      axios.get.mockResolvedValueOnce({ data: issuesMockDataPage1 });

      const result = await correctness(repositoryUrl);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should compute responsiveness of maintainers', async () => {
      const issuesMockDataPage1 = loadMockData(repositoryUrl, 'issuesData_page1');
      const commentsMockDataIssueSample = loadMockData(repositoryUrl, 'commentsData_issueSample');
      axios.get.mockResolvedValueOnce({ data: issuesMockDataPage1 })
            .mockResolvedValueOnce({ data: commentsMockDataIssueSample });

      const result = await responsiveMaintainer(repositoryUrl);
      expect(result).toBeLessThanOrEqual(24);
    });
  });
});
