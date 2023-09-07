import axios from 'axios';

const token = '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';
const repositoryUrl = 'https://api.github.com/repos/nytimes/covid-19-data'; // must be in form https://api.github.com/repos/${Owner}/${Name}

// Authenticate with GitHub
const headers = {
    Authorization: `Bearer ${token}`,
};

async function getNumOfSigContrib() {
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

    console.log(`Number of significant contributors: ${significantContributors.length}`);
  } catch (error:any) {
    console.error('Error:', error.message);
  }
}

async function checkRepoLicense() {
    try {
        const repositoryResponse = await axios.get(repositoryUrl, { headers });
        const repositoryData = repositoryResponse.data;

        const licenseUrl = repositoryUrl + "/license";
        const LicenseResponse = await axios.get(licenseUrl);
  
        // If the repository has a license, the response status will be 200 OK.
        // If the repository does not have a license, the response status will be 404 Not Found.
        if (LicenseResponse.status === 200) {
            console.log('The repository has a license.');
        }
        else {
            console.log(`Unexpected response status: ${LicenseResponse.status}`);
        }
    } catch (error:any) {
        if (error.response.status === 404) {
            console.log('The repository does not have a license.');
        } 
        else {
            console.log(`Unexpected response status: ${error.response.status}`);
        }
    }
  }

getNumOfSigContrib();
checkRepoLicense();
