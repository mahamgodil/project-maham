import axios from 'axios';

const token = process.env.GITHUB_API_TOKEN;
//const repositoryUrl = 'https://api.github.com/repos/nytimes/covid-19-data'; // must be in form https://api.github.com/repos/${Owner}/${Name}

// Authenticate with GitHub
const headers = {
    Authorization: `Bearer ${token}`,
};

//busFactor();
//license();
//correctness();
//responsiveMaintainer();
//rampUp();

async function busFactor(repositoryUrl:string) {
  try {
    // Fetch repository information
    const repositoryResponse = await axios.get(repositoryUrl, { headers });
    const repositoryData = repositoryResponse.data;

    // Get the total number of commits in the repository
    var totalCommits:number = 0;

    // Fetch the list of contributors
    const contributorsUrl = repositoryData.contributors_url;
    const contributorsResponse = await axios.get(contributorsUrl, { headers });
    const contributorsData = contributorsResponse.data;

    // Calculate and count significant contributors
    contributorsData.forEach(function (contributor:any) {
        totalCommits += contributor.contributions;
        //console.log(contributor.contributions);
      });
    //console.log("Total commits: " + totalCommits);
    const significantContributors = contributorsData.filter(
      (contributor: any) => (contributor.contributions / totalCommits) * 100 > 5
    );

    //console.log(`Number of significant contributors: ${significantContributors.length}`);
    return significantContributors.length;
  } catch (error:any) {
    console.error('Error:', error.message);
  }
}

async function license(repositoryUrl:string) {
  try {
    const repositoryResponse = await axios.get(repositoryUrl, { headers });
    const repositoryData = repositoryResponse.data;

    const licenseUrl = repositoryUrl + "/license";
    const LicenseResponse = await axios.get(licenseUrl);
  
    // If the repository has a license, the response status will be 200 OK.
    // If the repository does not have a license, the response status will be 404 Not Found.
    if (LicenseResponse.status === 200) {
      //console.log('The repository has a license.');
      return 1;
    }
    else {
      console.log(`Unexpected response status: ${LicenseResponse.status}`);
    }
  } catch (error:any) {
    if (error.response.status === 404) {
      //console.log('The repository does not have a license.');
      return 0;
    } 
    else {
      console.log(`Unexpected response status: ${error.response.status}`);
    }
  }
}

async function correctness(repositoryUrl:string) {
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
  async function fetchAllIssues(page: number = 1) {
    try {
      const response = await axios.get(issuesUrl, { params: { ...params, page }, headers });
      const issues = response.data;
      totalIssues += issues.length;
      totalClosedIssues += issues.filter((issue: any) => issue.state === 'closed').length;

      // Fetch the next page if available
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextPage = page + 1;
        await fetchAllIssues(nextPage);
      } else {
        // All issues have been fetched, display the results
        const bugPercentage = (totalClosedIssues / totalIssues) * 100;
        //console.log(`Percentage of closed issues: ${bugPercentage.toFixed(2)}%`);
        return bugPercentage.toFixed(5);
      }
    } catch (error) {
      console.error('Error making API request:', error);
    }
  }
  fetchAllIssues();
}

async function responsiveMaintainer(repositoryUrl:string) {
  const repositoryResponse = await axios.get(repositoryUrl, { headers });
  const repositoryData = repositoryResponse.data;

  const issuesUrl = repositoryUrl + "/issues?state=all";
  const params = {
    state: 'all',
    per_page: 100, // Increase this value to retrieve more issues per page
    page: 1, // Start with page 1
  };
  let totalIssues = 0;
  let totalResponseTime = 0;
    
  async function fetchAllIssues(page: number = 1) {
    try {
      const response = await axios.get(issuesUrl, { params: { ...params, page }, headers });
      const issues = response.data;

      for (const issue of issues) {
        const commentsEndpoint = issue.comments_url;

        try {
          const response = await axios.get(commentsEndpoint, { headers });

          if (response.status === 200) {
            const comments = response.data;
            const maintainerComments = comments.filter(
              (comment: any) => comment.user.type === 'User');

            if (maintainerComments.length > 0) {
              const firstMaintainerComment = maintainerComments[0];
              const createdAt = new Date(issue.created_at);
              const respondedAt = new Date(firstMaintainerComment.created_at);
              const responseTime = respondedAt.getTime() - createdAt.getTime();
              totalResponseTime += ((responseTime / 1000) / 60) / 60; // milliseconds to minutes to hours
              totalIssues++;
            }
          }
        } catch (error) {
          console.error('Error fetching comments for issue:', error);
        }
      }
        // Fetch the next page if available
        const linkHeader = response.headers.link;
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextPage = page + 1;
          await fetchAllIssues(nextPage);
        } else {
          // All issues have been fetched, display the results
          const bugPercentage = totalResponseTime / totalIssues;
          //console.log(`Average response time of issues: ${bugPercentage.toFixed(2)}`);
          return bugPercentage.toFixed(5);
        }
    } catch (error) {
      console.error('Error making API request:', error);
    }
  }
  fetchAllIssues();
}

async function rampUp(repositoryUrl:string) {
  return -1;
}